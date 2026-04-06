import Link from 'next/link'
import FlightCard from './FlightCard'
import type { Flight } from '@/lib/types'

interface FlightListProps {
  flights: Flight[]
  readOnly?: boolean
}

export default function FlightList({ flights, readOnly = false }: FlightListProps) {
  const upcoming = flights.filter((f) => f.status !== 'landed' && f.status !== 'cancelled')
  const past = flights.filter((f) => f.status === 'landed' || f.status === 'cancelled')

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
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Upcoming
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
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Past
          </h2>
          <div className="space-y-3 opacity-70">
            {past
              .slice()
              .reverse()
              .map((f) => (
                <FlightCard key={f.id} flight={f} readOnly={readOnly} />
              ))}
          </div>
        </section>
      )}
    </div>
  )
}
