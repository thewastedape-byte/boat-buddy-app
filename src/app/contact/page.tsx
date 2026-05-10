'use client'
import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !message) { setError('Name, email, and message are required.'); return }
    setLoading(true)
    try {
      // Send via backend email endpoint
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: subject || 'Boat Buddy Support Request', message })
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
    } catch {
      // Fallback: open mailto
      const mailto = `mailto:thewastedape@gmail.com?subject=${encodeURIComponent(subject || 'Boat Buddy Support')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`
      window.location.href = mailto
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/help" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          ← Help
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="max-w-sm mx-auto">
          <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>✉️ Contact Us</h1>
          <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
            Questions, bug reports, feature requests, or feedback — we read everything.
          </p>

          {sent ? (
            <div className="panel p-6 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-lg font-bold mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Message Sent!</p>
              <p className="text-sm mb-4" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
                We&apos;ll get back to you at {email} within 24 hours.
              </p>
              <Link href="/" className="btn-primary inline-block px-6 py-2 text-sm" style={{ textDecoration: 'none' }}>
                Back to Chat
              </Link>
            </div>
          ) : (
            <div className="panel p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Name *</label>
                  <input className="input-field" placeholder="Captain Dan" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Email *</label>
                  <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Subject</label>
                  <select className="input-field" value={subject} onChange={e => setSubject(e.target.value)}
                    style={{ background: 'rgba(245,240,232,0.1)', border: '1px solid rgba(198,139,58,0.5)', borderRadius: '8px', color: subject ? '#F5F0E8' : 'rgba(245,240,232,0.4)', padding: '12px 16px', fontFamily: 'Georgia, serif', fontSize: '16px', width: '100%' }}>
                    <option value="" style={{ background: '#1a0a02' }}>— Select a topic —</option>
                    <option value="Bug Report" style={{ background: '#1a0a02' }}>🐛 Bug Report</option>
                    <option value="Feature Request" style={{ background: '#1a0a02' }}>💡 Feature Request</option>
                    <option value="Billing / Subscription" style={{ background: '#1a0a02' }}>💳 Billing / Subscription</option>
                    <option value="Manual / Diagram Request" style={{ background: '#1a0a02' }}>📖 Manual / Diagram Request</option>
                    <option value="General Question" style={{ background: '#1a0a02' }}>💬 General Question</option>
                    <option value="Other" style={{ background: '#1a0a02' }}>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Message *</label>
                  <textarea className="input-field resize-none" rows={5}
                    placeholder="Describe your question or issue..."
                    value={message} onChange={e => setMessage(e.target.value)}
                    style={{ fontFamily: 'system-ui, sans-serif' }} />
                </div>
                {error && <p className="text-xs" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{error}</p>}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Sending...' : '✉️ Send Message'}
                </button>
              </form>
            </div>
          )}

          {/* Direct email fallback */}
          <div className="mt-5 text-center">
            <p className="text-xs mb-1" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Or email us directly:</p>
            <a href="mailto:thewastedape@gmail.com" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: '13px' }}>
              thewastedape@gmail.com
            </a>
          </div>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
