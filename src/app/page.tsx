'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, getAuth, hasAcceptedTerms, getOrCreateSessionId, newSession } from '@/lib/auth'
import { findDiagram } from '@/lib/diagrams'
import NavBar from '@/components/NavBar'
import TCModal from '@/components/TCModal'
import Logo from '@/components/Logo'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  diagramUrl?: string
  timestamp: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTC, setShowTC] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)
  const [subscription, setSubscription] = useState<string | undefined>(undefined)
  const [serviceAlert, setServiceAlert] = useState<string | null>(null)
  const [inlineDiagram, setInlineDiagram] = useState<{title: string, svgPath: string} | null>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const [manualMode, setManualMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    if (!hasAcceptedTerms()) {
      setShowTC(true)
    }
    const sid = getOrCreateSessionId()
    setSessionId(sid)
    loadHistory(sid)
    const rawAuth = getAuth()
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase())
  const isAdmin = rawAuth?.email && adminEmails.includes(rawAuth.email.toLowerCase())
  const auth = isAdmin ? { ...rawAuth, subscription: 'admiral' } : rawAuth // LIVE: admin gets Admiral tier
    setSubscription(auth?.subscription)
    // Check for service reminders
    try {
      const raw = localStorage.getItem('boat_buddy_repair_log')
      if (raw) {
        const log = JSON.parse(raw)
        const now = Date.now()
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        const due = log.filter((e: {nextServiceDate?: string}) => {
          if (!e.nextServiceDate) return false
          const dueTime = new Date(e.nextServiceDate).getTime()
          return dueTime <= now + sevenDays
        })
        if (due.length > 0) {
          const first = due[0]
          const dueDate = new Date(first.nextServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          setServiceAlert(`🔔 Service due ${dueDate}: ${first.nextServiceNote || 'Scheduled service'} — ${first.vessel}`)
        }
      }
    } catch {}
  }, [router])

  const loadHistory = (sid: string) => {
    try {
      const raw = localStorage.getItem('chat_' + sid)
      if (raw) setMessages(JSON.parse(raw))
    } catch { /* ignore */ }
  }

  const saveHistory = useCallback((msgs: Message[], sid: string) => {
    try {
      localStorage.setItem('chat_' + sid, JSON.stringify(msgs.slice(-100)))
      // Save to history index
      const histKey = 'chat_history_index'
      const raw = localStorage.getItem(histKey)
      const index: Array<{ sid: string; title: string; time: number }> = raw ? JSON.parse(raw) : []
      const existing = index.findIndex(i => i.sid === sid)
      const firstMsg = msgs.find(m => m.role === 'user')
      const title = firstMsg ? firstMsg.content.substring(0, 60) : 'Chat session'
      if (existing >= 0) {
        index[existing] = { sid, title, time: Date.now() }
      } else {
        index.unshift({ sid, title, time: Date.now() })
      }
      localStorage.setItem(histKey, JSON.stringify(index.slice(0, 50)))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Scroll to diagram when it appears
  useEffect(() => {
    if (inlineDiagram && diagramRef.current) {
      setTimeout(() => diagramRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [inlineDiagram])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text && !selectedFile) return

    // Free tier gate
    const rawAuth = getAuth()
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase())
  const isAdmin = rawAuth?.email && adminEmails.includes(rawAuth.email.toLowerCase())
  const auth = isAdmin ? { ...rawAuth, subscription: 'admiral' } : rawAuth // LIVE: admin gets Admiral tier
    const currentSubscription = auth?.subscription
    const isPaid = currentSubscription === 'first_mate' || currentSubscription === 'captain' || currentSubscription === 'admiral' || currentSubscription === 'team_member'
    if (!isPaid) {
      const lastFreeTime = parseInt(localStorage.getItem('last_free_time') || '0', 10)
      const sixHours = 6 * 60 * 60 * 1000
      if (lastFreeTime && Date.now() - lastFreeTime < sixHours) {
        setShowUpgradeBanner(true)
        return
      }
      // Allow this question, record time
      localStorage.setItem('last_free_time', Date.now().toString())
      const count = parseInt(localStorage.getItem('question_count') || '0', 10)
      localStorage.setItem('question_count', (count + 1).toString())
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || '📷 Image sent',
      imageUrl: selectedImage || undefined,
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSelectedImage(null)
    const fileToSend = selectedFile
    setSelectedFile(null)
    setLoading(true)

    try {
      let aiContent = ''

      // Check for diagram match — reset first, then set if found
      setInlineDiagram(null)
      const matchedDiagram = findDiagram(text)
      if (matchedDiagram) {
        setInlineDiagram({ title: matchedDiagram.title, svgPath: matchedDiagram.svgPath })
      }

      if (fileToSend) {
        // Image analysis — convert to base64 and send as JSON
        const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const base64 = await toBase64(fileToSend)
        const res = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text || 'Analyze this marine image and describe what you see.',
            base64_image: base64,
            mime_type: fileToSend.type || 'image/jpeg',
            session_id: sessionId
          }),
        })
        if (res.ok) {
          const data = await res.json()
          aiContent = data.answer || data.response || data.message || 'Analysis complete.'
        } else {
          aiContent = 'Sorry, I had trouble analyzing the image. Please try again.'
        }
      } else {
        // Text chat
        // Get vessel engine for context
        let vesselEngine = ''
        try {
          const vp = localStorage.getItem('boat_buddy_vessel')
          if (vp) {
            const v = JSON.parse(vp)
            vesselEngine = `${v.engineMake || ''} ${v.engineModel || ''}`.trim()
          }
        } catch {}

        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, session_id: sessionId, vessel_engine: vesselEngine, has_diagram: !!inlineDiagram, language: localStorage.getItem('bb_language') || 'en' }),
        })
        if (res.ok) {
          const data = await res.json()
          aiContent = (data.answer || data.response || data.message || 'Got it!')
            .replace(/\*\*([^*]+)\*\*/g, '$1')   // strip **bold**
            .replace(/\*([^*]+)\*/g, '$1')        // strip *italic*
            .replace(/^#{1,3}\s+/gm, '')          // strip # headers
            .replace(/^- /gm, '')                  // strip leading dashes used as bullets
        } else {
          aiContent = 'Sorry, I encountered an error. Please try again.'
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
      }
      const updated = [...newMessages, aiMsg]
      setMessages(updated)
      saveHistory(updated, sessionId)

      // Log is manual only — user taps the log icon on a message to save it
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection error — please check your internet and try again.',
        timestamp: Date.now(),
      }
      const updated = [...newMessages, errMsg]
      setMessages(updated)
      saveHistory(updated, sessionId)
    } finally {
      setLoading(false)
    }
  }

  const searchManuals = async () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '📖 ' + text,
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Check for diagram match in manual mode — reset first
      setInlineDiagram(null)
      const manualDiagram = findDiagram(text)
      if (manualDiagram) {
        setInlineDiagram({ title: manualDiagram.title, svgPath: manualDiagram.svgPath })
      }

      let vesselEngine = ''
      try {
        const vp = localStorage.getItem('boat_buddy_vessel')
        if (vp) {
          const v = JSON.parse(vp)
          vesselEngine = `${v.engineMake || ''} ${v.engineModel || ''}`.trim()
        }
      } catch {}

      const res = await fetch(`${API_URL}/api/manual-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, engine: vesselEngine }),
      })

      let aiContent = ''
      if (res.ok) {
        const data = await res.json()
        const sourceList = data.sources && data.sources.length > 0
          ? '\n\nSOURCES:' + data.sources.map((s: string) => '\n• ' + s.replace(/[-_]/g, ' ').replace(/\.(txt|pdf)$/i, '')).join('')
          : ''
        const cleanAnswer = (data.answer || '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/^#{1,3}\s+/gm, '')
        aiContent = 'FROM_MANUAL:' + cleanAnswer + sourceList
      } else {
        const err = await res.json().catch(() => ({}))
        aiContent = 'Manual search unavailable: ' + (err.error || res.status)
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
      }
      const updated = [...newMessages, aiMsg]
      setMessages(updated)
      saveHistory(updated, sessionId)
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Manual search error — please check your connection.',
        timestamp: Date.now(),
      }
      const updated = [...newMessages, errMsg]
      setMessages(updated)
      saveHistory(updated, sessionId)
    } finally {
      setLoading(false)
      setManualMode(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (manualMode) searchManuals()
      else sendMessage()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = ev => setSelectedImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleNewChat = () => {
    const sid = newSession()
    setSessionId(sid)
    setMessages([])
  }

  const rawAuth = getAuth()
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase())
  const isAdmin = rawAuth?.email && adminEmails.includes(rawAuth.email.toLowerCase())
  const auth = isAdmin ? { ...rawAuth, subscription: 'admiral' } : rawAuth // LIVE: admin gets Admiral tier

  const renderMessage = (content: string) => {
    // Detect if content has a diagram block (lines with arrows/box chars)
    const lines = content.split('\n')
    const result: React.ReactNode[] = []
    let diagramBuffer: string[] = []
    let inDiagram = false

    const flushDiagram = (key: string) => {
      if (diagramBuffer.length > 0) {
        result.push(
          <pre key={key} style={{ fontFamily: 'monospace', fontSize: '11px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(198,139,58,0.3)', borderRadius: '8px', padding: '10px', overflowX: 'auto', color: '#F5F0E8', margin: '8px 0', whiteSpace: 'pre', lineHeight: '1.4', maxWidth: '100%', wordBreak: 'break-all' }}>
            {diagramBuffer.join('\n')}
          </pre>
        )
        diagramBuffer = []
      }
    }

    lines.forEach((line, i) => {
      if (line.startsWith('MANUAL_LINKS:')) {
        flushDiagram('diag-manual-' + i)
        inDiagram = false
        try {
          const manuals: Array<{label: string, url: string}> = JSON.parse(line.replace('MANUAL_LINKS:', ''))
          result.push(
            <div key={i} style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(198,139,58,0.1)', border: '1px solid rgba(198,139,58,0.35)', borderRadius: '10px' }}>
              <p style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>📚 Service Manuals</p>
              {manuals.map((m, mi) => (
                <a key={mi} href={m.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', color: '#C68B3A', fontSize: '13px', textDecoration: 'underline', fontFamily: 'Georgia, serif', marginBottom: '4px' }}>
                  🔗 {m.label}
                </a>
              ))}
            </div>
          )
        } catch {}
        return
      }

      if (line.startsWith('SEARCH_LINK:')) {
        flushDiagram('diag-' + i)
        inDiagram = false
        const partName = line.replace('SEARCH_LINK:', '').trim()
        const url = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent('marine ' + partName)
        result.push(
          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', marginBottom: '4px', padding: '6px 12px', background: 'rgba(198,139,58,0.2)', border: '1px solid rgba(198,139,58,0.5)', borderRadius: '8px', color: '#C68B3A', fontSize: '13px', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
            🔍 See images: {partName}
          </a>
        )
        return
      }

      // Detect diagram lines: contain arrows, box chars, or multiple special chars
      const isDiagramLine = /[─│┌┐└┘├┤┬┴┼→←↑↓↔⇒]/.test(line) || 
        (line.includes('-->') && line.length > 5) ||
        (line.includes('->') && line.includes('|'))

      if (isDiagramLine || (inDiagram && line.trim() !== '' && line.match(/^[\s\w\(\)\[\]\-\>\|\+\:\.]+$/))) {
        inDiagram = true
        diagramBuffer.push(line)
      } else {
        if (inDiagram && line.trim() === '') {
          diagramBuffer.push(line)
        } else {
          if (inDiagram && line.trim() !== '' && !isDiagramLine) {
            flushDiagram('diag-' + i)
            inDiagram = false
          }
          if (line === '') {
            result.push(<br key={i} />)
          } else {
            result.push(<p key={i} style={{ marginBottom: '4px' }}>{line}</p>)
          }
        }
      }
    })

    flushDiagram('diag-end')
    return result
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      {showTC && <TCModal onAccept={() => setShowTC(false)} />}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(0, 0, 0, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <span className="text-xs hidden sm:block" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
            {auth?.name || auth?.email}
          </span>
          {subscription !== 'first_mate' && (
            <a href="/upgrade" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(198,139,58,0.3)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.6)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⭐ Upgrade
            </a>
          )}
          <a href="/diagrams" className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
            📐
          </a>
          <a href="/help" className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
            ?
          </a>
          <button onClick={handleNewChat} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
            + New
          </button>
        </div>
      </header>

      {/* Service Alert Banner */}
      {serviceAlert && (
        <div className="px-4 py-2 flex items-center justify-between gap-3"
          style={{ background: 'rgba(139,90,10,0.35)', borderBottom: '1px solid rgba(198,139,58,0.5)' }}>
          <p className="text-xs flex-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{serviceAlert}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="/log" className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'rgba(198,139,58,0.3)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              View
            </a>
            <button onClick={() => setServiceAlert(null)} className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {/* Upgrade banner */}
      {showUpgradeBanner && (
        <div className="px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: 'rgba(139,26,26,0.4)', borderBottom: '1px solid rgba(198,139,58,0.4)' }}>
          <p className="text-xs flex-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            🪝 You&apos;re on the Stow Away plan — 1 free question every 6 hours. Upgrade to First Mate for unlimited access.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="/upgrade"
              className="text-xs px-3 py-1.5 rounded-lg font-bold"
              style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              Upgrade — $19.99/mo
            </a>
            <button onClick={() => setShowUpgradeBanner(false)}
              className="text-xs"
              style={{ color: 'rgba(245,240,232,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-32" style={{ overflowX: 'hidden' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-64 text-center py-12">
            <div className="text-5xl mb-4">⚓</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
              Ahoy, Captain!
            </h2>
            <p className="text-sm max-w-xs" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
              Describe your boat issue or send a photo and I&apos;ll help diagnose the problem.
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              {[
                'My engine is overheating',
                'There\'s a strange smell from the bilge',
                'Engine won\'t start',
              ].map(suggestion => (
                <button key={suggestion} onClick={() => { setInput(suggestion); textareaRef.current?.focus() }}
                  className="text-left text-sm px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(198,139,58,0.1)', border: '1px solid rgba(198,139,58,0.3)', color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div>
              {msg.imageUrl && (
                <div className={`mb-2 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={msg.imageUrl} alt="Sent image" className="rounded-xl max-w-48 max-h-48 object-cover"
                    style={{ border: '1px solid rgba(198,139,58,0.4)' }} />
                </div>
              )}
              {msg.diagramUrl && (
                <div className="mb-2">
                  <a href={msg.diagramUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={msg.diagramUrl} alt="Marine diagram" className="rounded-xl w-full max-w-sm object-contain"
                      style={{ border: '2px solid rgba(198,139,58,0.6)', background: '#fff' }} />
                  </a>
                  <p className="text-xs mt-1" style={{ color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif' }}>Tap to view full size</p>
                </div>
              )}
              {msg.content && (
                <div>
                  <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                    {msg.role === 'assistant' && (
                      <span className="text-xs block mb-1" style={{ color: msg.content.startsWith('FROM_MANUAL:') ? '#4A9E6B' : '#C68B3A', fontFamily: 'Georgia, serif' }}>
                        {msg.content.startsWith('FROM_MANUAL:') ? '📖 From Manual' : '⚓ Boat Buddy'}
                      </span>
                    )}
                    {msg.role === 'assistant' ? <div>{renderMessage(msg.content.startsWith('FROM_MANUAL:') ? msg.content.slice(12) : msg.content)}</div> : msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => {
                        try {
                          const vesselRaw = localStorage.getItem('boat_buddy_vessel')
                          const vessel = vesselRaw ? JSON.parse(vesselRaw) : null
                          const logRaw = localStorage.getItem('boat_buddy_repair_log')
                          const repairLog = logRaw ? JSON.parse(logRaw) : []
                          // Find the user message before this one
                          const idx = messages.findIndex(m => m.id === msg.id)
                          const userMsg = idx > 0 ? messages[idx - 1] : null
                          const entry = {
                            id: Date.now().toString(),
                            date: Date.now(),
                            vessel: vessel?.name || 'Unknown Vessel',
                            symptom: userMsg?.content || 'Chat session',
                            diagnosis: msg.content,
                            parts: [],
                            sessionId,
                          }
                          repairLog.unshift(entry)
                          localStorage.setItem('boat_buddy_repair_log', JSON.stringify(repairLog.slice(0, 100)))
                          // Also sync to Supabase
                          try {
                            const rawAuth2 = JSON.parse(localStorage.getItem('boat_buddy_auth') || '{}')
                            fetch(`${API_URL}/api/db/jobs`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...entry, user_id: rawAuth2.email}) }).catch(() => {})
                          } catch {}
                          alert('Saved to Repair Log ✓')
                        } catch { alert('Could not save to log') }
                      }}
                      className="text-xs mt-1 px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(198,139,58,0.15)', color: 'rgba(198,139,58,0.7)', border: '1px solid rgba(198,139,58,0.25)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                      🗒️ Save to Log
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bubble-ai">
              <span className="text-xs block mb-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>⚓ Boat Buddy</span>
              <span className="animate-pulse">{input.toLowerCase().includes('diagram') || input.toLowerCase().includes('schematic') || input.toLowerCase().includes('draw') ? 'Generating diagram...' : 'Analyzing...'}</span>
            </div>
          </div>
        )}
        {/* Inline diagram — compact banner, tap to expand */}
        {inlineDiagram && (
          <div ref={diagramRef}>
          <>
            <div className="mb-3" style={{ background: 'rgba(20,8,2,0.92)', border: '1px solid rgba(198,139,58,0.4)', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(198,139,58,0.2)' }}>
                <p className="text-xs font-bold" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                  📐 {inlineDiagram.title}
                </p>
                <div className="flex items-center gap-2">
                  <a href="/diagrams" className="text-xs" style={{ color: 'rgba(198,139,58,0.6)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>All ↗</a>
                  <button onClick={() => setInlineDiagram(null)} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                </div>
              </div>
              <div style={{ background: '#fff', padding: '6px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inlineDiagram.svgPath} alt={inlineDiagram.title} className="w-full" style={{ maxHeight: '180px', objectFit: 'contain', display: 'block' }} />
              </div>
              <div className="px-3 py-1.5">
                <a href={inlineDiagram.svgPath} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>Tap to view full size ↗</a>
              </div>
            </div>
          </>
          </div>
        )}


        <div ref={messagesEndRef} />
      </main>

      {/* Image preview */}
      {selectedImage && (
        <div className="fixed bottom-28 left-4 z-40">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Preview" className="rounded-xl w-20 h-20 object-cover"
              style={{ border: '2px solid #C68B3A' }} />
            <button onClick={() => { setSelectedImage(null); setSelectedFile(null) }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#8B1A1A', color: '#F5F0E8' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 px-3 pb-2 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderTop: '1px solid rgba(198,139,58,0.3)' }}>
        <div className="flex items-end gap-2 pt-2">
          {/* Camera */}
          <button onClick={() => cameraInputRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(198,139,58,0.2)', border: '1px solid rgba(198,139,58,0.4)', color: '#C68B3A' }}>
            📷
          </button>
          {/* Gallery */}
          <button onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(198,139,58,0.2)', border: '1px solid rgba(198,139,58,0.4)', color: '#C68B3A' }}>
            🖼️
          </button>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            className="flex-1 input-field resize-none"
            placeholder={manualMode ? 'Ask the service manual...' : 'Describe your issue...'}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ minHeight: '40px', maxHeight: '120px', paddingTop: '10px', paddingBottom: '10px' }}
          />

          {/* Manual Search */}
          <button
            onClick={() => { setManualMode(m => !m) }}
            title="Search service manuals"
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm"
            style={{
              background: manualMode ? 'rgba(74,158,107,0.4)' : 'rgba(198,139,58,0.2)',
              border: manualMode ? '1px solid rgba(74,158,107,0.7)' : '1px solid rgba(198,139,58,0.4)',
              color: manualMode ? '#4A9E6B' : '#C68B3A',
            }}>
            📖
          </button>

          {/* Send */}
          <button onClick={manualMode ? searchManuals : sendMessage} disabled={loading || (!input.trim() && !selectedFile)}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{
              background: (loading || (!input.trim() && !selectedFile)) ? 'rgba(198,139,58,0.2)' : '#C68B3A',
              color: (loading || (!input.trim() && !selectedFile)) ? 'rgba(198,139,58,0.4)' : '#3D1C02',
              border: '1px solid rgba(198,139,58,0.4)',
            }}>
            ➤
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {/* camera: capture without value = Android opens camera app directly */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture className="hidden" onChange={handleFileChange} />

      <NavBar />
    </div>
  )
}












