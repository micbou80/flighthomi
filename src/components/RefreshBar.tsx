'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  return `${mins}m ago`
}

function nextCronIn(): string {
  const now = new Date()
  const secs = 300 - ((now.getMinutes() % 5) * 60 + now.getSeconds())
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RefreshBar() {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(nextCronIn())
  const [loading, setLoading] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(nextCronIn())
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await fetch('/api/refresh', { method: 'POST' })
      setLastRefreshed(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="flex items-center justify-between text-xs text-gray-500 px-1">
      <span>
        {lastRefreshed
          ? <>Last refreshed: <span className="text-gray-400">{timeAgo(lastRefreshed)}</span> · Auto in <span className="text-gray-400">{countdown}</span></>
          : <>Auto-refresh in <span className="text-gray-400">{countdown}</span></>
        }
      </span>
      <button
        onClick={refresh}
        disabled={loading}
        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Refreshing…' : 'Refresh now'}
      </button>
    </div>
  )
}
