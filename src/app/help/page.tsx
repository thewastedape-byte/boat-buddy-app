'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'
import { getAuth } from '@/lib/auth'

const coreSteps = [
  {
    icon: '💬',
    title: 'Ask a Question',
    desc: 'Type any marine problem in plain English. Describe symptoms, noises, smells, error codes — anything. Boat Buddy responds like an experienced mechanic standing next to you.',
    example: '"My engine is overheating at 2,000 RPM and I hear a squealing noise."',
  },
  {
    icon: '📷',
    title: 'Send a Photo',
    desc: 'Tap the camera or gallery icon to send a photo of your engine, wiring, bilge, or any component. The AI identifies parts and diagnoses issues from the image.',
    example: 'Photo of a leaking raw water pump, corroded wiring, or unknown component.',
  },
  {
    icon: '📖',
    title: 'Search Service Manuals',
    desc: 'Tap the 📖 book icon in the chat bar to enter Manual Mode. Ask for exact torque specs, part numbers, valve clearances, or procedures — the AI searches real manufacturer service manual PDFs.',
    example: '"What is the torque spec for the cylinder head bolts on a Yamaha 90A?"',
  },
  {
    icon: '📐',
    title: 'View System Diagrams',
    desc: 'Tap the 📐 button in the chat header or visit the Diagrams page for 25 professional marine system schematics and electrical wiring diagrams.',
    example: '"Show me the raw water cooling diagram" — diagram appears instantly in chat.',
  },
  {
    icon: '⚓',
    title: 'Save Your Vessel',
    desc: 'Go to the Vessel page to save your boat\'s make, model, year, engine, and hull ID. Boat Buddy uses this context to give more accurate, specific answers for your exact boat.',
    example: 'Add multiple vessels — Boat Buddy tracks each one separately.',
  },
  {
    icon: '🔧',
    title: 'Save to Repair Log',
    desc: 'After any AI response, tap 🗒️ Save to Log to save that diagnosis to your repair history. Access it anytime from the Log page.',
    example: 'Build a full maintenance history for your vessel over time.',
  },
  {
    icon: '📄',
    title: 'Create a Work Order',
    desc: 'From the Log page, tap any entry to open a professional Work Order. Auto-fills your vessel, shop name, logo, and contact info. Add parts, labor hours, and get a PDF-ready invoice.',
    example: 'Print → Save as PDF to send to customers or keep for your records.',
  },
]

const teamSteps = [
  {
    icon: '🔩',
    title: 'Service Department',
    desc: 'Manage all your repair jobs in one place. Jobs move through Open → In Progress → Complete → Invoiced. Filter by status, assign to techs, and link directly to work orders.',
    example: 'Start a diagnosis in AI chat, save it to log, then track it in Service.',
  },
  {
    icon: '📦',
    title: 'Parts Inventory',
    desc: 'Add parts with name, part number, barcode, price, supplier, and storage location. Tap 📷 Scan to use your phone camera or a Bluetooth/USB barcode scanner to look up and pull parts.',
    example: 'Scan a part out — it auto-deducts from stock and adds to your active work order.',
  },
  {
    icon: '👥',
    title: 'Customer Database',
    desc: 'Store customer names, emails, phone numbers, addresses, and notes. Access from Settings → Team Tools → Customers.',
    example: 'Search by name, email, or phone to quickly find a returning customer.',
  },
  {
    icon: '💬',
    title: 'Team Group Chat',
    desc: 'Real-time messaging for your whole team. Messages sync across all devices — anyone on your team can see and reply. Tap Team Chat in the bottom nav.',
    example: 'Post job updates, parts requests, or quick questions to the crew.',
  },
  {
    icon: '⚓',
    title: 'Team Management',
    desc: 'Invite technicians by email, assign roles (Member or Admin), and track seat usage. Go to Settings → Team Tools → Team Management.',
    example: 'Captain plan: 5 seats. Admiral plan: 10 seats. Add 5-seat packs as you grow.',
  },
  {
    icon: '🔗',
    title: 'Integrations (Zapier)',
    desc: 'Connect Boat Buddy to QuickBooks, Google Sheets, Slack, and 6,000+ other apps via Zapier webhooks. Go to Settings → Team Tools → Integrations.',
    example: 'Trigger a QuickBooks invoice automatically when a job is marked Invoiced.',
  },
]

