import type { Metadata } from 'next'
import './globals.css'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: 'Boat Buddy by WastedApe',
  description: 'Marine AI diagnostic assistant — diagnose your boat issues with AI',
  manifest: '/manifest.json',
  themeColor: '#3D1C02',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-wood min-h-screen">
        <Analytics />
        {children}
      </body>
    </html>
  )
}
