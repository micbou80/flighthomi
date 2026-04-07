'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import FlightCard from './FlightCard'
import type { Flight } from '@/lib/types'

interface FlightListProps {
  flights: Flight[]
  readOnly?: boolean
}

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
    (f) => f.status === 'scheduled' && !isSameLocalDay(f.departure_time, now) && !isBeforeToday(f.departure_time, now)
  )
  const past = flights
    .filter((f) => f.status === 'landed' || f.status === 'cancelled')
    .slice()
    .reverse()

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

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Upcoming Flights
          </h2>
          <div className="space-y-3">
            {upcoming.map((f) => (
              <FlightCard key={f.id} flight={f} readOnly={readOnly} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
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
            <div className="space-y-3 opacity-70">
              {past.map((f) => (
                <FlightCard key={f.id} flight={f} readOnly={readOnly} />
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
