'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import { exportJobs, exportCustomers, exportParts, exportRepairLog } from '@/lib/csvExport'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

interface Webhook {
  id?: string
  url: string
  event: string
  active: boolean
  created_at?: string
}

const EVENTS = [
  { key: 'job.created', label: 'New Job Created', desc: 'Fires when a new repair job is added' },
  { key: 'job.completed', label: 'Job Completed', desc: 'Fires when a job status changes to Complete' },
  { key: 'invoice.created', label: 'Invoice Created', desc: 'Fires when a job is marked Invoiced' },
  { key: 'job.updated', label: 'Job Updated', desc: 'Fires on any job status change' },
]

export default function IntegrationsPage() {
  const router = useRouter()
  const auth = getAuth()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [qbConnected, setQbConnected] = useState(false)
  const [qbChecked, setQbChecked] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [url, setUrl] = useState('')
  const [event, setEvent] = useState('job.completed')
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    loadWebhooks()
    // Check QB connection status
    const email = getAuth()?.email || ''
    fetch(`${API_URL}/api/qb/status?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { setQbConnected(d.connected); setQbChecked(true) })
      .catch(() => setQbChecked(true))
    // Listen for QB OAuth popup completing
    window.addEventListener('message', (e) => { if (e.data === 'qb_connected') setQbConnected(true) })
  }, [router])

  const loadWebhooks = async () => {
    try {
      const r = await fetch(`${API_URL}/api/db/webhooks?user_id=${encodeURIComponent(auth?.email || '')}`)
      if (r.ok) setWebhooks(await r.json())
    } catch {}
  }

  const addWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.startsWith('http')) { alert('Enter a valid URL'); return }
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/db/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, event, active: true, user_id: auth?.email })
      })
      if (r.ok) {
        const d = await r.json()
        setWebhooks(prev => [...prev, d])
        setUrl('')
        setShowForm(false)
      }
    } catch {} finally { setLoading(false) }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Remove this webhook?')) return
    try { await fetch(`${API_URL}/api/db/webhooks/${id}`, { method: 'DELETE' }) } catch {}
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  const testWebhook = async (wh: Webhook) => {
    if (!wh.id) return
    setTestResult(prev => ({ ...prev, [wh.id!]: 'Sending...' }))
    try {
      const r = await fetch(`${API_URL}/api/db/webhooks/${wh.id}/test`, { method: 'POST' })
      setTestResult(prev => ({ ...prev, [wh.id!]: r.ok ? '✓ Test sent' : '✗ Failed' }))
    } catch {
      setTestResult(prev => ({ ...prev, [wh.id!]: '✗ Error' }))
    }
    setTimeout(() => setTestResult(prev => { const n = {...prev}; delete n[wh.id!]; return n }), 3000)
  }

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/settings" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          ← Settings
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>🔗 Integrations</h1>
        <p className="text-xs mb-5" style={dimStyle}>Connect Boat Buddy to your other software via webhooks</p>

        {/* Zapier explainer */}
        <div className="panel p-4 mb-5" style={{ background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.3)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Connect with Zapier</p>
              <p className="text-xs mb-2" style={dimStyle}>Use Zapier to connect Boat Buddy to QuickBooks, Google Sheets, Slack, email, and 6,000+ other apps. No code needed.</p>
              <a href="https://zapier.com" target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg inline-block"
                style={{ background: 'rgba(255,100,0,0.3)', color: '#ff9966', border: '1px solid rgba(255,100,0,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                Open Zapier →
              </a>
            </div>
          </div>
        </div>

        {/* Events reference */}
        <div className="panel p-4 mb-5">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Available Events</h2>
          <div className="flex flex-col gap-2">
            {EVENTS.map(ev => (
              <div key={ev.key} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
                <code className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', fontFamily: 'monospace' }}>{ev.key}</code>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{ev.label}</p>
                  <p className="text-xs" style={dimStyle}>{ev.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registered webhooks */}
        <div className="panel p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider" style={labelStyle}>Registered Webhooks ({webhooks.length})</h2>
            <button onClick={() => setShowForm(!showForm)}
              className="text-xs px-3 py-1.5 rounded-lg font-bold"
              style={{ background: showForm ? 'rgba(139,26,26,0.3)' : '#C68B3A', color: showForm ? '#F5F0E8' : '#3D1C02', fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer' }}>
              {showForm ? '✕ Cancel' : '+ Add Webhook'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={addWebhook} className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(198,139,58,0.06)', border: '1px solid rgba(198,139,58,0.2)' }}>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={dimStyle}>Webhook URL (from Zapier or your server)</label>
                <input className="input-field" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..." />
              </div>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={dimStyle}>Trigger Event</label>
                <select value={event} onChange={e => setEvent(e.target.value)} className="input-field"
                  style={{ background: 'rgba(245,240,232,0.1)', color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                  {EVENTS.map(ev => <option key={ev.key} value={ev.key} style={{ background: '#1a0a02' }}>{ev.key} — {ev.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full" style={{ fontSize: '14px', padding: '10px' }}>
                {loading ? 'Saving...' : '💾 Save Webhook'}
              </button>
            </form>
          )}

          {webhooks.length === 0 && !showForm ? (
            <p className="text-xs py-2" style={dimStyle}>No webhooks registered yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {webhooks.map(wh => (
                <div key={wh.id} className="p-3 rounded-lg" style={{ background: 'rgba(198,139,58,0.05)', border: '1px solid rgba(198,139,58,0.15)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs" style={{ color: '#C68B3A', fontFamily: 'monospace', wordBreak: 'break-all' }}>{wh.url}</code>
                      <p className="text-xs mt-1" style={dimStyle}>Triggers on: <strong style={{ color: '#F5F0E8' }}>{wh.event}</strong></p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {wh.id && (
                        <button onClick={() => testWebhook(wh)}
                          style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                          {testResult[wh.id!] || 'Test'}
                        </button>
                      )}
                      {wh.id && (
                        <button onClick={() => deleteWebhook(wh.id!)}
                          style={{ background: 'rgba(139,26,26,0.15)', color: 'rgba(245,240,232,0.4)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QuickBooks */}
        <div className="panel p-4 mb-4" style={{ background: 'rgba(44,160,44,0.05)', border: '1px solid rgba(44,160,44,0.25)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📒</span>
            <div className="flex-1">
              <p className="text-sm font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>QuickBooks Online</p>
              <p className="text-xs mb-3" style={dimStyle}>Push invoices directly to QuickBooks when jobs are marked Invoiced.</p>
              {qbChecked && (
                qbConnected ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: 'rgba(112,192,112,0.2)', color: '#70c070', border: '1px solid rgba(112,192,112,0.3)' }}>✓ Connected</span>
                    <button onClick={async () => {
                      const email = getAuth()?.email || ''
                      await fetch(`${API_URL}/api/qb/disconnect`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ user_email: email }) })
                      setQbConnected(false)
                    }} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Disconnect</button>
                  </div>
                ) : (
                  <button onClick={() => {
                    const email = getAuth()?.email || ''
                    window.open(`${API_URL}/api/qb/connect?user_email=${encodeURIComponent(email)}`, 'qb_auth', 'width=600,height=700')
                  }}
                    className="text-xs px-4 py-2 rounded-lg font-bold"
                    style={{ background: 'rgba(44,160,44,0.25)', color: '#7fd47f', border: '1px solid rgba(44,160,44,0.4)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    🔗 Connect QuickBooks
                  </button>
                )
              )}
              <p className="text-xs mt-2" style={{ color: 'rgba(245,240,232,0.25)', fontFamily: 'Georgia, serif' }}>Requires QuickBooks Online account. Setup takes ~2 minutes.</p>
            </div>
          </div>
        </div>

        {/* CSV Export */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-1" style={labelStyle}>📊 Export Data (CSV)</h2>
          <p className="text-xs mb-4" style={dimStyle}>Download your data as a spreadsheet. Open in Excel, Google Sheets, or import into any software.</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '🔧 Repair Log', fn: () => {
                const raw = localStorage.getItem('boat_buddy_repair_log')
                exportRepairLog(raw ? JSON.parse(raw) : [])
              }},
              { label: '📦 Inventory', fn: async () => {
                const auth = getAuth()
                try {
                  const r = await fetch(`${API_URL}/api/db/parts?user_email=${encodeURIComponent(auth?.email||'')}`)
                  exportParts(r.ok ? await r.json() : [])
                } catch { exportParts([]) }
              }},
              { label: '👥 Customers', fn: async () => {
                const auth = getAuth()
                try {
                  const r = await fetch(`${API_URL}/api/db/customers?user_email=${encodeURIComponent(auth?.email||'')}`)
                  exportCustomers(r.ok ? await r.json() : [])
                } catch { exportCustomers([]) }
              }},
              { label: '🔩 Jobs', fn: async () => {
                const raw = localStorage.getItem('boat_buddy_repair_log')
                exportJobs(raw ? JSON.parse(raw) : [])
              }},
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(198,139,58,0.12)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.25)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="panel p-4" style={{ background: 'rgba(20,8,2,0.5)' }}>
          <p className="text-xs font-bold mb-2" style={labelStyle}>How to set up with Zapier</p>
          <ol className="flex flex-col gap-1.5">
            {[
              'Go to zapier.com and create a new Zap',
              'Choose "Webhooks by Zapier" as the trigger',
              'Select "Catch Hook" and copy the webhook URL',
              'Paste that URL above and select your trigger event',
              'In Zapier, choose your action app (QuickBooks, Slack, etc.)',
              'Test the connection — Boat Buddy will send a test payload',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={dimStyle}>
                <span className="flex-shrink-0 font-bold" style={{ color: '#C68B3A' }}>{i+1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
