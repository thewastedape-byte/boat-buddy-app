'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'
import { getAuth } from '@/lib/auth'
import HelpChatModal from '@/components/HelpChatModal'

// ─── Section card types ────────────────────────────────────────────────────
interface HelpItem {
  icon: string
  title: string
  desc: string
  tip?: string
}

// ─── ALL TIERS ─────────────────────────────────────────────────────────────

const aiChatItems: HelpItem[] = [
  {
    icon: '⚓',
    title: 'Ask a Question',
    desc: 'Type any marine problem in plain English. Describe symptoms, noises, smells, error codes — anything. The AI responds like an expert mechanic standing right next to you.',
    tip: '"My engine is overheating at 2,000 RPM and I hear a squealing noise from the belt area."',
  },
  {
    icon: '📷',
    title: 'Send a Photo',
    desc: 'Tap the camera icon to attach a photo of your engine, wiring, bilge, or any component. The AI identifies the engine make/model and any visible problems from the image.',
    tip: 'Works great for identifying unknown parts, leaks, corrosion, wiring issues, and more.',
  },
  {
    icon: '📖',
    title: 'Manual Mode',
    desc: 'Tap the 📖 icon in the chat bar to enter Manual Mode. Ask for exact torque specs, part numbers, valve clearances, or service procedures — the AI searches real manufacturer service manual PDFs.',
    tip: '"What is the torque spec for the cylinder head bolts on a Yamaha 90A outboard?"',
  },
  {
    icon: '📐',
    title: 'System Diagrams',
    desc: 'Tap 📐 in the chat header or go to the Diagrams page. 25+ professional marine schematics are available — raw water cooling, fuel systems, electrical, steering, and more. Type "show me the cooling diagram" in chat and it appears inline.',
    tip: 'Tap any diagram thumbnail to open the full-size version.',
  },
  {
    icon: '🔔',
    title: 'Question Limits',
    desc: 'Stow Away (free) plan: 1 question per 6 hours. Your remaining questions are shown in the chat header. Upgrade to First Mate, Captain, or Admiral for unlimited AI questions.',
    tip: 'First Mate unlocks unlimited questions + manual search + work orders.',
  },
]

const vesselItems: HelpItem[] = [
  {
    icon: '🚢',
    title: 'Add Your Vessel',
    desc: "Go to Vessel in the bottom nav. Add make, model, year, engine make/model/serial, home port, and document number. The AI uses this context to give you more accurate, specific answers for your exact boat.",
    tip: 'Multiple vessels supported — switch between them in the vessel list.',
  },
  {
    icon: '🛡️',
    title: 'Insurance Tracking',
    desc: 'Add your insurance company, policy number, and expiry date. Upload your insurance document (PDF or image). A warning badge appears on the vessel card when expiry is within 30 days.',
    tip: 'The app will remind you before your policy lapses.',
  },
]

const maintItems: HelpItem[] = [
  {
    icon: '🔔',
    title: 'Service Reminders',
    desc: 'Track 12 preset service items per vessel: oil/filter, raw water impeller, fuel filter, zincs, belts, spark plugs, coolant, bottom paint, fire extinguisher, life jackets, EPIRB, and transmission fluid. Add custom items for anything else.',
    tip: 'A red dot on the Maint nav icon means something is overdue. Tap any item → Mark Done to log today\'s date and engine hours.',
  },
]

const repairLogItems: HelpItem[] = [
  {
    icon: '📋',
    title: 'Save AI Responses',
    desc: 'After any AI response, tap 🗒️ Save to Log. Browse all saved diagnoses in the History / Log page.',
    tip: 'Build a full maintenance history for each vessel over time.',
  },
  {
    icon: '📄',
    title: 'Create a Work Order',
    desc: 'Tap any log entry → Create Work Order. Auto-fills your vessel info, shop name, logo, and address. Add parts with costs and labor hours. Print or save as PDF.',
    tip: 'Set your shop name and logo in Settings → Business Profile first.',
  },
]

const settingsItems: HelpItem[] = [
  {
    icon: '⚙️',
    title: 'Business Profile',
    desc: 'Go to Settings → Business Profile. Set your shop name, phone, address, and logo — these auto-fill every work order and invoice you generate.',
    tip: 'Upload your logo (PNG or JPG, max 500KB) — it appears at the top of every work order.',
  },
  {
    icon: '✉️',
    title: 'Email Invoices',
    desc: 'Set up a Gmail app password in Settings to send invoices directly from the app to customers.',
    tip: 'Use a Gmail-specific app password — not your regular Google password.',
  },
]

