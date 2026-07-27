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
            style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
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
            style={{ background: '#0a1c37', border: '3px solid #C68B3A', color: '#F5F0E8', fontFamily: 'Georgia, serif', textDecoration: 'none', display: 'block', fontWeight: 'bold' }}>
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
                  <p className="text-xs leading-relaxed" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team features teaser */}
        <div className="w-full max-w-sm panel p-5 mb-8"
          style={{ background: '#0a1c37', borderColor: 'rgba(198,139,58,0.4)' }}>
          <p className="text-xs uppercase tracking-wider mb-3"
            style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            For Marine Shops &amp; Service Yards
          </p>
          <div className="flex flex-col gap-2">
            {[
              '🔩 Service department — job board, status tracking',
              '📦 Parts inventory with barcode scanning',
              '👥 Customer database & team management',
              '💬 Real-time team group chat',
              '🔗 Zapier integrations (QuickBooks, Slack & more)',
            ].map((item, i) => (
              <p key={i} className="text-xs" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{item}</p>
            ))}
          </div>
        </div>

        {/* Pricing — clickable tiers */}
        <div className="w-full max-w-sm mb-8">
          <p className="text-xs uppercase tracking-wider mb-4 text-center"
            style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Choose Your Plan
          </p>
          <div className="flex flex-col gap-3">
            {[
              {
                name: 'Stow Away', icon: '🪝', tier: null, price: 'Free',
                desc: '1 question every 6 hours · Basic AI diagnosis',
                nameColor: 'rgba(245,240,232,0.8)',
                bg: 'rgba(30,20,10,0.9)',
                border: '1px solid rgba(245,240,232,0.15)',
              },
              {
                name: 'First Mate', icon: '⚓', tier: 'first_mate', price: '$9.99/mo',
                desc: 'Unlimited AI · Work orders · Diagrams · 6 languages',
                nameColor: '#7aafd4',
                bg: 'rgba(10,28,55,0.97)',
                border: '2px solid rgba(122,175,212,0.7)',
                badge: 'MOST POPULAR',
              },
              {
                name: 'Captain', icon: '🚢', tier: 'captain', price: '$24.99/mo',
                desc: 'First Mate + Yard Manager · 5 team seats',
                nameColor: '#C68B3A',
                bg: 'rgba(40,22,5,0.97)',
                border: '2px solid rgba(198,139,58,0.7)',
              },
              {
                name: 'Admiral', icon: '🪖', tier: 'admiral', price: '$49.99/mo',
                desc: 'Captain + Marina Manager · 10 team seats · Everything',
                nameColor: '#E8C97A',
                bg: 'rgba(20,8,2,0.98)',
                border: '2px solid #C68B3A',
                badge: 'FULL FLEET',
              },
            ].map((t, i) => (
              <Link
                key={i}
                href={t.tier ? `/signup?tier=${t.tier}` : '/signup'}
                style={{ textDecoration: 'none' }}
              >
                <div className="p-4 flex items-center justify-between rounded-xl"
                  style={{ background: t.bg, border: t.border, cursor: 'pointer' }}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{t.icon}</span>
                      <p className="text-sm font-bold" style={{ color: t.nameColor, fontFamily: 'Georgia, serif' }}>{t.name}</p>
                      {(t as any).badge && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: t.nameColor, color: '#1A0A00', fontSize: '9px', whiteSpace: 'nowrap' }}>
                          {(t as any).badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{t.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-sm font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{t.price}</span>
                    {t.tier && <span style={{ color: t.nameColor }}>→</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-center mt-3 mb-2"
            style={{ color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia, serif' }}>
            No credit card required for free tier · Cancel anytime
          </p>
          <p className="text-xs text-center mb-8">
            <Link href="/about" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              Why Boat Buddy vs ChatGPT? →
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
