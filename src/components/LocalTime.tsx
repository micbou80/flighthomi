'use client'

function tz(): string {
  return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? ''
}

export function LocalTime({ iso }: { iso: string }) {
  const time = new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return <span suppressHydrationWarning>{time}</span>
}

export function LocalDate({ iso }: { iso: string }) {
  const date = new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return <span suppressHydrationWarning>{date}</span>
}

export function TimezoneLabel({ className }: { className?: string }) {
  return (
    <span suppressHydrationWarning className={className}>
      {tz()}
    </span>
  )
}
