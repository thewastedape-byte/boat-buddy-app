'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import Logo from '@/components/Logo'

const STORAGE_KEY = 'bb_setup_progress'

interface Step {
  id: string
  icon: string
  title: string
  desc: string
  details: string[]
  action?: { label: string; href: string }
  tip?: string
}

const coreSteps: Step[] = [
  {
    id: 'account',
    icon: '👤',
    title: 'Step 1 — Create Your Account',
    desc: 'You need an account to use Boat Buddy. It\'s free to start.',
    details: [
      'Tap the link you received or go to boatbuddy.thewastedape.com',
      'Tap "Create Account"',
      'Enter your email address and choose a password (at least 6 characters)',
      'Tap "Create Account" again',
      'Tap "Continue to App"',
    ],
    tip: 'Use your work email if you have one — it makes team setup easier later.',
  },
  {
    id: 'vessel',
    icon: '⚓',
    title: 'Step 2 — Add Your Boat',
    desc: 'Tell Boat Buddy about your vessel so the AI gives you accurate answers.',
    details: [
      'Tap the ⚙️ Settings tab at the bottom of the screen',
      'Scroll down and tap "Vessel Profile"',
      'Enter your boat\'s name, year, make, model, and engine type',
      'Tap Save',
    ],
    action: { label: 'Go to Vessel', href: '/vessel' },
    tip: 'The more detail you add, the more accurate the AI\'s answers will be for your specific boat.',
  },
  {
    id: 'business',
    icon: '🏢',
    title: 'Step 3 — Set Up Your Business Profile',
    desc: 'Your shop name, phone number, and logo will appear on every work order you create.',
    details: [
      'Tap ⚙️ Settings at the bottom',
      'Find the "Business Profile" section near the top',
      'Enter your shop or company name',
      'Enter your phone number',
      'Enter your address',
      'Tap the Upload button to add your logo (optional — any PNG or JPG under 500KB)',
      'Tap "Save Business Profile"',
    ],
    action: { label: 'Go to Settings', href: '/settings' },
    tip: 'Your logo will appear at the top of every work order and invoice. Skip it for now if you don\'t have one ready.',
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'Step 4 — Ask the AI Your First Question',
    desc: 'Boat Buddy is an AI marine mechanic. Just describe your problem in plain English.',
    details: [
      'Tap the 🧠 AI tab at the bottom of the screen',
      'Type your problem in the text box — describe what you\'re hearing, seeing, or smelling',
      'Tap the ➤ send button',
      'Read the response — it will explain the likely cause and what to check',
      'If you want to save that diagnosis, tap "🗒️ Save to Log" under the response',
    ],
    action: { label: 'Open AI Chat', href: '/' },
    tip: 'Be specific. "Engine overheating at 2,000 RPM with white smoke from exhaust" gets a much better answer than "engine problem".',
  },
  {
    id: 'workorder',
    icon: '📄',
    title: 'Step 5 — Create a Work Order',
    desc: 'Turn any saved diagnosis into a professional work order with parts, labor, and customer signature.',
    details: [
      'After saving a diagnosis to the log, tap the 🔧 Log tab',
      'Find the saved entry and tap "📄 Work Order"',
      'Your boat info and shop name auto-fill at the top',
      'Add parts — tap "+ Add Part" to add each part with quantity and price',
      'Fill in labor hours and your hourly rate',
      'Add your tech name',
      'Tap "🖨️ Print / Save PDF" to save it as a PDF or print it',
    ],
    action: { label: 'Open Work Order', href: '/workorder' },
    tip: 'The work order auto-calculates totals. Print it to PDF and email it to your customer.',
  },
]

const teamSteps: Step[] = [
  {
    id: 'team',
    icon: '⚓',
    title: 'Step 6 — Invite Your Technicians',
    desc: 'Add your techs to the team so they can access jobs, inventory, and team chat.',
    details: [
      'Tap ⚙️ Settings',
      'Tap "Team Tools" → "Team Management"',
      'Enter your tech\'s email address',
      'Choose their role: Member (can view and add jobs) or Admin (full access except billing)',
      'Tap "Send Invite by Email" — they\'ll get an email with a signup link',
      'OR tap "Generate Invite Link" and copy the link to send via text or WhatsApp',
      'When they sign up using that link, they automatically join your team',
    ],
    action: { label: 'Team Management', href: '/team' },
    tip: 'Each tech needs their own account. Captain plan includes 5 seats, Admiral includes 10.',
  },
  {
    id: 'inventory',
    icon: '📦',
    title: 'Step 7 — Set Up Parts Inventory',
    desc: 'Add your parts so you can scan them in and out when doing jobs.',
    details: [
      'Tap 📦 Inventory in the bottom nav',
      'Tap "+ Add Part"',
      'Enter the part name, part number, and how many you have in stock',
      'Add a barcode if you have one (scan it with your camera using the 📷 button)',
      'Add the unit price and supplier',
      'Tap Save',
      'Repeat for each part you stock',
      'When pulling parts for a job, tap 📷 Scan and scan the barcode — it auto-deducts from stock',
    ],
    action: { label: 'Go to Inventory', href: '/inventory' },
    tip: 'You can add parts one at a time as you use them. You don\'t need to add everything at once.',
  },
  {
    id: 'service',
    icon: '🔩',
    title: 'Step 8 — Manage Jobs in Service Dept',
    desc: 'Track every repair job from open to invoiced in one place.',
    details: [
      'When a customer brings in a boat, tap the 🧠 AI tab',
      'Describe the problem and get a diagnosis',
      'Tap "🗒️ Save to Log"',
      'The job will appear in the 🔩 Service tab',
      'Tap the status button to advance it: Open → In Progress → Complete → Invoiced',
      'When complete, create a Work Order from the Log tab',
    ],
    action: { label: 'Service Department', href: '/service' },
    tip: 'The Service tab shows all jobs across your whole team — everyone sees the same board.',
  },
  {
    id: 'zapier',
    icon: '🔗',
    title: 'Step 9 — Connect to Your Other Software (Optional)',
    desc: 'Automatically send job info to QuickBooks, Google Sheets, or any other app you use.',
    details: [
      'Go to zapier.com and create a free account if you don\'t have one',
      'Create a new "Zap"',
      'Choose "Webhooks by Zapier" as the trigger app',
      'Select "Catch Hook" and copy the webhook URL Zapier gives you',
      'In Boat Buddy, go to ⚙️ Settings → Team Tools → Integrations',
      'Tap "+ Add Webhook"',
      'Paste the Zapier URL and choose when to trigger it (e.g. "Job Completed")',
      'Back in Zapier, choose your action app — like QuickBooks or Google Sheets',
      'Test the connection',
    ],
    action: { label: 'Integrations', href: '/integrations' },
    tip: 'Zapier is free for basic automations. If you use QuickBooks, this is how you push invoices automatically.',
  },
]

