import { createClient } from '@/lib/supabase/server'
import FlightList from '@/components/FlightList'
import ShareLinkManager from '@/components/ShareLinkManager'
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

  return (
    <div className="space-y-8">
      <FlightList flights={(flights as Flight[]) ?? []} />
      <ShareLinkManager tokens={(tokens as ShareToken[]) ?? []} />
    </div>
  )
}
