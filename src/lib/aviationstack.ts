import type { FlightLookupResult } from './types'

const BASE = 'https://api.aviationstack.com/v1'

interface ASFlight {
  flight_date: string
  flight_status: string
  departure: {
    iata: string
    scheduled: string
  }
  arrival: {
    iata: string
    scheduled: string
  }
  airline: {
    name: string
    iata: string
  }
  flight: {
    iata: string
    number: string
  }
  aircraft: {
    iata: string | null
  } | null
}

interface ASResponse {
  data: ASFlight[]
}

// AviationStack /flights endpoint — used as fallback when FlightAware has no data
// for the specific date (typically flights >3 days out).
export async function lookupFlightSchedule(
  flightIata: string,
  date: string // YYYY-MM-DD
): Promise<FlightLookupResult | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) return null

  let flight: ASFlight | undefined

  // Try with specific date (paid feature — 403 on free tier, skip gracefully)
  const dateUrl = `${BASE}/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(flightIata)}&flight_date=${date}&limit=1`
  const dateRes = await fetch(dateUrl, { next: { revalidate: 0 } })
  if (dateRes.ok) {
    const data: ASResponse = await dateRes.json()
    flight = data.data?.[0]
  }

  // Fall back to most recent instance and use its times as a schedule template
  if (!flight) {
    const url = `${BASE}/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(flightIata)}&limit=1`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const data: ASResponse = await res.json()
    flight = data.data?.[0]
    if (!flight) return null
  }

  // AviationStack returns local airport times incorrectly labeled as +00:00.
  // Parse them as wall-clock times (no timezone), then build a Date using the
  // LOCAL time constructor so the resulting UTC is correct for the user's timezone.
  const depH = parseInt(flight.departure.scheduled.slice(11, 13))
  const depM = parseInt(flight.departure.scheduled.slice(14, 16))
  const arrH = parseInt(flight.arrival.scheduled.slice(11, 13))
  const arrM = parseInt(flight.arrival.scheduled.slice(14, 16))

  // Return as bare local-time strings (no timezone suffix) so toDatetimeLocal
  // passes them through without applying a UTC offset on top.
  const pad = (n: number) => String(n).padStart(2, '0')
  const depStr = `${date}T${pad(depH)}:${pad(depM)}:00`

  // Preserve overnight arrivals
  let arrDay = date
  const depMinutes = depH * 60 + depM
  const arrMinutes = arrH * 60 + arrM
  if (arrMinutes < depMinutes) {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    arrDay = d.toISOString().slice(0, 10)
  }
  const arrStr = `${arrDay}T${pad(arrH)}:${pad(arrM)}:00`

  return {
    flight_number: flight.flight.iata ?? flightIata,
    airline: flight.airline.name,
    origin_code: flight.departure.iata,
    destination_code: flight.arrival.iata,
    departure_time: depStr,
    arrival_time: arrStr,
    aircraft_type: flight.aircraft?.iata ?? null,
    status: 'scheduled',
    actual_departure_time: null,
    actual_arrival_time: null,
    estimated_arrival_time: null,
    progress_percent: null,
    departure_delay: null,
    arrival_delay: null,
    departure_gate: null,
    arrival_gate: null,
    route: null,
    fa_flight_id: null,
    last_lat: null,
    last_lon: null,
    last_heading: null,
    last_altitude: null,
  }
}
