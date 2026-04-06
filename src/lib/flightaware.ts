import type { FlightLookupResult, FlightStatus } from './types'

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi'

interface AeroAPIFlight {
  ident: string
  operator: string
  origin: { code_iata: string }
  destination: { code_iata: string }
  scheduled_out: string
  scheduled_in: string
  aircraft_type: string | null
  status: string
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

export async function lookupFlight(
  flightNumber: string,
  date: string // YYYY-MM-DD
): Promise<FlightLookupResult | null> {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) throw new Error('FLIGHTAWARE_API_KEY is not set')

  // Search a 24-hour window starting at the given date
  const start = `${date}T00:00:00Z`
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  const end = `${nextDay.toISOString().slice(0, 10)}T00:00:00Z`

  const url = `${AEROAPI_BASE}/flights/${encodeURIComponent(flightNumber)}?start=${start}&end=${end}`

  const res = await fetch(url, {
    headers: { 'x-apikey': apiKey },
    next: { revalidate: 0 }, // always fresh
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
  }
}
