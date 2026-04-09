'use client'

import { useEffect, useState } from 'react'

function fmt(ms: number): string {
  if (ms <= 0) return '0s'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function ETACountdown({ eta }: { eta: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function tick() {
      const ms = new Date(eta).getTime() - Date.now()
      setLabel(ms <= 0 ? 'Landing...' : fmt(ms))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [eta])
  return <>{label}</>
}

export function DepartureCountdown({ departure }: { departure: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function tick() {
      const ms = new Date(departure).getTime() - Date.now()
      setLabel(ms <= 0 ? 'now' : `in ${fmt(ms)}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [departure])
  return <>{label}</>
}
