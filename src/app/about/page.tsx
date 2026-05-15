'use client'
import Link from 'next/link'
import Logo from '@/components/Logo'

const COMPARISONS = [
  {
    feature: 'Marine engine knowledge',
    boatBuddy: '✅ Deep — Cummins, Volvo, Mercury, Yanmar, MerCruiser, diesel & outboard',
    chatGpt: '⚠️ General — surface-level, often wrong on specifics',
  },
  {
    feature: 'Service manual search',
    boatBuddy: '✅ Real PDF manuals, torque specs, wiring diagrams built in',
    chatGpt: '❌ No manuals — guesses from training data',
  },
  {
    feature: 'Fault code lookup',
    boatBuddy: '✅ Marine-specific fault codes with exact fix steps',
    chatGpt: '⚠️ Hit or miss — sometimes correct, often vague',
  },
  {
    feature: 'Photo diagnosis',
    boatBuddy: '✅ Send a photo of the problem, get a diagnosis',
    chatGpt: '⚠️ Can analyze photos but no marine context',
  },
  {
    feature: 'Wiring diagrams',
    boatBuddy: '✅ 25 marine-specific electrical & system diagrams',
    chatGpt: '❌ Cannot generate accurate wiring diagrams',
  },
  {
    feature: 'Shop management',
    boatBuddy: '✅ Job board, parts inventory, customers, work orders',
    chatGpt: '❌ Not a business tool',
  },
  {
    feature: 'Repair logs',
    boatBuddy: '✅ Tracks every repair per vessel over time',
    chatGpt: '❌ No memory between sessions',
  },
  {
    feature: 'Cost',
    boatBuddy: '✅ $9.99/mo — built for this one job',
    chatGpt: '$20/mo — general purpose, not marine-focused',
  },
]

const TIERS = [
  {
    icon: '🪝',
    name: 'Stow Away',
    price: 'Free',
    color: 'rgba(245,240,232,0.1)',
    border: 'rgba(245,240,232,0.15)',
    who: 'Casual boat owners who rarely need help',
    includes: [
      '1 AI question every 6 hours',
      'Basic engine diagnosis',
      'Good for occasional troubleshooting',
    ],
    missing: [
      'No service manual search',
      'No photo diagnosis',
      'No repair logs',
      'No shop tools',
    ],
  },
  {
    icon: '⚓',
    name: 'First Mate',
    price: '$9.99/mo',
    color: 'rgba(198,139,58,0.15)',
    border: 'rgba(198,139,58,0.5)',
    who: 'DIY boat owners & individual mechanics',
    includes: [
      'Unlimited AI questions — ask as much as you want',
      'Photo diagnosis — snap a pic, get an answer',
      'Full service manual search (real PDFs)',
      '25 wiring & system diagrams',
      'Repair log per vessel',
      'Multi-vessel fleet tracking',
      'Service reminders',
      '6 language support',
    ],
    missing: [],
    highlight: true,
    trial: '50% off first 2 months',
  },
  {
    icon: '🚢',
    name: 'Captain',
    price: '$24.99/mo',
    color: 'rgba(198,139,58,0.1)',
    border: 'rgba(198,139,58,0.3)',
    who: 'Small marine shops & service yards (up to 5 staff)',
    includes: [
      'Everything in First Mate',
      '5 team member seats',
      'Shared repair log across team',
      'Parts inventory & tracking',
      'Customer database',
      'Job board (Open → In Progress → Complete → Invoiced)',
      'Work orders with company branding',
      'QuickBooks sync via Zapier',
      'Yard Manager & Marina Manager included',
      'Real-time team group chat',
    ],
    missing: [],
  },
  {
    icon: '🪖',
    name: 'Admiral',
    price: '$49.99/mo',
    color: 'rgba(139,26,26,0.2)',
    border: 'rgba(198,139,58,0.3)',
    who: 'Larger shops, fleets & marinas (up to 10 staff)',
    includes: [
      'Everything in Captain',
      '10 team seats (+ $35/pack for more)',
      'Full parts inventory with purchase orders',
      'Service department workflow',
      'Third-party software integrations',
      'Priority support',
    ],
    missing: [],
  },
]

export default function AboutPage() {
  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(20,8,2,0.7)', borderBottom: '1px solid rgba(198,139,58,0.2)' }}>
        <Logo size="sm" />
        <Link href="/upgrade"
          className="text-sm px-4 py-2 rounded-lg font-bold"
          style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          Start Free Trial
        </Link>
      </header>

      <main className="flex-1 px-5 pb-16 overflow-y-auto max-w-2xl mx-auto w-full">

        {/* Hero */}
        <div className="text-center mt-10 mb-12">
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            Why Boat Buddy?
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia, serif' }}>
            There are a lot of AI tools out there. Here&apos;s why a marine mechanic or boat owner needs one built specifically for the water.
          </p>
        </div>

        {/* Boat Buddy vs ChatGPT */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Boat Buddy vs ChatGPT
          </h2>
          <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.55)', fontFamily: 'Georgia, serif' }}>
            ChatGPT is a great general-purpose tool. But when your engine is down at the dock, &quot;general purpose&quot; isn&apos;t good enough.
          </p>
          <div className="flex flex-col gap-3">
            {COMPARISONS.map((c, i) => (
              <div key={i} style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', borderRadius: '10px', padding: '14px' }}>
                <p className="text-xs font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>{c.feature}</p>
                <div className="flex flex-col gap-1">
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.85)', fontFamily: 'Georgia, serif' }}>
                    <span style={{ color: '#C68B3A' }}>Boat Buddy: </span>{c.boatBuddy}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
                    <span>ChatGPT: </span>{c.chatGpt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Which Plan Is Right for You?
          </h2>
          <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.55)', fontFamily: 'Georgia, serif' }}>
            From casual weekend boaters to full marine service shops.
          </p>
          <div className="flex flex-col gap-5">
            {TIERS.map((t, i) => (
              <div key={i} style={{ background: t.color, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                    {t.icon} {t.name}
                  </h3>
                  <span className="text-sm font-bold" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>{t.price}</span>
                </div>
                {t.trial && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold mb-2 inline-block"
                    style={{ background: 'rgba(198,139,58,0.3)', color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                    🎁 {t.trial}
                  </span>
                )}
                <p className="text-xs mb-3 mt-1" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
                  <strong style={{ color: 'rgba(245,240,232,0.8)' }}>Best for: </strong>{t.who}
                </p>
                <ul className="flex flex-col gap-1 mb-2">
                  {t.includes.map((f, j) => (
                    <li key={j} className="text-xs flex gap-2" style={{ color: 'rgba(245,240,232,0.85)', fontFamily: 'Georgia, serif' }}>
                      <span style={{ color: '#C68B3A', flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                {t.missing.length > 0 && (
                  <ul className="flex flex-col gap-1 mt-2">
                    {t.missing.map((f, j) => (
                      <li key={j} className="text-xs flex gap-2" style={{ color: 'rgba(245,240,232,0.35)', fontFamily: 'Georgia, serif' }}>
                        <span style={{ flexShrink: 0 }}>✕</span> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            Introductory pricing — limited time
          </h2>
          <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
            50% off your first 2 months. Cancel anytime.
          </p>
          <Link href="/upgrade"
            className="btn-primary font-bold"
            style={{ textDecoration: 'none', display: 'inline-block', padding: '14px 32px', fontSize: '16px' }}>
            ⚓ Get First Mate — $9.99/mo
          </Link>
          <p className="text-xs mt-4" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
            Already have an account? <Link href="/login" style={{ color: '#C68B3A', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

      </main>
    </div>
  )
}
