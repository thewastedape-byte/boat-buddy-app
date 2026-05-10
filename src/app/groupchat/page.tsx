'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

interface ChatMessage {
  id: string
  team_id: string
  author_email: string
  author_name?: string
  content: string
  created_at: string
}

// Admin emails all share the same team so they can chat with each other
const ADMIN_EMAILS = ['thewastedape@gmail.com', 'howirolloldschool@gmail.com', 'benjamin.green7@gmail.com']

function getTeamId(email: string): string {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return 'wastedape-team'
  // Use domain as team ID for other users
  return email.split('@')[1] || email
}

export default function GroupChatPage() {
  const router = useRouter()
  const auth = getAuth()
  const teamId = getTeamId(auth?.email || '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(true)
  const [lastFetch, setLastFetch] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    fetchMessages()
    // Poll every 10 seconds
    pollRef.current = setInterval(fetchMessages, 10000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const r = await fetch(`${API_URL}/api/messages?team_id=${encodeURIComponent(teamId)}&limit=100`)
      if (r.ok) {
        const data = await r.json()
        setMessages(data)
        setOnline(true)
        setLastFetch(Date.now())
      } else {
        // Fall back to localStorage if backend unavailable
        loadLocal()
      }
    } catch {
      setOnline(false)
      loadLocal()
    }
  }

  const loadLocal = () => {
    const raw = localStorage.getItem(`bb_groupchat_${teamId}`)
    if (raw) setMessages(JSON.parse(raw))
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)

    const optimistic: ChatMessage = {
      id: 'temp-' + Date.now(),
      team_id: teamId,
      author_email: auth?.email || '',
      author_name: auth?.name || auth?.email?.split('@')[0] || 'Tech',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')

    try {
      const r = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          author_email: auth?.email || '',
          author_name: auth?.name || auth?.email?.split('@')[0] || 'Tech',
          content: text,
        })
      })
      if (r.ok) {
        const saved = await r.json()
        // Replace optimistic with saved
        setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
        // Also cache locally
        const all = messages.filter(m => m.id !== optimistic.id)
        localStorage.setItem(`bb_groupchat_${teamId}`, JSON.stringify([...all, saved].slice(-200)))
      }
    } catch {
      // Keep optimistic message, save to local
      const all = [...messages.filter(m => !m.id.startsWith('temp-')), optimistic]
      localStorage.setItem(`bb_groupchat_${teamId}`, JSON.stringify(all.slice(-200)))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getInitials = (email: string, name?: string) => {
    if (name && name !== email.split('@')[0]) return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: online ? '#70c070' : '#e87070' }} />
          <span className="text-xs" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Team Chat {online ? '· Live' : '· Offline'}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-32" style={{ background: 'rgba(8,3,1,0.55)' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-64 text-center py-12">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Team Group Chat</h2>
            <p className="text-sm max-w-xs" style={dimStyle}>Messages are shared across your whole team in real time. Send the first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => {
              const isMe = msg.author_email === auth?.email
              const prevMsg = messages[i - 1]
              const showHeader = i === 0 || prevMsg.author_email !== msg.author_email
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && showHeader ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1"
                      style={{ background: 'rgba(198,139,58,0.25)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)' }}>
                      {getInitials(msg.author_email, msg.author_name)}
                    </div>
                  ) : !isMe ? <div className="w-8 flex-shrink-0" /> : null}

                  <div className={`max-w-xs flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showHeader && !isMe && (
                      <p className="text-xs mb-1 px-1" style={dimStyle}>
                        {msg.author_name || msg.author_email.split('@')[0]}
                      </p>
                    )}
                    <div className="px-3 py-2 text-sm leading-relaxed"
                      style={{
                        background: isMe ? '#C68B3A' : 'rgba(10,4,1,0.92)',
                        color: '#FFFFFF',
                        border: isMe ? 'none' : '1px solid rgba(198,139,58,0.3)',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        opacity: msg.id.startsWith('temp-') ? 0.7 : 1,
                        fontWeight: '600',
                        textShadow: isMe ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
                      }}>
                      {msg.content}
                    </div>
                    <p className="text-xs mt-0.5 px-1" style={dimStyle}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 px-3 pb-2 z-40"
        style={{ background: 'rgba(20,8,2,0.97)', borderTop: '1px solid rgba(198,139,58,0.3)', paddingTop: '8px' }}>
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 input-field resize-none"
            placeholder="Message your team..."
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ minHeight: '40px', maxHeight: '100px', paddingTop: '10px', paddingBottom: '10px' }}
          />
          <button onClick={sendMessage} disabled={sending || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: (sending || !input.trim()) ? 'rgba(198,139,58,0.15)' : '#C68B3A',
              color: (sending || !input.trim()) ? 'rgba(198,139,58,0.3)' : '#3D1C02',
              border: '1px solid rgba(198,139,58,0.3)',
            }}>
            {sending ? '…' : '➤'}
          </button>
        </div>
      </div>
      <NavBar />
    </div>
  )
}
