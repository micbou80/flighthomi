import Link from 'next/link'
import { Plane } from 'lucide-react'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import FlightStatusBadge from './FlightStatusBadge'
import type { Flight } from '@/lib/types'

interface FlightCardProps {
  flight: Flight
  readOnly?: boolean
}

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function FlightCard({ flight, readOnly = false }: FlightCardProps) {
  const isInAir = flight.status === 'in_air'

  let progress = 0
  let remainingMins = 0
  let elapsedMins = 0

  if (isInAir) {
    const now = Date.now()
    const dep = new Date(flight.departure_time).getTime()
    const arr = new Date(flight.arrival_time).getTime()
    const total = arr - dep
    const elapsed = now - dep
    progress = Math.min(100, Math.max(0, (elapsed / total) * 100))
    remainingMins = Math.max(0, Math.floor((arr - now) / 60000))
    elapsedMins = Math.max(0, Math.floor(elapsed / 60000))
  }

  const card = (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors">
      {/* Top row: date + status */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">{formatDate(flight.departure_time)}</p>
        <FlightStatusBadge status={flight.status} />
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center min-w-[56px]">
          <p className="text-2xl font-bold text-white">{flight.origin_code}</p>
          <p className="text-xs text-gray-400">{formatTime(flight.departure_time)}</p>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1.5">
          {isInAir ? (
            <>
              <div className="relative w-full h-5 flex items-center">
                <div className="absolute inset-x-0 h-px bg-gray-700" />
                <div
                  className="absolute left-0 h-px bg-blue-500"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute -translate-x-1/2"
                  style={{ left: `${Math.min(progress, 96)}%` }}
                >
                  <Plane className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <div className="flex justify-between w-full text-xs">
                <span className="text-gray-500">{formatMins(elapsedMins)} flown</span>
                <span className="text-green-400 font-medium">{formatMins(remainingMins)} left</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 w-full">
                <div className="h-px flex-1 bg-gray-700" />
                <Plane className="h-4 w-4 text-blue-400 rotate-0" />
                <div className="h-px flex-1 bg-gray-700" />
              </div>
              <p className="text-xs text-gray-500">{formatDuration(flight.departure_time, flight.arrival_time)}</p>
            </>
          )}
        </div>

        <div className="text-center min-w-[56px]">
          <p className="text-2xl font-bold text-white">{flight.destination_code}</p>
          <p className="text-xs text-gray-400">{formatTime(flight.arrival_time)}</p>
        </div>
      </div>

      {/* Bottom row: airline + flight # + aircraft */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {flight.airline} · {flight.flight_number}
        </span>
        <span className="flex items-center gap-2">
          {flight.aircraft_type && <span>{flight.aircraft_type}</span>}
          {flight.seat && <span>Seat {flight.seat}</span>}
        </span>
      </div>
    </div>
  )

  if (readOnly) return card

  return <Link href={`/dashboard/flights/${flight.id}`}>{card}</Link>
}
