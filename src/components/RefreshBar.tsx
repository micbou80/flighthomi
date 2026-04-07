'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  return `${mins}m ago`
}

function secsUntilNextCron(): number {
  const now = new Date()
  return 300 - ((now.getMinutes() % 5) * 60 + now.getSeconds())
}

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RefreshBar() {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [secs, setSecs] = useState(secsUntilNextCron())
  const [loading, setLoading] = useState(false)
  const refreshingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setLoading(true)
    try {
      await fetch('/api/refresh', { method: 'POST' })
      setLastRefreshed(new Date())
      window.location.reload()
    } catch {
      setLoading(false)
      refreshingRef.current = false
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const s = secsUntilNextCron()
      setSecs(s)
      if (s === 0) refresh()
    }, 1000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div className="flex items-center justify-between text-xs text-gray-500 px-1">
      <span>
        {lastRefreshed
          ? <>Last refreshed: <span className="text-gray-400">{timeAgo(lastRefreshed)}</span> · Next in <span className="text-gray-400">{formatSecs(secs)}</span></>
          : <>Next refresh in <span className="text-gray-400">{formatSecs(secs)}</span></>
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
