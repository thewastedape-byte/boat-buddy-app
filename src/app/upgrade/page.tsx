'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'

const TIERS = [
  {
    icon: '🪝',
    name: 'Stow Away',
    tier: null,
    price: 'Free',
    originalPrice: null,
    period: '',
    seats: null,
    tag: null,
    features: ['1 question every 6 hours', 'Basic AI diagnosis', 'Good for occasional use'],
  },
  {
    icon: '⚓',
    name: 'First Mate',
    tier: 'first_mate',
    price: '$9.99',
    originalPrice: '$19.99',
    period: '/mo',
    seats: '1 user',
    tag: 'MOST POPULAR',
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
  },
  {
    icon: '🚢',
    name: 'Captain',
    tier: 'captain',
    price: '$24.99',
    originalPrice: '$49',
    period: '/mo',
    seats: '5 seats',
    tag: 'TEAM',
    features: [
      'Everything in First Mate',
      '5 team member seats',
      'Shared repair log',
      'Parts tracking',
      'Customer database',
      'QuickBooks sync',
      'Zapier integration',
      'Team dashboard',
      '⚓ Yard Manager included',
      '🚢 Marina Manager included',
    ],
  },
  {
    icon: '🪖',
    name: 'Admiral',
    tier: 'admiral',
    price: '$49.99',
    originalPrice: '$99',
    period: '/mo',
    seats: '10 seats',
    tag: 'YARD / FLEET',
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
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const auth = getAuth()
    if (auth?.email) setEmail(auth.email)
  }, [])

  const handleSubscribe = async (tier: string) => {
    setLoading(tier)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier }),
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
      setLoading(null)
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

        {error && (
          <div className="max-w-lg mx-auto mb-4 px-4 py-3 rounded-lg text-sm text-center"
            style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(139,26,26,0.6)', color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {TIERS.map((tier) => (
            <div key={tier.name} className="panel p-4 relative overflow-hidden"
              style={{ border: tier.tag === 'MOST POPULAR' ? '2px solid #C68B3A' : '1px solid rgba(198,139,58,0.3)' }}>

              {tier.tag && (
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold"
                  style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', borderBottomLeftRadius: '8px' }}>
                  {tier.tag}
                </div>
              )}

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
                  {tier.originalPrice && (
                    <span className="text-xs line-through block" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>{tier.originalPrice}/mo</span>
                  )}
                  <span className="text-2xl font-bold" style={{ color: tier.tag === 'MOST POPULAR' ? '#C68B3A' : '#F5F0E8', fontFamily: 'Georgia, serif' }}>{tier.price}</span>
                  {tier.originalPrice && (
                    <span className="text-xs block" style={{ color: '#70c070', fontFamily: 'Georgia, serif' }}>Intro price</span>
                  )}
                  {tier.period && <span className="text-sm" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>{tier.period}</span>}
                </div>
              </div>

              <ul className="mb-4 flex flex-col gap-1.5">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: '#C68B3A', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ color: 'rgba(245,240,232,0.85)', fontFamily: 'system-ui, sans-serif' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {tier.tier ? (
                <button
                  onClick={() => handleSubscribe(tier.tier!)}
                  disabled={loading !== null}
                  className="btn-primary w-full"
                  style={{ opacity: loading !== null ? 0.7 : 1 }}
                >
                  {loading === tier.tier ? 'Loading...' : `⚓ Get ${tier.name} — ${tier.price}${tier.period}`}
                </button>
              ) : (
                <div className="text-center py-1">
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Your current free plan</p>
                </div>
              )}

              {tier.tier && (
                <p className="text-xs text-center mt-2" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Cancel anytime from Settings</p>
              )}
            </div>
          ))}

          <div className="panel p-4" style={{ background: 'rgba(20,8,2,0.6)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>⚓+ Need more than 10 seats?</p>
            <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif', lineHeight: '1.6' }}>
              Admiral includes 10 seats. Add 5-seat packs at $35/pack/month.
            </p>
            <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
              <a href="mailto:thewastedape@gmail.com?subject=Enterprise pricing" style={{ color: '#C68B3A' }}>Contact us for enterprise pricing</a>
            </p>
          </div>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