// ─── CAPTAIN + ADMIRAL ─────────────────────────────────────────────────────

const boatYardItems: HelpItem[] = [
  {
    icon: '🏗️',
    title: 'Grid View',
    desc: 'Configure your yard size (up to 20×20 grid). Each spot shows vessel name, owner, and status: Available (green), Occupied (blue), Reserved (purple). Tap any spot to view or edit. Tap an empty spot to add a boat.',
    tip: 'Drag spots to rearrange. Resize rows/cols to match your actual yard layout.',
  },
  {
    icon: '🛰️',
    title: 'Satellite View',
    desc: 'Drop pins on the actual Google Maps aerial of your yard. Each pin has vessel name, owner, and notes. Switch between Grid and Satellite with the toggle in the Boat Yard header.',
    tip: 'Satellite mode is great for irregular-shaped yards or outdoor storage lots.',
  },
]

const partsItems: HelpItem[] = [
  {
    icon: '📦',
    title: 'Add Parts',
    desc: 'Add parts with name, part number, barcode, price, supplier, storage location, qty in stock, and minimum qty. Tap Scan → use your phone camera or a Bluetooth/USB barcode scanner.',
    tip: 'Pulling a part on a work order auto-deducts from stock. Low stock alerts fire when qty falls below minimum.',
  },
]

const serviceItems: HelpItem[] = [
  {
    icon: '🔧',
    title: 'Job Board',
    desc: 'Jobs flow through four statuses: Open → In Progress → Complete → Invoiced. Link jobs to customers, vessels, and repair log entries. Filter by status. Tap any job to update or create a work order.',
    tip: 'Start a diagnosis in AI chat → save to log → track it in Service.',
  },
]

const customerItems: HelpItem[] = [
  {
    icon: '👥',
    title: 'Customer Database',
    desc: 'In Settings → Team Tools → Customers. Store name, email, phone, address, and notes. Search by any field to quickly find a returning customer.',
    tip: 'Customers auto-fill when creating work orders and transient bookings.',
  },
]

const teamItems: HelpItem[] = [
  {
    icon: '👥',
    title: 'Team Chat',
    desc: 'Tap the 👥 Team icon in the bottom nav to open Team Chat. Real-time messaging for your whole crew.',
    tip: 'Post job updates, parts requests, or quick questions to the crew.',
  },
  {
    icon: '👤',
    title: 'Team Management',
    desc: 'Invite technicians by email, assign roles (Member or Admin), and track seat usage. Go to Settings → Team Tools → Team Management.',
    tip: 'Captain plan: up to 5 seats. Admiral plan: up to 10 seats.',
  },
  {
    icon: '🔗',
    title: 'Zapier Integrations',
    desc: 'Connect Boat Buddy to QuickBooks, Google Sheets, Slack, and 6,000+ other apps via Zapier. Go to Settings → Team Tools → Integrations.',
    tip: 'Trigger a QuickBooks invoice automatically when a job is marked Invoiced.',
  },
]

// ─── ADMIRAL ONLY ──────────────────────────────────────────────────────────

const marinaSlipsItems: HelpItem[] = [
  {
    icon: '🟢',
    title: 'Slip Grid — Colors',
    desc: 'Your dock grid is color-coded: 🟢 Green = Open, 🔵 Blue = Rented, 🟣 Purple = Reserved (upcoming transient), ⚫ Grey = Maintenance. Use the search box to find any slip by name instantly.',
    tip: 'Docks sort alphabetically (A, B, C…). Slips within each dock sort numerically (A1, A2…A10).',
  },
  {
    icon: '⚓',
    title: 'Slip Details',
    desc: 'Tap any slip → view details: vessel name, owner/contact, phone, address, card on file, and amenities. Tap an empty slip to assign a boat.',
    tip: 'Upcoming and active transient bookings automatically show as Purple/Reserved on the grid.',
  },
  {
    icon: '➕',
    title: 'Add Slips & Docks',
    desc: 'Tap + Slip inside a dock section to add a new slip. Set name/number, max LOA, beam, and amenities (30A/50A/water/pumpout/liveaboard). Tap + New Dock to add a dock — name it A, B, North Dock, etc.',
    tip: 'Dock sections are collapsible — tap the dock header (▼/▶) to expand/collapse.',
  },
  {
    icon: '⚙️',
    title: 'Manage Ungrouped Slips',
    desc: 'Tap the ⚙️ Manage button on ungrouped sections to move all slips into a named dock, or delete all ungrouped slips at once.',
    tip: 'Stats bar at the top always shows: Total | Rented | Reserved | Open | Maintenance.',
  },
]

