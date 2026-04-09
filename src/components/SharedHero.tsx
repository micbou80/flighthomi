'use client'

import { Plane } from 'lucide-react'
import { ETACountdown, DepartureCountdown } from './LiveCountdown'
import type { Flight } from '@/lib/types'

function isSameLocalDay(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function SharedHero({ flights }: { flights: Flight[] }) {
  // Priority: in_air > taxiing > today's scheduled > nothing
  const active = flights.filter((f) => f.status === 'in_air' || f.status === 'taxiing')
  const todayScheduled = flights.filter(
    (f) => f.status === 'scheduled' && isSameLocalDay(f.departure_time)
  )
  const recentlyLanded = flights.filter(
    (f) =>
      f.status === 'landed' &&
      f.actual_arrival_time &&
      Date.now() - new Date(f.actual_arrival_time).getTime() < 30 * 60 * 1000
  )

  const hero = active[0] ?? todayScheduled[0] ?? recentlyLanded[0]
  if (!hero) return null

  const isInAir = hero.status === 'in_air'
  const isTaxiingArrival = hero.status === 'taxiing' && (hero.progress_percent ?? 0) >= 100
  const isTaxiingDeparture = hero.status === 'taxiing' && (hero.progress_percent ?? 0) < 100
  const isScheduled = hero.status === 'scheduled'
  const isLanded = hero.status === 'landed'

  const eta = hero.estimated_arrival_time ?? hero.arrival_time
  const delay = hero.arrival_delay ?? hero.departure_delay ?? null

  // Compute progress for in-air if not provided
  let progress = hero.progress_percent ?? 0
  if (isInAir && hero.progress_percent == null) {
    const dep = new Date(hero.actual_departure_time ?? hero.departure_time).getTime()
    const arr = new Date(eta).getTime()
    progress = Math.min(100, Math.max(0, ((Date.now() - dep) / (arr - dep)) * 100))
  }

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/40 to-gray-900/40 p-5 mb-6">
      {/* Route */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-center min-w-[52px]">
          <p className="text-3xl font-bold text-white">{hero.origin_code}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          {isInAir ? (
            <div className="relative w-full h-2 bg-blue-900/60 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute -translate-x-1/2 -top-[5px]"
                style={{ left: `${Math.min(progress, 95)}%` }}
              >
                <Plane className="h-3 w-3 text-blue-300" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 w-full">
              <div className="h-px flex-1 bg-blue-900/60" />
              <Plane className="h-3 w-3 text-blue-400" />
              <div className="h-px flex-1 bg-blue-900/60" />
            </div>
          )}
          <p className="text-xs text-blue-500 font-mono">{hero.flight_number}</p>
        </div>
        <div className="text-center min-w-[52px]">
          <p className="text-3xl font-bold text-white">{hero.destination_code}</p>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        {isInAir && (
          <>
            <p className="text-xs text-blue-400 uppercase tracking-widest mb-1">In the air · lands in</p>
            <p className="text-5xl font-bold text-white tabular-nums tracking-tight">
              <ETACountdown eta={eta} />
            </p>
            {delay != null && delay > 0 && (
              <p className="text-xs text-amber-400 mt-2">+{delay}m delay</p>
            )}
          </>
        )}
        {isTaxiingDeparture && (
          <p className="text-2xl font-semibold text-white">Taxiing · wheels up soon</p>
        )}
        {isTaxiingArrival && (
          <>
            <p className="text-xs text-blue-400 uppercase tracking-widest mb-1">Taxiing to gate</p>
            <p className="text-2xl font-semibold text-white">
              {hero.arrival_gate ? `Gate ${hero.arrival_gate}` : 'Almost there'}
            </p>
          </>
        )}
        {isScheduled && (
          <>
            <p className="text-xs text-blue-400 uppercase tracking-widest mb-1">Departing</p>
            <p className="text-4xl font-bold text-white">
              <DepartureCountdown departure={hero.departure_time} />
            </p>
            <div className="flex items-center justify-center gap-3 mt-2 text-sm text-gray-400">
              {hero.departure_gate && <span>Gate {hero.departure_gate}</span>}
              {delay != null && delay > 0 && (
                <span className="text-amber-400">+{delay}m delay</span>
              )}
              {(delay == null || delay === 0) && <span className="text-green-400">On time</span>}
            </div>
          </>
        )}
        {isLanded && (
          <p className="text-2xl font-semibold text-white">
            Landed · {hero.destination_code}
            {hero.arrival_gate && <span className="text-gray-400 text-lg ml-2">Gate {hero.arrival_gate}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
