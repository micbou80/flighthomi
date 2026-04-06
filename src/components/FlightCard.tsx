import Link from 'next/link'
import { Plane } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { LocalTime, LocalDate, TimezoneLabel } from './LocalTime'
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

  let progress = flight.progress_percent ?? 0
  let remainingMins = 0
  let elapsedMins = 0

  if (isInAir) {
    if (flight.progress_percent == null) {
      const now = Date.now()
      const dep = new Date(flight.actual_departure_time ?? flight.departure_time).getTime()
      const arr = new Date(flight.estimated_arrival_time ?? flight.arrival_time).getTime()
      const total = arr - dep
      progress = Math.min(100, Math.max(0, ((now - dep) / total) * 100))
      elapsedMins = Math.max(0, Math.floor((now - dep) / 60000))
    } else {
      const dep = new Date(flight.actual_departure_time ?? flight.departure_time).getTime()
      elapsedMins = Math.max(0, Math.floor((Date.now() - dep) / 60000))
    }
    const eta = new Date(flight.estimated_arrival_time ?? flight.arrival_time).getTime()
    remainingMins = Math.max(0, Math.floor((eta - Date.now()) / 60000))
  }

  const delay = flight.arrival_delay ?? flight.departure_delay ?? null
  const hasDelay = delay != null && delay > 0

  const card = (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors">
      {/* Top row: date + timezone + status + delay */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <LocalDate iso={flight.departure_time} />
          <TimezoneLabel className="text-gray-600" />
        </div>
        <div className="flex items-center gap-2">
          {hasDelay && (
            <span className="text-xs font-medium text-amber-400">+{delay}m</span>
          )}
          <FlightStatusBadge status={flight.status} />
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center min-w-[56px]">
          <p className="text-2xl font-bold text-white">{flight.origin_code}</p>
          <p className="text-xs text-gray-400">
            <LocalTime iso={flight.actual_departure_time ?? flight.departure_time} />
          </p>
          {flight.departure_gate && (
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-bold ${flight.departure_gate_changed ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'}`}>
              {flight.departure_gate}
            </span>
          )}
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
                <Plane className="h-4 w-4 text-blue-400" />
                <div className="h-px flex-1 bg-gray-700" />
              </div>
              <p className="text-xs text-gray-500">{formatDuration(flight.departure_time, flight.arrival_time)}</p>
            </>
          )}
        </div>

        <div className="text-center min-w-[56px]">
          <p className="text-2xl font-bold text-white">{flight.destination_code}</p>
          <p className={`text-xs ${hasDelay && flight.estimated_arrival_time ? 'line-through text-gray-600' : 'text-gray-400'}`}>
            <LocalTime iso={flight.arrival_time} />
          </p>
          {hasDelay && flight.estimated_arrival_time && (
            <p className="text-xs text-amber-400 font-medium">
              <LocalTime iso={flight.estimated_arrival_time} />
            </p>
          )}
          {flight.arrival_gate && (
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-bold ${flight.arrival_gate_changed ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'}`}>
              {flight.arrival_gate}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: airline + flight # + aircraft */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{flight.airline} · {flight.flight_number}</span>
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