const marinaRentalsItems: HelpItem[] = [
  {
    icon: '📅',
    title: 'Long-Term Tenants',
    desc: 'Add long-term slip tenants with vessel name, owner, phone, email, address, and card on file. Set lease type (Monthly / Seasonal / Annual), start/end date, monthly rate, and auto-renew.',
    tip: 'Tap Mark Paid to log each payment and maintain a full payment history.',
  },
]

const marinaTransientItems: HelpItem[] = [
  {
    icon: '⛵',
    title: 'Transient Bookings',
    desc: 'Add short-term guest dockage with vessel name, captain name, phone, address, card on file, and check-in/check-out dates. Set nightly rate, power type (none/30A/50A/double 30A), LOA, beam, and water at slip.',
    tip: 'Add discount cards: BoatUS / SeaTow / TowBoatUS. Status flows: Upcoming → Active → Checked Out.',
  },
]

const marinaWaitlistItems: HelpItem[] = [
  {
    icon: '📋',
    title: 'Slip Waitlist',
    desc: 'Queue boats waiting for a slip. Track vessel name, captain, phone, email, slip length needed, and date added.',
    tip: 'Tap Notify when you\'ve reached out to a waitlist entry.',
  },
]

// ─── Section renderer ───────────────────────────────────────────────────────

