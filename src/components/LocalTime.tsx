'use client'

import { useEffect, useState } from 'react'

function toLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function toLocalDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getTimezone(): string {
  return (
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  )
}

export function LocalTime({ iso }: { iso: string }) {
  const [time, setTime] = useState<string | null>(null)
  useEffect(() => setTime(toLocalTime(iso)), [iso])
  // Render blank until client hydrates — avoids UTC flash on server-rendered HTML
  return <span>{time ?? ''}</span>
}

export function LocalDate({ iso }: { iso: string }) {
  const [date, setDate] = useState<string | null>(null)
  useEffect(() => setDate(toLocalDate(iso)), [iso])
  return <span>{date ?? ''}</span>
}

export function TimezoneLabel({ className }: { className?: string }) {
  const [tz, setTz] = useState<string | null>(null)
  useEffect(() => setTz(getTimezone()), [])
  return <span suppressHydrationWarning className={className}>{tz ?? ''}</span>
}