const bizSteps = [
  {
    icon: '🏢',
    title: 'Business Profile',
    desc: 'Set your shop name, phone, address, and logo in Settings → Business Profile. This info auto-fills every work order and invoice you generate.',
    example: 'Upload your shop logo (PNG or JPG, max 500KB) — it appears at the top of every work order.',
  },
]

export default function HelpPage() {
  const [sub, setSub] = useState('stow_away')

  useEffect(() => {
    const auth = getAuth()
    setSub(auth?.subscription || 'stow_away')
  }, [])

  const isTeam = sub === 'captain' || sub === 'admiral'
  const tierLabel = sub === 'admiral' ? 'Admiral' : sub === 'captain' ? 'Captain' : sub === 'first_mate' ? 'First Mate' : 'Stow Away'
  const tierColor = sub === 'admiral' ? '#C68B3A' : sub === 'captain' ? '#7aafd4' : '#888'

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <span className="text-xs px-2 py-1 rounded-full font-bold"
          style={{ background: 'rgba(198,139,58,0.15)', color: tierColor, border: `1px solid ${tierColor}40`, fontFamily: 'Georgia, serif' }}>
          {tierLabel}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>❓ Help</h1>
        <p className="text-xs mb-6" style={dimStyle}>How to get the most out of Boat Buddy</p>

        {/* Core features — all tiers */}
        <div className="mb-2">
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Core Features — All Plans</p>
          <div className="flex flex-col gap-3">
            {coreSteps.map((step, i) => (
              <div key={i} className="panel p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{step.icon}</span>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{step.title}</p>
                    <p className="text-xs mb-2" style={dimStyle}>{step.desc}</p>
                    <p className="text-xs italic px-2 py-1 rounded" style={{ background: 'rgba(198,139,58,0.08)', color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif', borderLeft: '2px solid rgba(198,139,58,0.3)' }}>
                      {step.example}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Profile — all tiers */}
        <div className="mt-5 mb-2">
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Business Setup — All Plans</p>
          <div className="flex flex-col gap-3">
            {bizSteps.map((step, i) => (
              <div key={i} className="panel p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{step.icon}</span>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{step.title}</p>
                    <p className="text-xs mb-2" style={dimStyle}>{step.desc}</p>
                    <p className="text-xs italic px-2 py-1 rounded" style={{ background: 'rgba(198,139,58,0.08)', color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif', borderLeft: '2px solid rgba(198,139,58,0.3)' }}>
                      {step.example}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team features — Captain/Admiral only */}
        {isTeam ? (
          <div className="mt-5 mb-2">
            <p className="text-xs uppercase tracking-wider mb-3" style={{ color: tierColor, fontFamily: 'Georgia, serif' }}>
              {tierLabel} Features — Service Department
            </p>
            <div className="flex flex-col gap-3">
              {teamSteps.map((step, i) => (
                <div key={i} className="panel p-4" style={{ borderColor: `${tierColor}30` }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{step.icon}</span>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{step.title}</p>
                      <p className="text-xs mb-2" style={dimStyle}>{step.desc}</p>
                      <p className="text-xs italic px-2 py-1 rounded" style={{ background: 'rgba(198,139,58,0.08)', color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif', borderLeft: `2px solid ${tierColor}50` }}>
                        {step.example}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 panel p-4" style={{ background: 'rgba(198,139,58,0.05)', border: '1px solid rgba(198,139,58,0.2)' }}>
            <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>⚓ Service Department Features</p>
            <p className="text-xs mb-3" style={dimStyle}>Upgrade to Captain or Admiral to unlock the full service department: job board, parts inventory with barcode scanning, customer database, team chat, and Zapier integrations.</p>
            <Link href="/upgrade" className="btn-primary inline-block px-5 py-2 text-sm" style={{ textDecoration: 'none' }}>
              View Plans →
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-5 panel p-4">
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Quick Links</p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/setup', label: '🚀 Setup Guide' },
              { href: '/diagrams', label: '📐 Browse All Diagrams' },
              { href: '/vessel', label: '⚓ Vessel Profile' },
              { href: '/workorder', label: '📄 New Work Order' },
              ...(isTeam ? [
                { href: '/service', label: '🔩 Service Department' },
                { href: '/inventory', label: '📦 Parts Inventory' },
                { href: '/team', label: '⚓ Team Management' },
                { href: '/integrations', label: '🔗 Integrations' },
              ] : []),
              { href: '/contact', label: '✉️ Contact Support' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="text-sm py-2 flex items-center justify-between"
                style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', textDecoration: 'none', borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
                {link.label} <span style={{ opacity: 0.5 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