function Section({ title, items, color = '#C68B3A' }: { title: string; items: HelpItem[]; color?: string }) {
  const dimStyle = { color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }
  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-wider mb-3" style={{ color, fontFamily: 'Georgia, serif', letterSpacing: '0.08em' }}>
        {title}
      </p>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="panel p-4" style={{ borderColor: `${color}25` }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{item.title}</p>
                <p className="text-xs mb-2 leading-relaxed" style={dimStyle}>{item.desc}</p>
                {item.tip && (
                  <p className="text-xs italic px-2 py-1 rounded" style={{
                    background: 'rgba(198,139,58,0.08)',
                    color: 'rgba(198,139,58,0.75)',
                    fontFamily: 'Georgia, serif',
                    borderLeft: `2px solid ${color}50`
                  }}>
                    {item.tip}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UpgradeCTA({ tier, fromTier }: { tier: string; fromTier: string }) {
  return (
    <div className="mt-5 panel p-4" style={{ background: 'rgba(198,139,58,0.05)', border: '1px solid rgba(198,139,58,0.2)' }}>
      <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{tier} Features — Locked</p>
      <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
        Upgrade to {fromTier} to unlock these features.
      </p>
      <Link href="/upgrade" className="btn-primary inline-block px-5 py-2 text-sm" style={{ textDecoration: 'none' }}>
        View Plans →
      </Link>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [sub, setSub] = useState('stow_away')
  const [helpChatOpen, setHelpChatOpen] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    setSub(auth?.subscription || 'stow_away')
    // Expose global opener for floating button
    if (typeof window !== 'undefined') {
      (window as Window & { __openHelpChat?: () => void }).__openHelpChat = () => setHelpChatOpen(true)
    }
  }, [])

  const isCaptainPlus = sub === 'captain' || sub === 'admiral'
  const isAdmiral = sub === 'admiral'

  const tierLabel =
    sub === 'admiral' ? 'Admiral ⚓' :
    sub === 'captain' ? 'Captain 🔱' :
    sub === 'first_mate' ? 'First Mate ⚓' :
    'Stow Away 🌊'

  const tierColor =
    sub === 'admiral' ? '#C68B3A' :
    sub === 'captain' ? '#7aafd4' :
    sub === 'first_mate' ? '#4A9E6B' :
    '#888'

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      {helpChatOpen && <HelpChatModal open={helpChatOpen} onClose={() => setHelpChatOpen(false)} />}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHelpChatOpen(true)}
            title="Help Chat"
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}
          >
            💬
          </button>
          <span className="text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: 'rgba(198,139,58,0.15)', color: tierColor, border: `1px solid ${tierColor}40`, fontFamily: 'Georgia, serif' }}>
            {tierLabel}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>❓ Help Guide</h1>
        <p className="text-xs mb-2" style={{ color: 'rgba(245,240,232,0.82)', fontFamily: 'Georgia, serif' }}>
          Your complete guide to Boat Buddy — tap any section to learn how it works.
        </p>

        {/* ── ALL TIERS ── */}
        <Section title="AI Diagnostic Chat — All Plans" items={aiChatItems} />
        <Section title="Vessel Profile — All Plans" items={vesselItems} />
        <Section title="Maintenance Tracker — All Plans" items={maintItems} />
        <Section title="Repair Log & Work Orders — All Plans" items={repairLogItems} />
        <Section title="Settings & Business Profile — All Plans" items={settingsItems} />

        {/* ── CAPTAIN + ADMIRAL ── */}
        {isCaptainPlus ? (
          <>
            <Section title="Boat Yard — Captain & Admiral" items={boatYardItems} color={tierColor} />
            <Section title="Parts Inventory — Captain & Admiral" items={partsItems} color={tierColor} />
            <Section title="Service Department — Captain & Admiral" items={serviceItems} color={tierColor} />
            <Section title="Customer Database — Captain & Admiral" items={customerItems} color={tierColor} />
            <Section title="Team Features — Captain & Admiral" items={teamItems} color={tierColor} />
          </>
        ) : (
          <UpgradeCTA tier="Boat Yard, Parts Inventory, Service Department & Team Features" fromTier="Captain or Admiral" />
        )}

        {/* ── ADMIRAL ONLY ── */}
        {isAdmiral ? (
          <>
            <div className="mt-5 p-3 rounded-xl" style={{ background: 'rgba(198,139,58,0.08)', border: '1px solid rgba(198,139,58,0.25)' }}>
              <p className="text-sm font-bold mb-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>⛵ Marina Manager — Admiral Only</p>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
                Full marina management suite. Tap Marina ⛵ in the bottom nav to get started.
              </p>
            </div>
            <Section title="Slips" items={marinaSlipsItems} color="#C68B3A" />
            <Section title="Rentals — Long-Term Tenants" items={marinaRentalsItems} color="#C68B3A" />
            <Section title="Transient Bookings" items={marinaTransientItems} color="#C68B3A" />
            <Section title="Waitlist" items={marinaWaitlistItems} color="#C68B3A" />
          </>
        ) : (
          <UpgradeCTA tier="Marina Manager (slips, rentals, transients, waitlist)" fromTier="Admiral" />
        )}

        {/* Quick Links */}
        <div className="mt-5 panel p-4">
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Quick Links</p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/', label: '💬 AI Diagnostic Chat' },
              { href: '/diagrams', label: '📐 Browse All Diagrams' },
              { href: '/vessel', label: '⚓ Vessel Profile' },
              { href: '/log', label: '📋 Repair Log & History' },
              { href: '/workorder', label: '📄 New Work Order' },
              { href: '/maintenance', label: '🔔 Maintenance Tracker' },
              ...(isCaptainPlus ? [
                { href: '/service', label: '🔧 Service Department' },
                { href: '/inventory', label: '📦 Parts Inventory' },
                { href: '/yard', label: '🏗️ Boat Yard' },
                { href: '/team', label: '👥 Team Management' },
                { href: '/integrations', label: '🔗 Integrations' },
              ] : []),
              ...(isAdmiral ? [
                { href: '/marina', label: '⛵ Marina Manager' },
              ] : []),
              { href: '/upgrade', label: '⭐ View Plans' },
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

      {/* Floating "Ask a Question" button */}
      <button
        onClick={() => setHelpChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          zIndex: 50,
          background: '#C68B3A',
          color: '#1a0a02',
          border: 'none',
          borderRadius: 28,
          padding: '12px 20px',
          fontFamily: 'Georgia, serif',
          fontWeight: 'bold',
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(198,139,58,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        💬 Ask a Question
      </button>

      <NavBar />
    </div>
  )
}
