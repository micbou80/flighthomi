import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FlightForm from '@/components/FlightForm'
import type { Flight } from '@/lib/types'

export default async function FlightDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!flight) notFound()

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">
        {(flight as Flight).flight_number} — {(flight as Flight).origin_code} →{' '}
        {(flight as Flight).destination_code}
      </h1>
      <FlightForm defaultValues={flight as Flight} flightId={params.id} />
    </div>
  )
}
