'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import Logo from '@/components/Logo'

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn()) router.replace('/')
  }, [router])

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(20,8,2,0.7)', borderBottom: '1px solid rgba(198,139,58,0.2)' }}>
        <Logo size="sm" />
        <Link href="/login"
          className="text-sm px-4 py-2 rounded-lg"
          style={{ color: '#C68B3A', border: '1px solid rgba(198,139,58,0.5)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-5 pb-16 overflow-y-auto">
        {/* Hero */}
        <div className="text-center mt-10 mb-8 w-full max-w-sm">
          <Logo size="lg" />
          <h1 className="text-3xl font-bold mt-6 mb-3 leading-tight"
            style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
            Your AI Marine Mechanic
          </h1>
          <p className="text-sm leading-relaxed"
            style={{ color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia, serif' }}>
            Diagnose engine problems, search service manuals, manage your whole shop — right from your phone.
          </p>
        </div>

        {/* CTAs */}
        <div className="w-full max-w-sm flex flex-col gap-3 mb-10">
          <Link href="/signup"
            className="btn-primary w-full text-center font-bold py-4"
            style={{ textDecoration: 'none', display: 'block', fontSize: '16px', letterSpacing: '0.02em' }}>
            ⚓ Create Free Account
          </Link>
          <Link href="/login"
            className="w-full text-center py-3 rounded-xl text-sm"
            style={{ background: 'rgba(245,240,232,0.07)', border: '1px solid rgba(245,240,232,0.2)', color: 'rgba(245,240,232,0.65)', fontFamily: 'Georgia, serif', textDecoration: 'none', display: 'block' }}>
            Already have an account? Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="w-full max-w-sm mb-8">
          <p className="text-xs uppercase tracking-wider mb-4"
            style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            What Boat Buddy Does
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '💬', title: 'AI Diagnostics', desc: 'Describe any symptom in plain English. Boat Buddy responds like an experienced mechanic standing next to you.' },
              { icon: '📷', title: 'Photo Analysis', desc: 'Send a photo of your engine, wiring, or bilge. AI identifies parts and diagnoses issues from the image.' },
              { icon: '📖', title: 'Service Manuals', desc: 'Exact torque specs, part numbers, valve clearances — searched from real manufacturer PDF manuals.' },
              { icon: '📐', title: 'System Diagrams', desc: '25+ professional marine wiring and system diagrams, always on hand.' },
              { icon: '📄', title: 'Work Orders & Logs', desc: 'Save diagnoses, track repairs, and generate professional invoices for your customers.' },
            ].map((f, i) => (
              <div key={i} className="panel p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{f.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)', fontFamily: 'Georgia, serif' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team features teaser */}
        <div className="w-full max-w-sm panel p-5 mb-8"
          style={{ background: 'rgba(198,139,58,0.06)', borderColor: 'rgba(198,139,58,0.3)' }}>
          <p className="text-xs uppercase tracking-wider mb-3"
            style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            For Marine Shops & Service Yards
          </p>
          <div className="flex flex-col gap-2">
            {[
              '🔩 Service department — job board, status tracking',
              '📦 Parts inventory with barcode scanning',
              '👥 Customer database & team management',
              '💬 Real-time team group chat',
              '🔗 Zapier integrations (QuickBooks, Slack & more)',
            ].map((item, i) => (
              <p key={i} className="text-xs" style={{ color: 'rgba(245,240,232,0.65)', fontFamily: 'Georgia, serif' }}>{item}</p>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="w-full max-w-sm panel p-5 mb-8">
          <p className="text-xs uppercase tracking-wider mb-4 text-center"
            style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Plans & Pricing
          </p>
          <div className="flex flex-col gap-0">
            {[
              { name: 'Stow Away', price: 'Free', desc: '1 question every 6 hours', color: 'rgba(245,240,232,0.5)' },
              { name: 'First Mate', price: '$19.99/mo', desc: 'Unlimited AI + work orders', color: '#7aafd4' },
              { name: 'Captain', price: '$39.99/mo', desc: 'Full shop tools · 5 team seats', color: '#C68B3A' },
              { name: 'Admiral', price: '$79.99/mo', desc: 'Everything · 10 team seats', color: '#C68B3A' },
            ].map((tier, i, arr) => (
              <div key={i} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(198,139,58,0.1)' : 'none' }}>
                <div>
                  <span className="text-sm font-bold" style={{ color: tier.color, fontFamily: 'Georgia, serif' }}>{tier.name}</span>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.45)', fontFamily: 'Georgia, serif' }}>{tier.desc}</p>
                </div>
                <span className="text-sm font-bold ml-4 flex-shrink-0" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{tier.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <Link href="/signup"
          className="btn-primary text-center font-bold px-12 py-4 mb-3"
          style={{ textDecoration: 'none', fontSize: '16px' }}>
          Get Started Free →
        </Link>
        <p className="text-xs text-center mb-8"
          style={{ color: 'rgba(245,240,232,0.3)', fontFamily: 'Georgia, serif' }}>
          No credit card required · Cancel anytime
        </p>
      </main>
    </div>
  )
}
