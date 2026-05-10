'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

export default function SuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Set subscription in localStorage
    try {
      const raw = localStorage.getItem('boat_buddy_auth')
      if (raw) {
        const auth = JSON.parse(raw)
        auth.subscription = 'first_mate'
        localStorage.setItem('boat_buddy_auth', JSON.stringify(auth))
      }
    } catch { /* ignore */ }

    // Countdown and redirect
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
  }, [router])

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
        <div className="rounded-2xl p-8 max-w-sm w-full"
          style={{ background: 'rgba(20,8,2,0.85)', border: '2px solid rgba(198,139,58,0.6)' }}>
          <div className="text-6xl mb-6">⚓</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Welcome aboard,
          </h1>
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            First Mate!
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>
            Your subscription is active. You now have unlimited access to Boat Buddy.
          </p>
          <div className="text-sm" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
            Redirecting in {countdown}...
          </div>
        </div>
      </main>
    </div>
  )
}
