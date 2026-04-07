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

  // Try FlightAware first — may throw if date is out of their data range
  let result = null
  try {
    result = await lookupFlight(fn, date)
  } catch {
    // FlightAware has no data for this date — fall through to schedule lookup
  }

  if (result) return NextResponse.json(result)

  // Fallback: AviationStack schedule data (works for flights weeks out)
  try {
    const scheduled = await lookupFlightSchedule(fn, date)
    if (scheduled) return NextResponse.json(scheduled)
  } catch (err) {
    console.error('AviationStack lookup error:', err)
  }

  return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
}
