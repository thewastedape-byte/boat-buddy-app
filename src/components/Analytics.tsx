'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getAuth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

// Helper: fire a GA4 event if gtag is loaded
function gtagEvent(eventName: string, params?: Record<string, string>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params)
  }
}

// Call after login/signup to tie GA4 device session to user
export function identifyUser(email: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('set', 'user_properties', { crm_id: email })
  }
}

// Track key app events
export function trackEvent(name: string, params?: Record<string, string>) {
  gtagEvent(name, params)
}

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Identify user in GA4 if logged in
    const auth = getAuth()
    if (auth?.email && typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('set', 'user_properties', { crm_id: auth.email })
    }

    // Fire GA4 page_view
    gtagEvent('page_view', { page_path: pathname })

    // Fire backend pageview (existing)
    fetch(`${API_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname, email: auth?.email }),
    }).catch(() => {})
  }, [pathname])

  return null
}
