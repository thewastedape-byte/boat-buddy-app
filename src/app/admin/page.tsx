'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
const ADMIN_EMAILS = ['thewastedape@gmail.com', 'howirolloldschool@gmail.com']

interface Analytics {
  totals: Record<string, number>
  today: Record<string, number>
  byDay: Record<string, Record<string, number>>
  inMemory: any
  lastUpdated?: string
}

export default function AdminPage() {
  const router = useRouter()
  const auth = getAuth()
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState('')

  useEffect(() => {
    if (!auth?.email || !ADMIN_EMAILS.includes(auth.email.toLowerCase())) {
      router.replace('/')
      return
    }
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/analytics`)
      if (r.ok) setData(await r.json())
      setLastCheck(new Date().toLocaleTimeString())
    } catch {} finally { setLoading(false) }
  }

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

  const mem = data?.inMemory
  const db = data?.totals

  const stat = (label: string, value: any, sub?: string) => (
    <div className="panel p-4 text-center">
      <p className="text-2xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{value ?? '—'}</p>
      <p className="text-xs" style={labelStyle}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={dimStyle}>{sub}</p>}
    </div>
  )

  // Last 7 days
  const last7 = data?.byDay ? Object.entries(data.byDay).sort((a,b) => b[0].localeCompare(a[0])).slice(0,7) : []

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <span className="text-xs" style={dimStyle}>{lastCheck}</span>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
            🔄 Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>📊 Analytics</h1>
        <p className="text-xs mb-5" style={dimStyle}>Boat Buddy by WastedApe — live stats</p>

        {loading ? <p className="text-center py-8" style={dimStyle}>Loading...</p> : (
          <>
            {/* Today */}
            <p className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Today</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {stat('Requests', (data?.today?.total_request || 0) + (mem?.todayRequests || 0))}
              {stat('Chats', (data?.today?.chat_request || 0) + (mem?.chatRequests || 0))}
              {stat('Photos', (data?.today?.photo_analysis || 0) + (mem?.photoAnalysis || 0))}
              {stat('Manual Search', (data?.today?.manual_search || 0) + (mem?.manualSearch || 0))}
            </div>

            {/* All time */}
            <p className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>All Time (DB)</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {stat('Total Requests', db?.total_request || 0)}
              {stat('Chats', db?.chat_request || 0)}
              {stat('Photos', db?.photo_analysis || 0)}
              {stat('Signups', db?.signup || 0)}
              {stat('Page Views', db?.pageview || 0)}
            </div>

            {/* In-memory (since last restart) */}
            {mem && (
              <>
                <p className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Since Last Restart</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {stat('Requests', mem.totalRequests, `Uptime: ${mem.uptime || '—'}`)}
                  {stat('Sessions', mem.uniqueSessions)}
                </div>
              </>
            )}

            {/* Last 7 days */}
            {last7.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Last 7 Days</p>
                <div className="panel p-4 mb-5">
                  {last7.map(([date, counts]) => (
                    <div key={date} className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
                      <p className="text-xs font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{date}</p>
                      <div className="flex gap-3">
                        <p className="text-xs" style={dimStyle}>{counts.total_request || 0} req</p>
                        <p className="text-xs" style={dimStyle}>{counts.chat_request || 0} chats</p>
                        {(counts.signup || 0) > 0 && <p className="text-xs font-bold" style={{ color: '#70c070' }}>{counts.signup} signups</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Revenue */}
            <p className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Revenue</p>
            <div className="panel p-4">
              <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>$0.00 MRR</p>
              <p className="text-xs mt-1" style={dimStyle}>0 active subscriptions</p>
              <p className="text-xs mt-3" style={dimStyle}>
                Check <a href="https://dashboard.stripe.com" target="_blank" style={{ color: '#C68B3A' }}>Stripe dashboard →</a> for live revenue data
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
