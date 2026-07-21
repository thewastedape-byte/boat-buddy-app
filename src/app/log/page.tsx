'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'
import { getVesselProfile } from '@/app/vessel/page'

export interface RepairLogEntry {
  id: string
  date: number
  vessel: string
  symptom: string
  diagnosis: string
  parts: string[]
  laborHours?: string
  notes?: string
  nextServiceDate?: string
  nextServiceNote?: string
  sessionId: string
  manual?: boolean
}

export const REPAIR_LOG_KEY = 'boat_buddy_repair_log'

export function getRepairLog(): RepairLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(userKey(REPAIR_LOG_KEY))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  vessel: '',
  symptom: '',
  diagnosis: '',
  parts: '',
  laborHours: '',
  notes: '',
  nextServiceDate: '',
  nextServiceNote: '',
}

export default function RepairLogPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<RepairLogEntry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saved, setSaved] = useState(false)
  const [serviceReminders, setServiceReminders] = useState<RepairLogEntry[]>([])

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const log = getRepairLog()
    setEntries(log)
    // Pre-fill vessel name from profile
    const vessel = getVesselProfile()
    if (vessel?.name) setForm(f => ({ ...f, vessel: vessel.name }))
    // Check for upcoming service reminders (within 14 days)
    const now = Date.now()
    const fourteenDays = 14 * 24 * 60 * 60 * 1000
    const due = log.filter(e => {
      if (!e.nextServiceDate) return false
      const dueTime = new Date(e.nextServiceDate).getTime()
      return dueTime <= now + fourteenDays
    })
    setServiceReminders(due)
  }, [router])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: RepairLogEntry = {
      id: Date.now().toString(),
      date: new Date(form.date).getTime() || Date.now(),
      vessel: form.vessel || 'Unknown Vessel',
      symptom: form.symptom,
      diagnosis: form.diagnosis,
      parts: form.parts.split('\n').map(p => p.trim()).filter(Boolean),
      laborHours: form.laborHours,
      notes: form.notes,
      nextServiceDate: form.nextServiceDate,
      nextServiceNote: form.nextServiceNote,
      sessionId: 'manual',
      manual: true,
    }
    const updated = [entry, ...entries]
    localStorage.setItem(userKey(REPAIR_LOG_KEY), JSON.stringify(updated))
    setEntries(updated)
    setSaved(true)
    setShowForm(false)
    setForm({ ...EMPTY_FORM, vessel: form.vessel })
    setTimeout(() => setSaved(false), 3000)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const deleteEntry = (id: string) => {
    if (!confirm('Delete this log entry?')) return
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem(userKey(REPAIR_LOG_KEY), JSON.stringify(updated))
  }

  const clearAll = () => {
    if (!confirm('Clear all repair log entries?')) return
    localStorage.removeItem(userKey(REPAIR_LOG_KEY))
    setEntries([])
  }

  const filtered = entries.filter(e => {
    if (filterDate) {
      const d = new Date(e.date)
      const dateStr = d.toISOString().split('T')[0]
      if (dateStr !== filterDate) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!e.symptom.toLowerCase().includes(q) && !e.vessel.toLowerCase().includes(q) && !e.diagnosis.toLowerCase().includes(q)) return false
    }
    return true
  })

  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }
  const textStyle = { color: '#F5F0E8', fontFamily: 'system-ui, -apple-system, sans-serif' }
  const dimStyle = { color: 'rgba(245,240,232,0.82)', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button onClick={clearAll} className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(139,26,26,0.3)', color: '#F5F0E8', border: '1px solid rgba(139,26,26,0.5)', fontFamily: 'Georgia, serif' }}>
              Clear All
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            🔧 Repair Log
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/workorder" className="text-sm px-3 py-2 rounded-lg font-bold"
              style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              📄
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm px-4 py-2 rounded-lg font-bold"
              style={{ background: showForm ? 'rgba(139,26,26,0.4)' : '#C68B3A', color: showForm ? '#F5F0E8' : '#3D1C02', fontFamily: 'Georgia, serif', border: 'none' }}>
              {showForm ? '✕ Cancel' : '+ New Entry'}
            </button>
          </div>
        </div>
        <p className="text-xs mb-4" style={dimStyle}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}. Tap “Save to Log” in chat to add entries.
        </p>

        {/* Service Reminders Banner */}
        {serviceReminders.length > 0 && (
          <div className="mb-4 px-4 py-3 rounded-lg"
            style={{ background: 'rgba(139,90,10,0.3)', border: '1px solid rgba(198,139,58,0.6)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
              🔔 Upcoming Service Reminders
            </p>
            {serviceReminders.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs flex-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                  <strong>{e.nextServiceNote || 'Service'}</strong> due {new Date(e.nextServiceDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {e.vessel}
                </p>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      // Mark done — clear the nextServiceDate from the entry
                      const updated = entries.map(en => en.id === e.id ? { ...en, nextServiceDate: undefined, nextServiceNote: undefined } : en)
                      setEntries(updated)
                      localStorage.setItem(userKey(REPAIR_LOG_KEY), JSON.stringify(updated))
                      setServiceReminders(prev => prev.filter(r => r.id !== e.id))
                    }}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(50,139,50,0.4)', color: '#90e090', border: '1px solid rgba(50,139,50,0.6)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    ✓ Done
                  </button>
                  <button
                    onClick={() => setServiceReminders(prev => prev.filter(r => r.id !== e.id))}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(139,26,26,0.3)', color: 'rgba(245,240,232,0.88)', border: '1px solid rgba(139,26,26,0.4)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {saved && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
            style={{ background: 'rgba(0,100,50,0.35)', border: '1px solid rgba(0,200,100,0.4)', color: '#7fffb2', fontFamily: 'Georgia, serif' }}>
            ✅ Log entry saved!
          </div>
        )}

        {/* Manual Entry Form */}
        {showForm && (
          <form onSubmit={handleSave} className="panel p-4 mb-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={labelStyle}>New Log Entry</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={labelStyle}>Date</label>
                <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} style={{ fontSize: '14px', padding: '8px 12px' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={labelStyle}>Vessel Name</label>
                <input className="input-field" placeholder="e.g. Seaquin" value={form.vessel} onChange={e => set('vessel', e.target.value)} style={{ fontSize: '14px', padding: '8px 12px' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Problem / Symptom *</label>
              <input className="input-field" placeholder="e.g. Engine overheating at 2000 RPM" value={form.symptom} onChange={e => set('symptom', e.target.value)} required style={{ fontSize: '14px', padding: '8px 12px' }} />
            </div>

            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Diagnosis / Work Performed *</label>
              <textarea className="input-field resize-none" placeholder="Describe the diagnosis and repair work done..." value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} required rows={4} style={{ fontSize: '14px', padding: '8px 12px' }} />
            </div>

            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Parts Used <span style={{ color: 'rgba(245,240,232,0.75)' }}>(one per line)</span></label>
              <textarea className="input-field resize-none" placeholder={"Raw water impeller\nThermostat\nCoolant hose"} value={form.parts} onChange={e => set('parts', e.target.value)} rows={3} style={{ fontSize: '14px', padding: '8px 12px' }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={labelStyle}>Labor Hours</label>
                <input className="input-field" placeholder="e.g. 2.5" value={form.laborHours} onChange={e => set('laborHours', e.target.value)} style={{ fontSize: '14px', padding: '8px 12px' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={labelStyle}>Notes</label>
                <input className="input-field" placeholder="Any additional notes" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ fontSize: '14px', padding: '8px 12px' }} />
              </div>
            </div>

            <div className="panel p-3" style={{ background: 'rgba(198,139,58,0.08)', border: '1px solid rgba(198,139,58,0.3)' }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={labelStyle}>🔔 Next Service Reminder</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Due Date</label>
                  <input type="date" className="input-field" value={form.nextServiceDate} onChange={e => set('nextServiceDate', e.target.value)} style={{ fontSize: '14px', padding: '8px 12px' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Service Type</label>
                  <input className="input-field" placeholder="e.g. Oil change" value={form.nextServiceNote} onChange={e => set('nextServiceNote', e.target.value)} style={{ fontSize: '14px', padding: '8px 12px' }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-1" style={{ fontSize: '15px' }}>
              💾 Save Log Entry
            </button>
          </form>
        )}

        {/* Filters */}
        {entries.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            <input
              className="input-field"
              placeholder="🔍 Search symptoms, vessel, diagnosis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '14px', padding: '8px 12px' }}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs flex-shrink-0" style={labelStyle}>Filter by date:</label>
              <input
                type="date"
                className="input-field flex-1"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ fontSize: '14px', padding: '8px 12px' }}
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)' }}>
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {filtered.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔧</div>
            <p className="text-sm mb-2" style={{ color: 'rgba(245,240,232,0.88)', fontFamily: 'Georgia, serif' }}>
              {entries.length === 0 ? 'No repairs logged yet.' : 'No entries match your filter.'}
            </p>
            {entries.length === 0 && (
              <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia, serif' }}>
                Add a manual entry or AI diagnoses auto-save here.
              </p>
            )}
            <Link href="/" className="btn-primary inline-block mt-2">
              Go to Chat
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(entry => (
              <div key={entry.id} className="panel overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                          {entry.symptom}
                        </p>
                        {entry.manual && (
                          <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
                            manual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                          ⚓ {entry.vessel}
                        </span>
                        <span className="text-xs" style={dimStyle}>
                          {formatDate(entry.date)}
                        </span>
                        {entry.laborHours && (
                          <span className="text-xs" style={dimStyle}>
                            ⏱ {entry.laborHours}h
                          </span>
                        )}
                      </div>
                      {entry.parts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.parts.slice(0, 3).map((p, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
                              {p.length > 25 ? p.substring(0, 25) + '…' : p}
                            </span>
                          ))}
                          {entry.parts.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'rgba(245,240,232,0.75)', fontFamily: 'Georgia, serif' }}>
                              +{entry.parts.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs flex-shrink-0 mt-1" style={{ color: 'rgba(198,139,58,0.7)' }}>
                      {expanded === entry.id ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {expanded === entry.id && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(198,139,58,0.2)' }}>
                    <p className="text-xs uppercase tracking-wider mt-3 mb-2" style={labelStyle}>
                      {entry.manual ? 'Work Performed' : 'AI Diagnosis'}
                    </p>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={textStyle}>
                      {entry.diagnosis}
                    </div>

                    {entry.parts.length > 0 && (
                      <>
                        <p className="text-xs uppercase tracking-wider mt-4 mb-2" style={labelStyle}>
                          Parts Used
                        </p>
                        <ul className="flex flex-col gap-1">
                          {entry.parts.map((p, i) => (
                            <li key={i} className="text-sm flex items-start gap-2" style={textStyle}>
                              <span style={{ color: '#C68B3A' }}>•</span> {p}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {entry.notes && (
                      <>
                        <p className="text-xs uppercase tracking-wider mt-4 mb-1" style={labelStyle}>Notes</p>
                        <p className="text-sm" style={textStyle}>{entry.notes}</p>
                      </>
                    )}

                    {entry.nextServiceDate && (
                      <div className="mt-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(198,139,58,0.12)', border: '1px solid rgba(198,139,58,0.35)' }}>
                        <p className="text-xs font-bold" style={labelStyle}>🔔 Next Service Due</p>
                        <p className="text-sm mt-1" style={textStyle}>
                          {new Date(entry.nextServiceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {entry.nextServiceNote ? ` — ${entry.nextServiceNote}` : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Link
                        href={`/workorder?id=${entry.id}`}
                        className="flex-1 text-center text-sm py-2 rounded-lg font-bold"
                        style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                        📄 Work Order
                      </Link>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'rgba(139,26,26,0.3)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(139,26,26,0.4)' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <NavBar />
    </div>
  )
}

