'use client'
import { useState, useRef, useEffect } from 'react'

interface Msg { role: 'user' | 'assistant'; text: string }

export default function HelpChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: "Hi! I'm your Boat Buddy guide. Ask me anything about how to use the app — finding features, adding a transient booking, setting up your marina, anything." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => 'help-' + Date.now())
  const bottomRef = useRef<HTMLDivElement>(null)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/help-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: sessionId })
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.answer || "Sorry, I couldn't get an answer. Try again." }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Connection error. Check your internet and try again.' }])
    }
    setLoading(false)
  }

  if (!open) return null

  const gold = '#C68B3A'
  const bg = 'rgba(20,8,2,0.98)'
  const panelBg = 'rgba(255,255,255,0.04)'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${gold}30`, background: bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: 16 }}>Help Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: gold, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? gold : panelBg,
              color: m.role === 'user' ? '#1a0a02' : '#F5F0E8',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              lineHeight: 1.5,
              border: m.role === 'assistant' ? `1px solid ${gold}20` : 'none',
              whiteSpace: 'pre-wrap'
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: panelBg, border: `1px solid ${gold}20`, color: gold, fontFamily: 'Georgia, serif', fontSize: 14 }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${gold}30`, background: bg, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask how to use Boat Buddy..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${gold}40`, borderRadius: 24,
            padding: '10px 16px', color: '#F5F0E8', fontFamily: 'Georgia, serif', fontSize: 14, outline: 'none'
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: gold, border: 'none', borderRadius: '50%', width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1, fontSize: 18, flexShrink: 0
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
