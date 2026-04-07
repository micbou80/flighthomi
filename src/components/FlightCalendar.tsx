'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Flight } from '@/lib/types'

interface FlightCalendarProps {
  flights: Flight[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toLocalDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function FlightCalendar({ flights }: FlightCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Build a set of date keys that have flights departing that day
  const flightDays = new Set(flights.map((f) => toLocalDateKey(f.departure_time)))

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  // First day of month (0=Sun … 6=Sat), convert to Mon-based (0=Mon … 6=Sun)
  const firstDow = new Date(year, month, 1).getDay()
  const startOffset = (firstDow + 6) % 7 // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid cells: nulls for leading blanks, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />

          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          const key = `${year}-${month}-${day}`
          const hasFlight = flightDays.has(key)

          return (
            <div
              key={key}
              className={cn(
                'flex flex-col items-center justify-center aspect-square rounded-lg text-xs transition-colors',
                isToday
                  ? 'bg-blue-600/20 text-blue-300 font-semibold ring-1 ring-blue-500/40'
                  : 'text-gray-300',
                hasFlight && !isToday && 'bg-gray-800'
              )}
            >
              <span>{day}</span>
              {hasFlight && (
                <span className="text-[10px] leading-none mt-0.5" aria-label="Flight day">
                  ✈
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
