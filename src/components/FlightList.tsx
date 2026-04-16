'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Plane } from 'lucide-react'
import FlightCard from './FlightCard'
import PastTripCard from './PastTripCard'
import ShareItinerary from './ShareItinerary'
import type { Flight } from '@/lib/types'

interface FlightListProps {
  flights: Flight[]
  readOnly?: boolean
}

// Airports in the same metro area — treat as interchangeable for trip grouping
const METRO: Record<string, string> = {
  LHR: 'LON', LGW: 'LON', STN: 'LON', LTN: 'LON', LCY: 'LON',
  CDG: 'PAR', ORY: 'PAR',
  FCO: 'ROM', CIA: 'ROM',
  LIN: 'MIL', MXP: 'MIL', BGY: 'MIL',
  BER: 'BER', TXL: 'BER', SXF: 'BER',
  OSL: 'OSL', TRF: 'OSL',
  ARN: 'STO', BMA: 'STO', NYO: 'STO',
  JFK: 'NYC', EWR: 'NYC', LGA: 'NYC',
  LAX: 'LAX', BUR: 'LAX', LGB: 'LAX', SNA: 'LAX',
  SFO: 'SFB', OAK: 'SFB', SJC: 'SFB',
}
function metro(code: string): string { return METRO[code] ?? code }

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

function isBeforeToday(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  return d < today
}

// Group flights into trips. A trip ends when a flight returns to the trip's
// starting airport (home base). e.g. AMS→LHR + LHR→AMS = one London trip.
// The next AMS→OSL then starts a fresh trip.
function groupIntoTrips(flights: Flight[]): Flight[][] {
  if (flights.length === 0) return []
  const groups: Flight[][] = []
  let current: Flight[] = [flights[0]]

  for (let i = 1; i < flights.length; i++) {
    const prev = current[current.length - 1]
    const curr = flights[i]
    const tripHome = current[0].origin_code

    if (metro(prev.destination_code) === metro(tripHome)) {
      // Previous flight returned home — close trip, start a new one
      groups.push(current)
      current = [curr]
    } else if (metro(curr.origin_code) === metro(prev.destination_code)) {
      // Continues from where the last leg landed — same trip
      current.push(curr)
    } else {
      // Chain broken — start a new trip
      groups.push(current)
      current = [curr]
    }
  }
  groups.push(current)
  return groups
}

function tripTitle(flights: Flight[]): string {
  const home = flights[0].origin_code
  const seen = new Set<string>()
  const uniqueDests = flights.map((f) => f.destination_code).filter((d) => {
    if (d === home || seen.has(d)) return false
    seen.add(d)
    return true
  })
  return uniqueDests.length > 0 ? uniqueDests.join(' · ') : flights[flights.length - 1].destination_code
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

function tripDateRange(flights: Flight[]): string {
  const first = fmtShortDate(flights[0].departure_time)
  const last = fmtShortDate(flights[flights.length - 1].departure_time)
  return first === last ? first : `${first} – ${last}`
}

// Collapsible trip group used in Upcoming and Past
function TripGroup({
  flights,
  readOnly,
  defaultOpen = false,
}: {
  flights: Flight[]
  readOnly: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const title = tripTitle(flights)
  const dateRange = tripDateRange(flights)
  const legs = flights.length

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Plane className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="text-left">
            <span className="text-sm font-semibold text-white">{title}</span>
            <span className="ml-3 text-xs text-gray-400">{dateRange}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">{legs} {legs === 1 ? 'flight' : 'flights'}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-700/50 px-3 pb-3 pt-3 space-y-3">
          {flights.map((f) => (
            <FlightCard key={f.id} flight={f} readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FlightList({ flights, readOnly = false }: FlightListProps) {
  const [pastOpen, setPastOpen] = useState(false)
  const now = new Date()

  const nowToday = flights.filter(
    (f) =>
      f.status === 'in_air' ||
      f.status === 'taxiing' ||
      (f.status === 'scheduled' && isSameLocalDay(f.departure_time, now))
  )
  const upcoming = flights.filter(
    (f) =>
      f.status === 'scheduled' &&
      !isSameLocalDay(f.departure_time, now) &&
      !isBeforeToday(f.departure_time, now)
  )
  const past = flights
    .filter((f) => f.status === 'landed' || f.status === 'cancelled')
    .slice()
    .reverse()

  const upcomingTrips = groupIntoTrips(upcoming)
  const pastTrips = groupIntoTrips(past)

  if (flights.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">✈️</p>
        <p className="text-gray-400 mb-4">No flights yet</p>
        {!readOnly && (
          <Link
            href="/dashboard/flights/new"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Add your first flight
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {nowToday.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Now / Today
          </h2>
          <div className="space-y-3">
            {nowToday.map((f) => (
              <FlightCard key={f.id} flight={f} readOnly={readOnly} />
            ))}
          </div>
        </section>
      )}

      {upcomingTrips.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Upcoming Flights
            </h2>
            <ShareItinerary flights={upcoming} />
          </div>
          <div className="space-y-3">
            {upcomingTrips.map((trip, i) => (
              <TripGroup key={i} flights={trip} readOnly={readOnly} />
            ))}
          </div>
        </section>
      )}

      {pastTrips.length > 0 && (
        <section>
          <button
            onClick={() => setPastOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-400 transition-colors mb-3"
          >
            Past Flights
            <span className="text-gray-600">({past.length})</span>
            {pastOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {pastOpen && (
            <div className="space-y-3 opacity-80">
              {pastTrips.map((trip, i) => (
                <PastTripCard key={i} flights={trip} />
              ))}
            </div>
          )}
        </section>
      )}

      {nowToday.length === 0 && upcoming.length === 0 && past.length > 0 && !pastOpen && (
        <p className="text-sm text-gray-500 text-center">All flights are in the past.</p>
      )}
    </div>
  )
}
