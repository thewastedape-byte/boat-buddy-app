'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from '@/lib/auth'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'

const TIERS = [
  {
    icon: '🪝',
    name: 'Stow Away',
    price: 'Free',
    period: '',
    seats: null,
    tag: null,
    current: false,
    action: null,
    features: [
      '1 question every 6 hours',
      'Basic AI diagnosis',
      'Good for occasional use',
    ],
    comingSoon: false,
  },
  {
    icon: '⚓',
    name: 'First Mate',
    price: '$9.99',
    originalPrice: '$19.99',
    period: '/mo',
    seats: '1 user',
    tag: 'MOST POPULAR',
    current: true,
    action: 'subscribe',
    features: [
      'Unlimited AI questions',
      'Photo diagnosis',
      '📖 Service manual search',
      '25 wiring & system diagrams',
      'Repair log & work orders',
      'Multi-vessel fleet',
      'Service reminders',
      '6 language support',
    ],
    comingSoon: false,
  },
  {
    icon: '🚢',
    name: 'Captain',
    price: '$49',
    originalPrice: '$79',
    period: '/mo',
    seats: '5 seats',
    tag: 'TEAM',
    current: false,
    action: null,
    features: [
      'Everything in First Mate',
      '5 team member seats',
      'Shared repair log',
      'Parts tracking',
      'Customer database',
      'QuickBooks sync',
      'Zapier integration',
      'Team dashboard',
    ],
    comingSoon: true,
  },
  {
    icon: '🪖',
    name: 'Admiral',
    price: '$99',
    originalPrice: '$149',
    period: '/mo',
    seats: '10 seats',
    tag: 'YARD / FLEET',
    current: false,
    action: null,
    features: [
      'Everything in Captain',
      '10 team seats',
      'Full parts inventory',
      'Purchase orders',
      'Service department workflow',
      'Third-party software integration',
      'Priority support',
      '+5 seat packs available — $35/pack',
    ],
    comingSoon: true,
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const auth = getAuth()
    if (auth?.email) setEmail(auth.email)
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not start checkout. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          ← Back
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Choose Your Plan</h1>
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>From solo boater to full service yard</p>
        </div>

        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {TIERS.map((tier) => (
            <div key={tier.name} className="panel p-4 relative overflow-hidden"
              style={{ border: tier.current ? '2px solid #C68B3A' : '1px solid rgba(198,139,58,0.3)', opacity: tier.comingSoon ? 0.85 : 1 }}>

              {/* Tag badge */}
              {tier.tag && (
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold"
                  style={{ background: tier.comingSoon ? 'rgba(198,139,58,0.3)' : '#C68B3A', color: tier.comingSoon ? '#C68B3A' : '#3D1C02', fontFamily: 'Georgia, serif', borderBottomLeftRadius: '8px' }}>
                  {tier.comingSoon ? 'COMING SOON' : tier.tag}
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3 pr-20">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-2xl">{tier.icon}</span>
                    <span className="text-lg font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{tier.name}</span>
                  </div>
                  {tier.seats && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                      {tier.seats}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex flex-col items-end">
                      {(tier as any).originalPrice && (
                        <span className="text-xs line-through" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>{(tier as any).originalPrice}/mo</span>
                      )}
                      <span className="text-2xl font-bold" style={{ color: tier.current ? '#C68B3A' : '#F5F0E8', fontFamily: 'Georgia, serif' }}>{tier.price}</span>
                      {(tier as any).originalPrice && (
                        <span className="text-xs" style={{ color: '#70c070', fontFamily: 'Georgia, serif' }}>Intro price</span>
                      )}
                    </div>
                  {tier.period && <span className="text-sm" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>{tier.period}</span>}
                </div>
              </div>

              {/* Features */}
              <ul className="mb-4 flex flex-col gap-1.5">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: tier.comingSoon ? 'rgba(198,139,58,0.5)' : '#C68B3A', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ color: tier.comingSoon ? 'rgba(245,240,232,0.5)' : 'rgba(245,240,232,0.85)', fontFamily: 'system-ui, sans-serif' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              {tier.action === 'subscribe' && (
                <div>
                  {error && <p className="text-xs mb-2 text-center" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{error}</p>}
                  <button onClick={handleSubscribe} disabled={loading} className="btn-primary w-full">
                    {loading ? 'Loading...' : '⚓ Upgrade to First Mate — $19.99/mo'}
                  </button>
                  <p className="text-xs text-center mt-2" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Cancel anytime from Settings</p>
                </div>
              )}

              {tier.comingSoon && (
                <div className="text-center py-2 rounded-lg"
                  style={{ background: 'rgba(198,139,58,0.08)', border: '1px dashed rgba(198,139,58,0.3)' }}>
                  <p className="text-xs" style={{ color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif' }}>
                    🔔 Notify me when available
                  </p>
                  <a href={`mailto:thewastedape@gmail.com?subject=Notify me: ${tier.name} plan&body=Please notify me when the ${tier.name} plan is available. My email is: `}
                    className="text-xs" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', textDecoration: 'underline' }}>
                    Join the waitlist →
                  </a>
                </div>
              )}

              {!tier.action && !tier.comingSoon && (
                <div className="text-center py-1">
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Your current free plan</p>
                </div>
              )}
            </div>
          ))}

          {/* Seat pack explainer */}
          <div className="panel p-4" style={{ background: 'rgba(20,8,2,0.6)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>⚓+ Need more than 10 seats?</p>
            <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif', lineHeight: '1.6' }}>
              Admiral includes 10 seats. Add more in 5-seat packs — $35/pack/month. Scale as your yard grows.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: 'Georgia, serif' }}>
              {[
                ['10 seats', '$149/mo'],
                ['15 seats', '$184/mo'],
                ['20 seats', '$219/mo'],
                ['25 seats', '$254/mo'],
              ].map(([seats, price]) => (
                <div key={seats} className="flex justify-between px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(198,139,58,0.08)', border: '1px solid rgba(198,139,58,0.2)' }}>
                  <span style={{ color: 'rgba(245,240,232,0.7)' }}>{seats}</span>
                  <span style={{ color: '#C68B3A', fontWeight: 'bold' }}>{price}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
              Larger operations — <a href="mailto:thewastedape@gmail.com?subject=Enterprise pricing" style={{ color: '#C68B3A' }}>contact us for enterprise pricing</a>
            </p>
          </div>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
