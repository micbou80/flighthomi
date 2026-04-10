'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Plane, ChevronDown, ChevronUp } from 'lucide-react'

const FlightMap = dynamic(() => import('./FlightMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-lg bg-gray-900 animate-pulse mt-2" />,
})
import { formatDuration } from '@/lib/utils'
import { LocalTime, LocalDate, TimezoneLabel } from './LocalTime'
import FlightStatusBadge from './FlightStatusBadge'
import { weatherEmoji } from '@/lib/weather'
import { getAirportCoords } from '@/lib/airports'
import type { Flight } from '@/lib/types'

interface FlightCardProps {
  flight: Flight
  readOnly?: boolean
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return iso }
}

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function FlightCard({ flight, readOnly = false }: FlightCardProps) {
  const [nerd, setNerd] = useState(false)
  // Initialize to 0 so server and client agree on first render (no hydration mismatch)
  const [nowMs, setNowMs] = useState(0)
  const [delayStats, setDelayStats] = useState<{ onTimePct: number; sampleSize: number } | null>(null)

  // Set real time only on client, then tick every 30s
  useEffect(() => {
    setNowMs(Date.now())
    const id = setInterval(() => setNowMs(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Delay stats — fetch once for scheduled flights, cache 24h on server
  useEffect(() => {
    if (flight.status !== 'scheduled') return
    fetch(`/api/delay-stats?flight=${encodeURIComponent(flight.flight_number)}`)
      .then((r) => r.json())
      .then((data) => { if (data) setDelayStats(data) })
      .catch(() => {})
  }, [flight.flight_number, flight.status])

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

  // Gate countdown — show when gate is assigned and departure is within 2h
  const minsToGate = Math.floor((new Date(flight.departure_time).getTime() - nowMs) / 60000)
  const showGateCountdown =
    flight.status === 'scheduled' &&
    flight.departure_gate != null &&
    minsToGate > 0 &&
    minsToGate <= 120

  const countdownText =
    minsToGate <= 1 ? 'Boarding now' : `Boarding in ${minsToGate}m`

  const countdownStyle =
    minsToGate > 90
      ? 'bg-green-900/30 text-green-400 border border-green-800/50'
      : minsToGate > 45
      ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50'
      : 'bg-red-900/30 text-red-400 border border-red-800/50'

  // Live approach link — show when < 20 min to landing
  const showLiveApproach = isInAir && remainingMins > 0 && remainingMins <= 20

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
                  <Plane className="h-4 w-4 text-blue-400" style={{ transform: 'rotate(45deg)' }} />
                </div>
              </div>
              <div className="flex justify-between w-full text-xs">
                <span className="text-gray-500">{formatMins(elapsedMins)} flown</span>
                {showLiveApproach ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(`https://www.flightradar24.com/${flight.flight_number}`, '_blank', 'noopener,noreferrer')
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Live approach →
                  </button>
                ) : (
                  <span className="text-green-400 font-medium">{formatMins(remainingMins)} left</span>
                )}
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
          {flight.destination_temp_c != null && flight.status !== 'landed' && flight.status !== 'cancelled' && (
            <p className="mt-1 text-xs text-gray-500">
              {weatherEmoji(flight.destination_weather_code ?? 0)} {flight.destination_temp_c}°C
            </p>
          )}
          {flight.baggage_claim && flight.status === 'landed' && (
            <p className="mt-1 text-xs text-blue-400 font-medium">
              🧳 {flight.baggage_claim}
            </p>
          )}
        </div>
      </div>

      {/* Gate countdown — shown when gate is assigned and departure < 2h */}
      {showGateCountdown && (
        <div className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 mb-3 text-xs font-medium ${countdownStyle}`}>
          <span>Gate {flight.departure_gate} · {countdownText}</span>
        </div>
      )}

      {/* Bottom row: airline + flight # + delay stats + aircraft + seat */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-2">
          <span>{flight.airline} · {flight.flight_number}</span>
          {delayStats && (
            <span className={
              delayStats.onTimePct >= 80 ? 'text-green-600' :
              delayStats.onTimePct >= 60 ? 'text-amber-600' :
              'text-red-600'
            }>
              {delayStats.onTimePct}% on time
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {flight.aircraft_type && <span>{flight.aircraft_type}</span>}
          {flight.seat && <span>Seat {flight.seat}</span>}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNerd(v => !v) }}
            className="text-gray-600 hover:text-gray-400 transition-colors"
            title="Nerd mode"
          >
            {nerd ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </span>
      </div>

      {/* Nerd mode panel */}
      {nerd && (
        <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
          {[
            ['Status', flight.status],
            ['Progress', flight.progress_percent != null ? `${flight.progress_percent}%` : null],
            ['Dep delay', flight.departure_delay != null ? `${flight.departure_delay}m` : null],
            ['Arr delay', flight.arrival_delay != null ? `${flight.arrival_delay}m` : null],
            ['Actual dep', fmtDateTime(flight.actual_departure_time)],
            ['Actual arr', fmtDateTime(flight.actual_arrival_time)],
            ['ETA', fmtDateTime(flight.estimated_arrival_time)],
            ['Dep gate', flight.departure_gate],
            ['Arr gate', flight.arrival_gate],
            ['Route', flight.route],
          ].map(([label, value]) => (
            <div key={label as string} className="flex gap-1">
              <span className="text-gray-600 shrink-0">{label}:</span>
              <span className="text-gray-400 truncate">{value ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const lastTrack = flight.track_points?.[flight.track_points.length - 1] ?? null
  const mapLat = flight.last_lat ?? lastTrack?.lat ?? null
  const mapLon = flight.last_lon ?? lastTrack?.lon ?? null
  const destCoords = getAirportCoords(flight.destination_code)

  const hasMap =
    flight.status === 'in_air' &&
    mapLat != null &&
    mapLon != null &&
    flight.track_points != null &&
    flight.track_points.length > 0

  const inner = (
    <div>
      {card}
      {hasMap && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <FlightMap
            trackPoints={flight.track_points!}
            lastLat={mapLat!}
            lastLon={mapLon!}
            lastHeading={flight.last_heading}
            originCode={flight.origin_code}
            destinationCode={flight.destination_code}
            destinationLat={destCoords?.lat ?? null}
            destinationLon={destCoords?.lon ?? null}
          />
        </div>
      )}
    </div>
  )

  if (readOnly) return inner
  return <Link href={`/dashboard/flights/${flight.id}`}>{inner}</Link>
}
