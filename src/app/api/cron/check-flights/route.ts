import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { lookupFlight, getFlightTrack, getInboundFlight } from '@/lib/flightaware'
import { getAirportWeather } from '@/lib/weather'
import type { Flight } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Fetch all flights that are still active
  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .in('status', ['scheduled', 'taxiing', 'in_air'])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!flights?.length) {
    return NextResponse.json({ checked: 0 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const updates: { id: string; [key: string]: unknown }[] = []

  const windowMs = 3 * 60 * 60 * 1000 // 3 hours in ms
  let skipped = 0

  for (const flight of flights as Flight[]) {
    try {
      // Only call API for scheduled flights within 3h of departure (or already past)
      if (flight.status === 'scheduled') {
        const depTime = new Date(flight.departure_time).getTime()
        if (depTime > Date.now() + windowMs) {
          skipped++
          continue
        }
      }

      const date = (flight.departure_time ?? today).slice(0, 10)
      const fresh = await lookupFlight(flight.flight_number, date, flight.fa_flight_id)
      if (!fresh) continue

      console.log(`[${flight.flight_number}] status=${fresh.status} gate=${fresh.departure_gate ?? 'null'} progress=${fresh.progress_percent}`)

      const departureGateChanged = !!(fresh.departure_gate && fresh.departure_gate !== flight.departure_gate && flight.departure_gate !== null)
      const arrivalGateChanged = !!(fresh.arrival_gate && fresh.arrival_gate !== flight.arrival_gate && flight.arrival_gate !== null)

      // Fetch track for active flights
      let trackPoints: Array<{ lat: number; lon: number }> | null = null
      const faId = fresh.fa_flight_id ?? flight.fa_flight_id
      if (faId && (fresh.status === 'in_air' || fresh.status === 'taxiing')) {
        try {
          trackPoints = await getFlightTrack(faId)
        } catch (err) {
          console.error(`Error fetching track for ${flight.flight_number}:`, err)
        }
      }

      // Check inbound aircraft for scheduled flights within 6h of departure
      let inboundDelayMins: number | null = null
      let inboundOriginCode: string | null = null
      let inboundFaFlightId: string | null = null

      if (fresh.status === 'scheduled') {
        const depTime = new Date(flight.departure_time)
        const sixHoursMs = 6 * 60 * 60 * 1000
        if (depTime.getTime() - Date.now() < sixHoursMs) {
          try {
            const inbound = await getInboundFlight(
              flight.origin_code,
              flight.airline,
              depTime,
            )
            if (inbound) {
              inboundDelayMins = inbound.delayMins
              inboundOriginCode = inbound.originCode
              inboundFaFlightId = inbound.faFlightId
              console.log(`[${flight.flight_number}] inbound=${inbound.originCode} delay=${inbound.delayMins}m`)
            }
          } catch (err) {
            console.error(`Error fetching inbound for ${flight.flight_number}:`, err)
          }
        }
      }

      // Fetch destination weather for active (non-landed) flights
      let destTempC: number | null = null
      let destWeatherCode: number | null = null
      if (fresh.status !== 'landed' && fresh.status !== 'cancelled') {
        try {
          const wx = await getAirportWeather(flight.destination_code)
          if (wx) {
            destTempC = wx.tempC
            destWeatherCode = wx.code
          }
        } catch {
          // non-fatal
        }
      }

      // Always update tracking fields
      updates.push({
        id: flight.id,
        status: fresh.status,
        actual_departure_time: fresh.actual_departure_time,
        actual_arrival_time: fresh.actual_arrival_time,
        estimated_arrival_time: fresh.estimated_arrival_time,
        progress_percent: fresh.progress_percent,
        departure_delay: fresh.departure_delay,
        arrival_delay: fresh.arrival_delay,
        departure_gate: fresh.departure_gate,
        arrival_gate: fresh.arrival_gate,
        baggage_claim: fresh.baggage_claim,
        departure_gate_changed: departureGateChanged,
        arrival_gate_changed: arrivalGateChanged,
        fa_flight_id: faId ?? null,
        inbound_delay_mins: inboundDelayMins,
        inbound_origin_code: inboundOriginCode,
        inbound_fa_flight_id: inboundFaFlightId,
        last_lat: fresh.last_lat,
        last_lon: fresh.last_lon,
        last_heading: fresh.last_heading,
        last_altitude: fresh.last_altitude,
        ...(destTempC !== null ? { destination_temp_c: destTempC, destination_weather_code: destWeatherCode } : {}),
        ...(trackPoints !== null ? { track_points: trackPoints } : {}),
      })
    } catch (err) {
      console.error(`Error checking flight ${flight.flight_number}:`, err)
    }
  }

  // Write updates
  for (const update of updates) {
    const { id, ...fields } = update
    await supabase.from('flights').update(fields).eq('id', id)
  }

  return NextResponse.json({
    checked: flights.length - skipped,
    skipped,
    updated: updates.length,
  })
}
