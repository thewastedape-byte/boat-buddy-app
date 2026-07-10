'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

interface HistoryItem {
  sid: string
  title: string
  time: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    loadHistory()
  }, [router])

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(userKey('chat_history_index'))
      if (raw) setHistory(JSON.parse(raw))
    } catch { /* ignore */ }
  }

  const deleteSession = (sid: string) => {
    const updated = history.filter(h => h.sid !== sid)
    setHistory(updated)
    localStorage.setItem(userKey('chat_history_index'), JSON.stringify(updated))
    localStorage.removeItem(userKey('chat_' + sid))
  }

  const clearAll = () => {
    if (!confirm('Clear all chat history?')) return
    history.forEach(h => localStorage.removeItem(userKey('chat_' + h.sid)))
    localStorage.removeItem(userKey('chat_history_index'))
    setHistory([])
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago'
    return d.toLocaleDateString()
  }

  const openSession = (sid: string) => {
    localStorage.setItem(userKey('boat_buddy_session_id'), sid)
    router.push('/')
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        {history.length > 0 && (
          <button onClick={clearAll} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(139,26,26,0.3)', color: '#F5F0E8', border: '1px solid rgba(139,26,26,0.5)', fontFamily: 'Georgia, serif' }}>
            Clear All
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
          📋 Chat History
        </h1>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌊</div>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
              No chat history yet.
            </p>
            <Link href="/" className="btn-primary inline-block mt-4">
              Start a Chat
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(item => (
              <div key={item.sid} className="panel p-4 flex items-center gap-3">
                <button onClick={() => openSession(item.sid)} className="flex-1 text-left">
                  <p className="text-sm font-medium mb-1 line-clamp-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif' }}>
                    {formatDate(item.time)}
                  </p>
                </button>
                <button onClick={() => deleteSession(item.sid)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(139,26,26,0.3)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(139,26,26,0.4)' }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <NavBar />
    </div>
  )
}
