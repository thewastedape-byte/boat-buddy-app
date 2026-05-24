'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/Logo'

const TIER_LABELS: Record<string, string> = {
  first_mate: 'First Mate',
  captain: 'Captain',
  admiral: 'Admiral',
  yard_addon: 'Admiral',
  yard_standalone: 'Admiral',
  marina_addon: 'Captain',
}

const TIER_ICONS: Record<string, string> = {
  first_mate: '⚓',
  captain: '🧭',
  admiral: '🚢',
  yard_addon: '🚢',
  yard_standalone: '🚢',
  marina_addon: '🧭',
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [tierLabel, setTierLabel] = useState('First Mate')
  const [tierIcon, setTierIcon] = useState('⚓')
  const [status, setStatus] = useState<'confirming' | 'done' | 'error'>('confirming')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const tier = searchParams.get('tier') || 'first_mate'

    setTierLabel(TIER_LABELS[tier] || tier)
    setTierIcon(TIER_ICONS[tier] || '⚓')

    async function confirm() {
      if (!sessionId) {
        setStatus('done')
        return
      }
      try {
        const res = await fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, tier }),
        })
        const data = await res.json()
        if (data.ok) {
          // Update localStorage so the UI reflects the new tier immediately
          try {
            const raw = localStorage.getItem('boat_buddy_auth')
            if (raw) {
              const auth = JSON.parse(raw)
              auth.subscription = tier
              localStorage.setItem('boat_buddy_auth', JSON.stringify(auth))
            }
          } catch { /* ignore */ }
          setStatus('done')
        } else {
          console.warn('[success] confirm failed:', data.error)
          setStatus('done') // Still redirect — webhook will handle it
        }
      } catch {
        setStatus('done') // Webhook fallback
      }
    }

    confirm()
  }, [searchParams])

  useEffect(() => {
    if (status !== 'done') return
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          router.replace('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status, router])

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
        <div className="rounded-2xl p-8 max-w-sm w-full"
          style={{ background: 'rgba(20,8,2,0.85)', border: '2px solid rgba(198,139,58,0.6)' }}>

          {status === 'confirming' ? (
            <>
              <div className="text-4xl mb-4 animate-pulse">⏳</div>
              <p className="text-sm" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
                Activating your subscription...
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">{tierIcon}</div>
              <h1 className="text-2xl font-bold mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                Welcome aboard,
              </h1>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                {tierLabel}!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>
                Your subscription is active. You now have full {tierLabel} access to Boat Buddy.
              </p>
              <div className="text-sm" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
                Redirecting in {countdown}...
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="bg-wood min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">⏳</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}