import { NextRequest, NextResponse } from 'next/server'
import { lookupFlight } from '@/lib/flightaware'
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
    if (!result) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('FlightAware lookup error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
