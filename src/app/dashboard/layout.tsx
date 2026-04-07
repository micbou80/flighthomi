import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar email={user.email ?? ''} />
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}
