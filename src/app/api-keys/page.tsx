'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

interface ConnectedApp {
  id: string
  name: string
  icon: string
  desc: string
  connected: boolean
  connectedAt?: string
  action?: () => void
  disconnectAction?: () => void
}

export default function ApiKeysPage() {
  const router = useRouter()
  const auth = getAuth()
  const [qbConnected, setQbConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const email = auth?.email || ''
    fetch(`${API_URL}/api/qb/status?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { setQbConnected(d.connected); setLoading(false) })
      .catch(() => setLoading(false))
    window.addEventListener('message', (e) => { if (e.data === 'qb_connected') setQbConnected(true) })
  }, [router])

  const connectQB = () => {
    const email = auth?.email || ''
    window.open(`${API_URL}/api/qb/connect?user_email=${encodeURIComponent(email)}`, 'qb_auth', 'width=600,height=700,left=200,top=100')
  }

  const disconnectQB = async () => {
    if (!confirm('Disconnect QuickBooks?')) return
    await fetch(`${API_URL}/api/qb/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: auth?.email }) }).catch(() => {})
    setQbConnected(false)
  }

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }

  const apps = [
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      icon: '📒',
      desc: 'Automatically push invoices and customer data to QuickBooks when jobs are marked Invoiced.',
      connected: qbConnected,
      connect: connectQB,
      disconnect: disconnectQB,
      comingSoon: false,
    },
    {
      id: 'zapier',
      name: 'Zapier',
      icon: '⚡',
      desc: 'Connect to 6,000+ apps including Google Sheets, Slack, email, and more via webhooks.',
      connected: false,
      href: '/integrations',
      comingSoon: false,
    },
    {
      id: 'piervantage',
      name: 'PierVantage',
      icon: '⚓',
      desc: 'Sync jobs and customers directly with PierVantage marina management software.',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'dockmaster',
      name: 'Dockmaster',
      icon: '🚢',
      desc: 'Push work orders directly into Dockmaster marina management.',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      icon: '📊',
      desc: 'Sync your repair log and job history to a Google Sheet automatically.',
      connected: false,
      comingSoon: true,
    },
  ]

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
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>🔑 Connected Apps</h1>
        <p className="text-xs mb-5" style={dimStyle}>Manage your integrations and connected software</p>

        <div className="flex flex-col gap-3">
          {apps.map(app => (
            <div key={app.id} className="panel p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{app.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{app.name}</p>
                    {app.comingSoon && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(198,139,58,0.15)', color: 'rgba(198,139,58,0.6)', border: '1px solid rgba(198,139,58,0.2)', fontFamily: 'Georgia, serif' }}>
                        Coming Soon
                      </span>
                    )}
                    {!app.comingSoon && app.connected && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(112,192,112,0.2)', color: '#70c070', border: '1px solid rgba(112,192,112,0.3)' }}>
                        ✓ Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-3" style={dimStyle}>{app.desc}</p>

                  {!app.comingSoon && (
                    <div className="flex gap-2">
                      {app.href ? (
                        <Link href={app.href}
                          className="text-xs px-3 py-1.5 rounded-lg font-bold"
                          style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                          Configure →
                        </Link>
                      ) : app.connected ? (
                        <button onClick={app.disconnect}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                          Disconnect
                        </button>
                      ) : (
                        <button onClick={app.connect}
                          className="text-xs px-3 py-1.5 rounded-lg font-bold"
                          style={{ background: '#C68B3A', color: '#3D1C02', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                          🔗 Connect
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data export */}
        <div className="panel p-4 mt-4">
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Data Export</p>
          <p className="text-xs mb-3" style={dimStyle}>Download your data as CSV files for use in any software.</p>
          <Link href="/integrations"
            className="text-sm px-4 py-2 rounded-lg font-bold inline-block"
            style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
            📊 Export Data →
          </Link>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
