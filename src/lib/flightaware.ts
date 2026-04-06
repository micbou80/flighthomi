import type { FlightLookupResult, FlightStatus } from './types'

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi'

interface AeroAPIFlight {
  ident: string
  operator: string
  origin: { code_iata: string }
  destination: { code_iata: string }
  scheduled_out: string
  scheduled_in: string
  actual_off: string | null   // wheels up
  actual_on: string | null    // wheels down
  estimated_in: string | null // estimated gate arrival
  aircraft_type: string | null
  status: string
  progress_percent: number | null
  departure_delay: number | null  // seconds
  arrival_delay: number | null    // seconds
  gate_origin: string | null
  gate_destination: string | null
  route: string | null
}

interface AeroAPIResponse {
  flights: AeroAPIFlight[]
}

function mapStatus(raw: string): FlightStatus {
  const s = raw.toLowerCase()
  if (s.includes('en route') || s.includes('departed')) return 'in_air'
  if (s.includes('arrived') || s.includes('landed')) return 'landed'
  if (s.includes('cancelled') || s.includes('canceled')) return 'cancelled'
  return 'scheduled'
}

function secToMin(seconds: number | null): number | null {
  if (seconds == null) return null
  return Math.round(seconds / 60)
}

export async function lookupFlight(
  flightNumber: string,
  date: string // YYYY-MM-DD
): Promise<FlightLookupResult | null> {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) throw new Error('FLIGHTAWARE_API_KEY is not set')

  const start = `${date}T00:00:00Z`
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  const end = `${nextDay.toISOString().slice(0, 10)}T00:00:00Z`

  const url = `${AEROAPI_BASE}/flights/${encodeURIComponent(flightNumber)}?start=${start}&end=${end}`

  const res = await fetch(url, {
    headers: { 'x-apikey': apiKey },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`FlightAware API error: ${res.status}`)
  }

  const data: AeroAPIResponse = await res.json()
  const flight = data.flights?.[0]
  if (!flight) return null

  return {
    flight_number: flight.ident,
    airline: flight.operator,
    origin_code: flight.origin?.code_iata ?? '',
    destination_code: flight.destination?.code_iata ?? '',
    departure_time: flight.scheduled_out,
    arrival_time: flight.scheduled_in,
    aircraft_type: flight.aircraft_type ?? null,
    status: mapStatus(flight.status ?? ''),
    actual_departure_time: flight.actual_off ?? null,
    actual_arrival_time: flight.actual_on ?? null,
    estimated_arrival_time: flight.estimated_in ?? null,
    progress_percent: flight.progress_percent ?? null,
    departure_delay: secToMin(flight.departure_delay),
    arrival_delay: secToMin(flight.arrival_delay),
    departure_gate: flight.gate_origin ?? null,
    arrival_gate: flight.gate_destination ?? null,
    route: flight.route ?? null,
  }
}
