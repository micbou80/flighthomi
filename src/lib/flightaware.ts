import type { FlightLookupResult, FlightStatus } from './types'

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi'

interface AeroAPIPosition {
  latitude: number
  longitude: number
  altitude: number
  heading: number | null
  groundspeed: number
  timestamp: string
  altitude_change: string
  update_type: string
}

interface AeroAPIFlight {
  fa_flight_id: string | null
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
  baggage_claim: string | null
  route: string | null
  last_position: AeroAPIPosition | null
}

interface AeroAPIResponse {
  flights: AeroAPIFlight[]
}

interface TrackResponse {
  positions: AeroAPIPosition[]
}

function mapStatus(raw: string): FlightStatus {
  const s = raw.toLowerCase()
  if (s.includes('taxi')) return 'taxiing'
  if (s.includes('en route') || s.includes('departed') || s.includes('takeoff')) return 'in_air'
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
  date: string, // YYYY-MM-DD
  faFlightId?: string | null,
): Promise<FlightLookupResult | null> {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) throw new Error('FLIGHTAWARE_API_KEY is not set')

  // Querying by fa_flight_id returns the specific flight with complete data
  // (including gate), whereas searching by ident+date sometimes omits gate.
  let url: string
  if (faFlightId) {
    url = `${AEROAPI_BASE}/flights/${encodeURIComponent(faFlightId)}`
  } else {
    const start = `${date}T00:00:00Z`
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    const end = `${nextDay.toISOString().slice(0, 10)}T00:00:00Z`
    url = `${AEROAPI_BASE}/flights/${encodeURIComponent(flightNumber)}?start=${start}&end=${end}`
  }

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

  const pos = flight.last_position

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
    baggage_claim: flight.baggage_claim ?? null,
    route: flight.route ?? null,
    fa_flight_id: flight.fa_flight_id ?? null,
    last_lat: pos?.latitude ?? null,
    last_lon: pos?.longitude ?? null,
    last_heading: pos?.heading ?? null,
    last_altitude: pos?.altitude ?? null,
  }
}

export interface InboundFlight {
  faFlightId: string
  originCode: string
  delayMins: number | null
  status: string
  estimatedIn: string | null
}

/**
 * Finds the most recent arrival at an airport by a given operator within a
 * time window. Used to detect delays in the inbound aircraft before the
 * outbound departure board reflects them.
 *
 * Returns null if the API is unavailable or no matching arrival is found.
 */
export async function getInboundFlight(
  airportCode: string,
  operator: string, // e.g. 'KLM', 'Lufthansa'
  beforeTime: Date,
  windowHours = 6,
): Promise<InboundFlight | null> {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) return null

  const start = new Date(beforeTime.getTime() - windowHours * 60 * 60 * 1000).toISOString()
  const end = beforeTime.toISOString()

  const url =
    `${AEROAPI_BASE}/airports/${encodeURIComponent(airportCode)}/flights/arrivals` +
    `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&max_pages=1&type=Airline`

  try {
    const res = await fetch(url, {
      headers: { 'x-apikey': apiKey },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null

    const data = await res.json()
    const arrivals: AeroAPIFlight[] = data.arrivals ?? []

    // Find most recent arrival by same operator (most likely inbound aircraft)
    const match = arrivals
      .filter((a) => a.operator?.toLowerCase().includes(operator.toLowerCase().slice(0, 4)))
      .sort((a, b) => {
        const ta = new Date(a.scheduled_in ?? a.actual_on ?? 0).getTime()
        const tb = new Date(b.scheduled_in ?? b.actual_on ?? 0).getTime()
        return tb - ta // most recent first
      })[0]

    if (!match || !match.fa_flight_id) return null

    return {
      faFlightId: match.fa_flight_id,
      originCode: match.origin?.code_iata ?? '',
      delayMins: secToMin(match.arrival_delay),
      status: match.status ?? '',
      estimatedIn: match.estimated_in ?? null,
    }
  } catch {
    return null
  }
}

export async function getFlightTrack(
  faFlightId: string
): Promise<Array<{ lat: number; lon: number }>> {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) throw new Error('FLIGHTAWARE_API_KEY is not set')

  const url = `${AEROAPI_BASE}/flights/${encodeURIComponent(faFlightId)}/track`

  const res = await fetch(url, {
    headers: { 'x-apikey': apiKey },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`FlightAware track API error: ${res.status}`)
  }

  const data: TrackResponse = await res.json()
  return (data.positions ?? []).map((p) => ({ lat: p.latitude, lon: p.longitude }))
}
