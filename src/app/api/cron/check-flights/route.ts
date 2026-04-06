import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { lookupFlight } from '@/lib/flightaware'
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
    .in('status', ['scheduled', 'in_air'])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!flights?.length) {
    return NextResponse.json({ checked: 0 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const notifications: { flight_id: string; user_id: string; message: string }[] = []
  const updates: { id: string; [key: string]: unknown }[] = []

  for (const flight of flights as Flight[]) {
    try {
      const date = (flight.departure_time ?? today).slice(0, 10)
      const fresh = await lookupFlight(flight.flight_number, date)
      if (!fresh) continue

      const changes: string[] = []

      if (fresh.status !== flight.status) {
        const labels: Record<string, string> = {
          scheduled: 'scheduled',
          in_air: 'in the air ✈️',
          landed: 'landed',
          cancelled: 'cancelled ❌',
        }
        changes.push(`${flight.flight_number} is now ${labels[fresh.status] ?? fresh.status}`)
      }

      if (fresh.departure_gate && fresh.departure_gate !== flight.departure_gate) {
        changes.push(`Departure gate: ${fresh.departure_gate}`)
      }

      if (fresh.arrival_gate && fresh.arrival_gate !== flight.arrival_gate) {
        changes.push(`Arrival gate: ${fresh.arrival_gate}`)
      }

      const newDelay = fresh.arrival_delay ?? fresh.departure_delay ?? null
      const oldDelay = flight.arrival_delay ?? flight.departure_delay ?? null
      if (newDelay !== null && newDelay !== oldDelay) {
        if (newDelay === 0) {
          changes.push(`${flight.flight_number} is now on time`)
        } else if (newDelay > 0) {
          changes.push(`${flight.flight_number} delayed ${newDelay}m`)
        }
      }

      if (changes.length > 0) {
        notifications.push({
          flight_id: flight.id,
          user_id: flight.user_id,
          message: `✈️ ${flight.origin_code}→${flight.destination_code}: ${changes.join(' · ')}`,
        })
      }

      const departureGateChanged = !!(fresh.departure_gate && fresh.departure_gate !== flight.departure_gate && flight.departure_gate !== null)
      const arrivalGateChanged = !!(fresh.arrival_gate && fresh.arrival_gate !== flight.arrival_gate && flight.arrival_gate !== null)

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
        departure_gate_changed: departureGateChanged,
        arrival_gate_changed: arrivalGateChanged,
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

  // Write notifications
  if (notifications.length > 0) {
    await supabase.from('flight_notifications').insert(notifications)
  }

  return NextResponse.json({
    checked: flights.length,
    updated: updates.length,
    notifications: notifications.length,
  })
}
