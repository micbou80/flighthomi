'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

const INTERVAL = 300 // seconds

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  return `${Math.floor(secs / 60)}m ago`
}

export default function RefreshBar() {
  const [secs, setSecs] = useState(INTERVAL)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)

  const refresh = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      await fetch('/api/refresh', { method: 'POST' })
      setLastRefreshed(new Date())
      setSecs(INTERVAL)
      window.location.reload()
    } catch {
      setSecs(INTERVAL)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          refresh()
          return INTERVAL
        }
        return prev - 1
      })
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
