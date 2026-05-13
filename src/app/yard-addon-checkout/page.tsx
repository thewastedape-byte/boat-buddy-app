'use client'
import { useState } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'
import { getAuth } from '@/lib/auth'

export default function YardAddonCheckoutPage() {
  const [loading, setLoading] = useState(false)
  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
  const headStyle = { color: '#F5F0E8', fontFamily: 'Georgia, serif' }

  const handleCheckout = async (tier: 'yard_addon' | 'yard_standalone') => {
    setLoading(true)
    try {
      const auth = getAuth()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth?.email, tier })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Checkout error. Please try again.')
    } catch { alert('Checkout failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <span className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
          ⚓ Add-on
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pb-28 text-center">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl p-8 mb-6"
            style={{ background: 'rgba(74,144,226,0.08)', border: '1px solid rgba(74,144,226,0.25)' }}>
            <p className="text-5xl mb-4">⚓</p>
            <h1 className="text-2xl font-bold mb-2" style={{ ...headStyle, fontFamily: 'Georgia, serif' }}>
              Yard Manager Add-on
            </h1>
            <p className="text-3xl font-bold mb-1" style={{ color: '#4A90E2', fontFamily: 'Georgia, serif' }}>$29<span className="text-base" style={dimStyle}>/mo</span></p>
            <p className="text-sm mt-3 leading-relaxed" style={dimStyle}>
              Interactive boat yard map, slip management, vessel assignments, and more — for any plan.
            </p>
          </div>

          <div className="rounded-xl p-5 mb-6 text-left"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(198,139,58,0.2)' }}>
            <p className="text-xs font-bold mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              What&apos;s included
            </p>
            {[
              '📍 Interactive drag & drop yard map',
              '⚓ Unlimited slip assignments',
              '👤 Owner & vessel info per slip',
              '🎨 Custom yard layout (up to 20×20)',
              '📝 Notes per slip',
              '📊 Occupancy at a glance',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 mb-2">
                <span className="text-sm">{item.split(' ')[0]}</span>
                <span className="text-sm" style={{ color: 'rgba(245,240,232,0.75)', fontFamily: 'system-ui, sans-serif' }}>
                  {item.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => handleCheckout('yard_addon')} disabled={loading}
              className="text-sm px-5 py-3 rounded-xl text-center font-bold"
              style={{ background: '#4A90E2', color: '#fff', fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : '⚓ Add Yard Manager — $29/mo'}
            </button>
            <Link href="/upgrade"
              className="text-sm px-5 py-3 rounded-xl text-center font-bold"
              style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⬆️ Upgrade to Captain (Included Free)
            </Link>
            <Link href="/yard"
              className="text-sm px-5 py-3 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ← Back to Yard
            </Link>
          </div>
        </div>
      </main>

      <NavBar />
    </div>
  )
}
