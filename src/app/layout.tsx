import type { Metadata } from 'next'
import './globals.css'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: 'Boat Buddy AI — Marine Diagnostics Assistant for Boat Mechanics & DIY Owners',
  description: 'AI-powered diagnostics for boats and ships. Engines, electrical, plumbing, fiberglass & paint. Free plan. Built for marine shops and DIY owners.',
  keywords: 'marine mechanic, boat diagnostics, boat repair AI, marine AI assistant, boat engine repair, fiberglass repair, marine electrical troubleshooting',
  verification: { google: 'kC5ejZEO7H6cMXus3fszzyG8upBBvGFg9H4Prk7FQl0' },
  manifest: '/manifest.json',
  themeColor: '#3D1C02',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'Boat Buddy AI — Marine Diagnostics Assistant for Boat Mechanics & DIY Owners',
    description: 'AI-powered diagnostics for boats and ships. Engines, electrical, plumbing, fiberglass & paint. Free plan. Built for marine shops and DIY owners.',
    url: 'https://boatbuddy.thewastedape.com',
    siteName: 'Boat Buddy AI',
    images: [
      {
        url: 'https://boatbuddy.thewastedape.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Boat Buddy AI — Marine Diagnostics Assistant',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boat Buddy AI — Marine Diagnostics Assistant for Boat Mechanics & DIY Owners',
    description: 'AI-powered diagnostics for boats and ships. Engines, electrical, plumbing, fiberglass & paint. Free plan.',
    images: ['https://boatbuddy.thewastedape.com/og-image.jpg'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Boat Buddy AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://boatbuddy.thewastedape.com',
  description: 'AI-powered marine diagnostics assistant for boat mechanics and DIY boat owners. Diagnose engine issues, electrical problems, plumbing, fiberglass & paint.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Stow Away (Free)',
      price: '0',
      priceCurrency: 'USD',
      description: '1 free question every 6 hours',
    },
    {
      '@type': 'Offer',
      name: 'First Mate',
      price: '19.99',
      priceCurrency: 'USD',
      description: 'Unlimited AI diagnostics, service manuals, work orders',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="GOOGLE_VERIFICATION_CODE_HERE" />
  
      <script dangerouslySetInnerHTML={{ __html: `
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js');
          });
        }
      ` }} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-wood min-h-screen">
        <Analytics />
        {children}
      </body>
    </html>
  )
}
