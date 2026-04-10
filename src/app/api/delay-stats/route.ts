import { NextRequest, NextResponse } from 'next/server'

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi'

export async function GET(req: NextRequest) {
  const flight = req.nextUrl.searchParams.get('flight')
  if (!flight) return NextResponse.json(null, { status: 400 })

  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) return NextResponse.json(null)

  // Last 60 days of history (yesterday back)
  const end = new Date()
  end.setDate(end.getDate() - 1)
  const start = new Date()
  start.setDate(start.getDate() - 60)

  const url =
    `${AEROAPI_BASE}/flights/${encodeURIComponent(flight)}` +
    `?start=${start.toISOString().slice(0, 10)}T00:00:00Z` +
    `&end=${end.toISOString().slice(0, 10)}T23:59:59Z`

  try {
    const res = await fetch(url, {
      headers: { 'x-apikey': apiKey },
      next: { revalidate: 86400 }, // 24h cache — historical data is stable
    })
    if (!res.ok) return NextResponse.json(null)

    const data = await res.json()
    const flights: Array<{ actual_on: string | null; arrival_delay: number | null }> =
      data.flights ?? []

    const completed = flights.filter((f) => f.actual_on != null)
    if (completed.length === 0) return NextResponse.json(null)

    // On time = arrival delay <= 15 min (900s). AeroAPI delay is in seconds.
    const onTime = completed.filter((f) => (f.arrival_delay ?? 0) <= 900)
    const pct = Math.round((onTime.length / completed.length) * 100)

    return NextResponse.json({ onTimePct: pct, sampleSize: completed.length })
  } catch {
    return NextResponse.json(null)
  }
}