export default function SetupPage() {
  const router = useRouter()
  const auth = getAuth()
  const sub = auth?.subscription || 'stow_away'
  const isTeam = sub === 'captain' || sub === 'admiral'
  const allSteps = isTeam ? [...coreSteps, ...teamSteps] : coreSteps

  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setCompleted(JSON.parse(saved))
  }, [])

  const markDone = (id: string) => {
    const updated = { ...completed, [id]: true }
    setCompleted(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    if (current < allSteps.length - 1) setCurrent(current + 1)
  }

  const doneCount = Object.values(completed).filter(Boolean).length
  const step = allSteps[current]
  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <span className="text-xs" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
          {doneCount} / {allSteps.length} complete
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>🚀 Setup Guide</h1>
        <p className="text-xs mb-5" style={dimStyle}>Follow these steps to get fully set up. Tap each step when done.</p>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full mb-5" style={{ background: 'rgba(198,139,58,0.15)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${(doneCount/allSteps.length)*100}%`, background: '#C68B3A' }} />
        </div>

        {/* Step pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {allSteps.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)}
              className="flex-shrink-0 w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center"
              style={{
                background: completed[s.id] ? 'rgba(112,192,112,0.3)' : i === current ? '#C68B3A' : 'rgba(198,139,58,0.15)',
                color: completed[s.id] ? '#70c070' : i === current ? '#3D1C02' : 'rgba(245,240,232,0.4)',
                border: i === current ? 'none' : '1px solid rgba(198,139,58,0.2)',
              }}>
              {completed[s.id] ? '✓' : i + 1}
            </button>
          ))}
        </div>

        {/* Current step card */}
        <div className="panel p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl">{step.icon}</span>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{step.title}</h2>
              <p className="text-sm mt-1" style={dimStyle}>{step.desc}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {step.details.map((d, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', minWidth: '20px' }}>{i + 1}</span>
                <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', lineHeight: '1.5' }}>{d}</p>
              </div>
            ))}
          </div>

          {step.tip && (
            <div className="px-3 py-2 rounded-lg mb-4" style={{ background: 'rgba(198,139,58,0.08)', border: '1px solid rgba(198,139,58,0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(198,139,58,0.8)', fontFamily: 'Georgia, serif' }}>
                💡 <strong>Tip:</strong> {step.tip}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {step.action && (
              <Link href={step.action.href}
                className="flex-1 py-3 rounded-xl text-sm text-center font-bold"
                style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                {step.action.label} →
              </Link>
            )}
            <button onClick={() => markDone(step.id)}
              className={`${step.action ? '' : 'w-full'} flex-1 py-3 rounded-xl text-sm font-bold`}
              style={{
                background: completed[step.id] ? 'rgba(112,192,112,0.2)' : '#C68B3A',
                color: completed[step.id] ? '#70c070' : '#3D1C02',
                border: completed[step.id] ? '1px solid rgba(112,192,112,0.3)' : 'none',
                fontFamily: 'Georgia, serif',
              }}>
              {completed[step.id] ? '✓ Done' : '✅ Mark Complete'}
            </button>
          </div>
        </div>

        {/* All steps list */}
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>All Steps</p>
          {allSteps.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)}
              className="w-full flex items-center gap-3 py-2.5 text-left"
              style={{ borderBottom: i < allSteps.length - 1 ? '1px solid rgba(198,139,58,0.1)' : 'none' }}>
              <span className="text-lg flex-shrink-0">{completed[s.id] ? '✅' : s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: completed[s.id] ? 'rgba(245,240,232,0.4)' : '#F5F0E8', fontFamily: 'Georgia, serif', textDecoration: completed[s.id] ? 'line-through' : 'none' }}>
                  {s.title}
                </p>
              </div>
              {i === current && <span className="text-xs" style={{ color: '#C68B3A' }}>← here</span>}
            </button>
          ))}
        </div>

        {doneCount === allSteps.length && (
          <div className="mt-4 panel p-5 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-base font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>You're all set!</p>
            <p className="text-sm mb-4" style={dimStyle}>Boat Buddy is fully configured and ready to use.</p>
            <Link href="/" className="btn-primary inline-block px-6 py-3" style={{ textDecoration: 'none' }}>
              Go to AI Chat →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
