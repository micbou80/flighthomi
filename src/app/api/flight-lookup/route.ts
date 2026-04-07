import { NextRequest, NextResponse } from 'next/server'
import { lookupFlight } from '@/lib/flightaware'
import { lookupFlightSchedule } from '@/lib/aviationstack'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Require auth — only the owner can look up flights
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fn = searchParams.get('fn')?.trim()
  const date = searchParams.get('date')?.trim()

  if (!fn || !date) {
    return NextResponse.json(
      { error: 'Missing required params: fn, date' },
      { status: 400 }
    )
  }

  try {
    const result = await lookupFlight(fn, date)
    if (result) return NextResponse.json(result)

    // FlightAware has no data yet (flight too far out) — try AviationStack schedule
    const scheduled = await lookupFlightSchedule(fn, date)
    if (scheduled) return NextResponse.json(scheduled)

    return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
  } catch (err) {
    console.error('Flight lookup error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
