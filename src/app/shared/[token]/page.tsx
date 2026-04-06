import { createServiceClient } from '@/lib/supabase/server'
import FlightList from '@/components/FlightList'
import type { Flight } from '@/lib/types'
import { PlaneTakeoff } from 'lucide-react'

export default async function SharedPage({
  params,
}: {
  params: { token: string }
}) {
  // Use service role key server-side — never exposed to the browser
  const supabase = createServiceClient()

  const { data: tokenRow } = await supabase
    .from('share_tokens')
    .select('user_id, label')
    .eq('token', params.token)
    .single()

  // Don't return 404 — avoid revealing whether a token ever existed
  if (!tokenRow) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-semibold text-white mb-2">Link not found</h1>
          <p className="text-gray-400 text-sm">
            This sharing link is invalid or has been revoked.
          </p>
        </div>
      </div>
    )
  }

  const { data: flights } = await supabase
    .from('flights')
    .select('*')
    .eq('user_id', tokenRow.user_id)
    .order('departure_time', { ascending: true })

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <PlaneTakeoff className="h-5 w-5 text-blue-400" />
            Flighthomi
          </div>
          <span className="text-xs text-gray-500">Shared — read only</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <FlightList flights={(flights as Flight[]) ?? []} readOnly />
      </main>
    </div>
  )
}
