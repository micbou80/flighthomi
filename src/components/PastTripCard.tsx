'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Clock, AlertCircle, Plane, Trash2 } from 'lucide-react'
import FlightCard from './FlightCard'
import type { Flight } from '@/lib/types'

interface PastTripCardProps {
  flights: Flight[]
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

function tripDateRange(flights: Flight[]): string {
  const first = fmtShortDate(flights[0].departure_time)
  const last = fmtShortDate(flights[flights.length - 1].departure_time)
  return first === last ? first : `${first} – ${last}`
}

function tripTitle(flights: Flight[]): string {
  const home = flights[0].origin_code
  const seen = new Set<string>()
  const dests = flights.map((f) => f.destination_code).filter((d) => {
    if (d === home || seen.has(d)) return false
    seen.add(d)
    return true
  })
  return dests.length > 0 ? dests.join(' · ') : flights[flights.length - 1].destination_code
}

function airportPath(flights: Flight[]): string {
  const codes = [flights[0].origin_code, ...flights.map((f) => f.destination_code)]
  return codes.join(' → ')
}

export default function PastTripCard({ flights }: PastTripCardProps) {
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/flights/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  // Compute stats
  let totalAirMins = 0
  let totalDelayMins = 0
  let cancelled = 0
  const aircraftTypes = new Set<string>()

  for (const f of flights) {
    if (f.status === 'cancelled') {
      cancelled++
      continue
    }
    if (f.actual_departure_time && f.actual_arrival_time) {
      const mins = Math.round(
        (new Date(f.actual_arrival_time).getTime() - new Date(f.actual_departure_time).getTime()) / 60000
      )
      if (mins > 0) totalAirMins += mins
    }
    const delay = f.arrival_delay ?? f.departure_delay ?? 0
    if (delay > 0) totalDelayMins += delay
    if (f.aircraft_type) aircraftTypes.add(f.aircraft_type)
  }

  const title = tripTitle(flights)
  const dateRange = tripDateRange(flights)
  const path = airportPath(flights)
  const legs = flights.length

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-white">{title}</span>
              <span className="text-xs text-gray-500">{dateRange}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{path}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <span className="text-xs text-gray-600">{legs} {legs === 1 ? 'leg' : 'legs'}</span>
            {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          {totalAirMins > 0 && (
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="h-3 w-3 text-gray-600" />
              {fmtDuration(totalAirMins)} in the air
            </span>
          )}
          {totalDelayMins > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <AlertCircle className="h-3 w-3" />
              +{fmtDuration(totalDelayMins)} delayed
            </span>
          )}
          {totalDelayMins === 0 && totalAirMins > 0 && (
            <span className="text-green-600">On time</span>
          )}
          {aircraftTypes.size > 0 && (
            <span className="flex items-center gap-1 text-gray-500">
              <Plane className="h-3 w-3" />
              {Array.from(aircraftTypes).join(', ')}
            </span>
          )}
          {cancelled > 0 && (
            <span className="text-red-500">{cancelled} cancelled</span>
          )}
        </div>
      </button>

      {/* Expanded legs */}
      {open && (
        <div className="border-t border-gray-700/40 px-3 pb-3 pt-3 space-y-3">
          {flights.map((f) => (
            <div key={f.id} className="relative group">
              <FlightCard flight={f} readOnly />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {confirmId === f.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(f.id)}
                      disabled={deletingId === f.id}
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      {deletingId === f.id ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs text-gray-500 hover:text-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmId(f.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-600 hover:text-red-400"
                    title="Delete flight"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
