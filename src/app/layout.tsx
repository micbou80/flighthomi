import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flighthomi',
  description: 'Your personal flight tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
