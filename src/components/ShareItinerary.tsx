'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import type { Flight } from '@/lib/types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildItinerary(flights: Flight[]): string {
  if (flights.length === 0) return ''
  const lines: string[] = ['My upcoming flights:\n']
  for (const f of flights) {
    lines.push(`${f.flight_number} · ${f.origin_code} → ${f.destination_code}`)
    const dep = fmtTime(f.departure_time)
    const arr = fmtTime(f.arrival_time)
    lines.push(`${fmtDay(f.departure_time)} · ${dep} → ${arr}`)
    if (f.departure_gate) lines.push(`Gate ${f.departure_gate}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}

export default function ShareItinerary({ flights }: { flights: Flight[] }) {
  const [copied, setCopied] = useState(false)

  if (flights.length === 0) return null

  async function share() {
    const text = buildItinerary(flights)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={share}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      title="Share itinerary"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3" />
          Share
        </>
      )}
    </button>
  )
}
