'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

export interface VesselProfile {
  id: string
  name: string
  type: string
  year: string
  make: string
  model: string
  engineMake: string
  engineModel: string
  engineSerial: string
  engineHours: string
  homePort: string
  documentNumber: string
}

const VESSELS_KEY = 'boat_buddy_vessels'
const ACTIVE_VESSEL_KEY = 'boat_buddy_vessel'

export function getVesselProfile(): VesselProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(userKey(ACTIVE_VESSEL_KEY))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getAllVessels(): VesselProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(userKey(VESSELS_KEY))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveAllVessels(vessels: VesselProfile[]) {
  localStorage.setItem(userKey(VESSELS_KEY), JSON.stringify(vessels))
}

export function setActiveVessel(vessel: VesselProfile) {
  localStorage.setItem(userKey(ACTIVE_VESSEL_KEY), JSON.stringify(vessel))
}

function generateId() {
  return 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const EMPTY: Omit<VesselProfile, 'id'> = {
  name: '', type: '', year: '', make: '', model: '',
  engineMake: '', engineModel: '', engineSerial: '', engineHours: '',
  homePort: '', documentNumber: '',
}

const VESSEL_TYPES = [
  '', 'Sailboat', 'Powerboat', 'Pontoon', 'Catamaran', 'Trawler',
  'Sportfish', 'Center Console', 'Bass Boat', 'Jon Boat', 'Jet Ski / PWC', 'Other',
]

export default function VesselPage() {
  const router = useRouter()
  const [vessels, setVessels] = useState<VesselProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null) // null = list view, 'new' = new form, id = editing
  const [form, setForm] = useState<Omit<VesselProfile, 'id'>>(EMPTY)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }

    let all = getAllVessels()
    // Migrate old single vessel if exists
    if (all.length === 0) {
      try {
        const old = localStorage.getItem(userKey(ACTIVE_VESSEL_KEY))
        if (old) {
          const parsed = JSON.parse(old)
          if (parsed.name && !parsed.id) {
            const migrated = { ...parsed, id: generateId() }
            all = [migrated]
            saveAllVessels(all)
          }
        }
      } catch {}
    }

    setVessels(all)
    const active = getVesselProfile()
    if (active?.id) setActiveId(active.id)
    else if (all.length > 0) {
      setActiveId(all[0].id)
      setActiveVessel(all[0])
    }
  }, [router])

  const startNew = () => {
    setForm(EMPTY)
    setEditingId('new')
    setSaved(false)
  }

  const startEdit = (v: VesselProfile) => {
    const { id, ...rest } = v
    setForm(rest)
    setEditingId(id)
    setSaved(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { alert('Vessel name is required.'); return }

    let updated: VesselProfile[]
    if (editingId === 'new') {
      const newVessel: VesselProfile = { id: generateId(), ...form }
      updated = [...vessels, newVessel]
      // Auto-set as active if first vessel
      if (vessels.length === 0) {
        setActiveId(newVessel.id)
        setActiveVessel(newVessel)
      }
    } else {
      updated = vessels.map(v => v.id === editingId ? { id: editingId, ...form } : v)
      // Update active vessel if editing the active one
      if (editingId === activeId) {
        setActiveVessel({ id: editingId, ...form })
      }
    }

    saveAllVessels(updated)
    setVessels(updated)
    setSaved(true)

    // Sync to Supabase in background
    try {
      const auth = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('boat_buddy_auth') || '{}') : {}
      const payload = editingId === 'new'
        ? { ...form, id: updated[updated.length-1]?.id, user_id: auth.email }
        : { ...form, id: editingId, user_id: auth.email }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
      if (editingId === 'new') {
        fetch(`${apiUrl}/api/db/vessels`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }).catch(() => {})
      } else {
        fetch(`${apiUrl}/api/db/vessels/${editingId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) }).catch(() => {})
      }
    } catch {}

    setTimeout(() => { setSaved(false); setEditingId(null) }, 1200)
  }

  const handleSetActive = (v: VesselProfile) => {
    setActiveId(v.id)
    setActiveVessel(v)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this vessel profile?')) return
    const updated = vessels.filter(v => v.id !== id)
    saveAllVessels(updated)
    setVessels(updated)
    // If deleting active, switch to first remaining
    if (id === activeId) {
      if (updated.length > 0) {
        setActiveId(updated[0].id)
        setActiveVessel(updated[0])
      } else {
        setActiveId(null)
        localStorage.removeItem(userKey(ACTIVE_VESSEL_KEY))
      }
    }
  }

  const set = (field: keyof Omit<VesselProfile, 'id'>, value: string) => {
    setSaved(false)
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

  // Edit / New form view
  if (editingId !== null) {
    return (
      <div className="bg-wood min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
          <Logo size="sm" />
          <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
            ← Back
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
          <h1 className="text-xl font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            {editingId === 'new' ? '⚓ Add Vessel' : '⚓ Edit Vessel'}
          </h1>

          {saved && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
              style={{ background: 'rgba(0,100,50,0.35)', border: '1px solid rgba(0,200,100,0.4)', color: '#7fffb2', fontFamily: 'Georgia, serif' }}>
              ✅ Saved!
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="panel p-4">
              <h2 className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Vessel Information</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Vessel Name *</label>
                  <input className="input-field" placeholder="e.g. Sea Witch" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Vessel Type</label>
                  <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}
                    style={{ background: 'rgba(245, 240, 232, 0.1)', border: '1px solid rgba(198, 139, 58, 0.5)', borderRadius: '8px', color: form.type ? '#F5F0E8' : 'rgba(245,240,232,0.4)', padding: '12px 16px', fontFamily: 'Georgia, serif', fontSize: '16px', width: '100%', outline: 'none' }}>
                    {VESSEL_TYPES.map(t => (
                      <option key={t} value={t} style={{ background: '#1a0a02', color: '#F5F0E8' }}>{t || '— Select type —'}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={labelStyle}>Year</label>
                    <input className="input-field" placeholder="e.g. 1983" value={form.year} onChange={e => set('year', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={labelStyle}>Make</label>
                    <input className="input-field" placeholder="e.g. Pearson" value={form.make} onChange={e => set('make', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Model</label>
                  <input className="input-field" placeholder="e.g. 367 Cutter" value={form.model} onChange={e => set('model', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Home Port</label>
                  <input className="input-field" placeholder="e.g. Solomons, MD" value={form.homePort} onChange={e => set('homePort', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Documentation / HIN Number</label>
                  <input className="input-field" placeholder="e.g. 1234567" value={form.documentNumber} onChange={e => set('documentNumber', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="panel p-4">
              <h2 className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Engine Information</h2>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={labelStyle}>Engine Make</label>
                    <input className="input-field" placeholder="e.g. Yanmar" value={form.engineMake} onChange={e => set('engineMake', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={labelStyle}>Engine Model</label>
                    <input className="input-field" placeholder="e.g. 3GM30" value={form.engineModel} onChange={e => set('engineModel', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Engine Serial Number</label>
                  <input className="input-field" placeholder="e.g. E3G01-XXXXXX" value={form.engineSerial} onChange={e => set('engineSerial', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Engine Hours</label>
                  <input className="input-field" type="number" placeholder="e.g. 1250" value={form.engineHours} onChange={e => set('engineHours', e.target.value)} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">💾 Save Vessel</button>
          </form>
        </main>
        <NavBar />
      </div>
    )
  }

  // List view
  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <button onClick={startNew} className="text-xs px-3 py-1.5 rounded-lg font-bold"
          style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer' }}>
          + Add Vessel
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>⚓ My Fleet</h1>
        <p className="text-xs mb-5" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
          {vessels.length} vessel{vessels.length !== 1 ? 's' : ''}. Active vessel is used in chat and work orders.
        </p>

        {vessels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚓</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>No vessels yet.</p>
            <button onClick={startNew} className="btn-primary px-8">+ Add Your First Vessel</button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {vessels.map(v => (
            <div key={v.id} className="panel p-4"
              style={{ border: v.id === activeId ? '1px solid rgba(198,139,58,0.8)' : '1px solid rgba(198,139,58,0.3)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-base" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{v.name || 'Unnamed Vessel'}</p>
                    {v.id === activeId && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(198,139,58,0.3)', color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Active</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(245,240,232,0.55)', fontFamily: 'Georgia, serif' }}>
                    {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                    {v.engineMake ? ` · ${v.engineMake} ${v.engineModel}`.trim() : ''}
                    {v.homePort ? ` · ${v.homePort}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {v.id !== activeId && (
                  <button onClick={() => handleSetActive(v)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    ✓ Set Active
                  </button>
                )}
                <button onClick={() => startEdit(v)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(198,139,58,0.15)', color: 'rgba(198,139,58,0.8)', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(v.id)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <NavBar />
    </div>
  )
}
