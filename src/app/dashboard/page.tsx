import { createClient } from '@/lib/supabase/server'
import FlightList from '@/components/FlightList'
import FlightCalendar from '@/components/FlightCalendar'
import ShareLinkManager from '@/components/ShareLinkManager'
import RefreshBar from '@/components/RefreshBar'
import type { Flight, ShareToken } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: flights }, { data: tokens }] = await Promise.all([
    supabase
      .from('flights')
      .select('*')
      .eq('user_id', user!.id)
      .order('departure_time', { ascending: true }),
    supabase
      .from('share_tokens')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  const flightData = (flights as Flight[]) ?? []

  return (
    <div className="flex gap-8 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-8">
        <RefreshBar />
        <FlightList flights={flightData} />
        <ShareLinkManager tokens={(tokens as ShareToken[]) ?? []} />
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <FlightCalendar flights={flightData} />
      </aside>
    </div>
  )
}
