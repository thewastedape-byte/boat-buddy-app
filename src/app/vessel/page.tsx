'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

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
  insuranceCompany: string
  policyNumber: string
  insuranceExpiry: string
  insuranceDoc: string
}

const VESSELS_KEY = 'boat_buddy_vessels'
const ACTIVE_VESSEL_KEY = 'boat_buddy_active_vessel'

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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// camelCase (frontend) → snake_case (DB)
function toApiPayload(vessel: VesselProfile, userEmail: string) {
  return {
    id: vessel.id,
    user_id: userEmail,
    name: vessel.name,
    type: vessel.type,
    year: vessel.year,
    make: vessel.make,
    model: vessel.model,
    engine_make: vessel.engineMake,
    engine_model: vessel.engineModel,
    engine_serial: vessel.engineSerial,
    engine_hours: vessel.engineHours,
    home_port: vessel.homePort,
    document_number: vessel.documentNumber,
    insurance_company: vessel.insuranceCompany,
    policy_number: vessel.policyNumber,
    insurance_expiry: vessel.insuranceExpiry,
    // insuranceDoc intentionally excluded — localStorage only (can be large)
  }
}

// snake_case (DB) → camelCase (frontend)
function fromApiVessel(cv: any): VesselProfile {
  return {
    id: cv.id,
    name: cv.name || '',
    type: cv.type || '',
    year: cv.year || '',
    make: cv.make || '',
    model: cv.model || '',
    engineMake: cv.engine_make || '',
    engineModel: cv.engine_model || '',
    engineSerial: cv.engine_serial || '',
    engineHours: cv.engine_hours || '',
    homePort: cv.home_port || '',
    documentNumber: cv.document_number || '',
    insuranceCompany: cv.insurance_company || '',
    policyNumber: cv.policy_number || '',
    insuranceExpiry: cv.insurance_expiry || '',
    insuranceDoc: '', // localStorage only — not stored in DB
  }
}

const EMPTY: Omit<VesselProfile, 'id'> = {
  name: '', type: '', year: '', make: '', model: '',
  engineMake: '', engineModel: '', engineSerial: '', engineHours: '',
  homePort: '', documentNumber: '',
  insuranceCompany: '', policyNumber: '', insuranceExpiry: '', insuranceDoc: '',
}

const VESSEL_TYPES = [
  '', 'Sailboat', 'Powerboat', 'Pontoon', 'Catamaran', 'Trawler',
  'Sportfish', 'Center Console', 'Bass Boat', 'Jon Boat', 'Jet Ski / PWC', 'Other',
]

export default function VesselPage() {
  const router = useRouter()
  const [vessels, setVessels] = useState<VesselProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<VesselProfile, 'id'>>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [loadingCloud, setLoadingCloud] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }

    // 1. Load from localStorage immediately (instant, no flash)
    let local = getAllVessels()

    // Migrate legacy single-vessel format
    if (local.length === 0) {
      try {
        const old = localStorage.getItem(userKey(ACTIVE_VESSEL_KEY))
        if (old) {
          const parsed = JSON.parse(old)
          if (parsed.name && !parsed.id) {
            const migrated = { ...parsed, id: generateId() }
            local = [migrated]
            saveAllVessels(local)
          }
        }
      } catch {}
    }

    setVessels(local)
    const active = getVesselProfile()
    if (active?.id) setActiveId(active.id)
    else if (local.length > 0) {
      setActiveId(local[0].id)
      setActiveVessel(local[0])
    }

    // 2. Fetch from cloud and merge (cloud is source of truth)
    const auth = JSON.parse(localStorage.getItem('boat_buddy_auth') || '{}')
    const email = auth.email
    if (!email) return

    setLoadingCloud(true)
    fetch(`${API_URL}/api/db/vessels?user_email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : [])
      .then((cloud: any[]) => {
        if (!Array.isArray(cloud) || cloud.length === 0) return
        const mapped = cloud.map(fromApiVessel)
        const cloudIds = new Set(mapped.map(v => v.id))
        // Cloud wins; keep any local-only (unsynced) entries
        const merged = [
          ...mapped,
          ...local.filter(v => !cloudIds.has(v.id)),
        ]
        saveAllVessels(merged)
        setVessels(merged)
        if (!active?.id && merged.length > 0) {
          setActiveId(merged[0].id)
          setActiveVessel(merged[0])
        }
      })
      .catch(() => {}) // Cloud unreachable — local data stands
      .finally(() => setLoadingCloud(false))
  }, [router])

  const startNew = () => {
    setForm(EMPTY)
    setEditingId('new')
    setSaved(false)
    setSyncError(null)
  }

  const startEdit = (v: VesselProfile) => {
    const { id, ...rest } = v
    setForm(rest)
    setEditingId(id)
    setSaved(false)
    setSyncError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { alert('Vessel name is required.'); return }
    setSaving(true)
    setSyncError(null)

    const auth = JSON.parse(localStorage.getItem('boat_buddy_auth') || '{}')
    const email = auth.email || ''

    let updated: VesselProfile[]
    let targetVessel: VesselProfile

    if (editingId === 'new') {
      targetVessel = { id: generateId(), ...form }
      updated = [...vessels, targetVessel]
      if (vessels.length === 0) {
        setActiveId(targetVessel.id)
        setActiveVessel(targetVessel)
      }
    } else {
      targetVessel = { id: editingId!, ...form }
      updated = vessels.map(v => v.id === editingId ? targetVessel : v)
      if (editingId === activeId) setActiveVessel(targetVessel)
    }

    // Save locally first (instant)
    saveAllVessels(updated)
    setVessels(updated)

    // Await cloud sync — no more silent failures
    try {
      const isNew = editingId === 'new'
      const url = isNew
        ? `${API_URL}/api/db/vessels`
        : `${API_URL}/api/db/vessels/${targetVessel.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(targetVessel, email)),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSyncError(`Saved locally. Cloud sync failed: ${err.error || res.status}`)
        setSaving(false)
        return
      }
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditingId(null) }, 1200)
    } catch {
      setSyncError('Saved locally. Cloud unavailable — data will persist until next sync.')
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditingId(null) }, 1500)
    } finally {
      setSaving(false)
    }
  }

  const handleSetActive = (v: VesselProfile) => {
    setActiveId(v.id)
    setActiveVessel(v)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vessel profile?')) return
    const updated = vessels.filter(v => v.id !== id)
    saveAllVessels(updated)
    setVessels(updated)
    if (id === activeId) {
      if (updated.length > 0) {
        setActiveId(updated[0].id)
        setActiveVessel(updated[0])
      } else {
        setActiveId(null)
        localStorage.removeItem(userKey(ACTIVE_VESSEL_KEY))
      }
    }
    // Cloud delete (best-effort, non-blocking)
    fetch(`${API_URL}/api/db/vessels/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const set = (field: keyof Omit<VesselProfile, 'id'>, value: string) => {
    setSaved(false)
    setSyncError(null)
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

          {syncError && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(200,80,80,0.4)', color: '#ffaaaa', fontFamily: 'Georgia, serif' }}>
              ⚠️ {syncError}
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

            <div className="panel p-4">
              <h2 className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Insurance</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Insurance Company</label>
                  <input className="input-field" placeholder="e.g. BoatUS" value={form.insuranceCompany} onChange={e => set('insuranceCompany', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Policy Number</label>
                  <input className="input-field" placeholder="e.g. BU-1234567" value={form.policyNumber} onChange={e => set('policyNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Policy Expiry</label>
                  <input className="input-field" type="month" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Insurance Document</label>
                  {form.insuranceDoc ? (
                    <div className="flex gap-2 items-center">
                      <a href={form.insuranceDoc} download="insurance.pdf" className="text-xs px-3 py-1.5 rounded-lg"
                        style={{background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif'}}>
                        ⬇️ Download Insurance Doc
                      </a>
                      <button type="button" onClick={() => set('insuranceDoc', '')}
                        className="text-xs px-2 py-1.5 rounded-lg"
                        style={{background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif'}}>
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <label className="text-xs px-3 py-2 rounded-lg cursor-pointer inline-block"
                      style={{background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif'}}>
                      📎 Upload Insurance Doc
                      <input type="file" accept="image/*,application/pdf" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = ev => set('insuranceDoc', ev.target?.result as string)
                          reader.readAsDataURL(file)
                        }} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full"
              style={saving ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
              {saving ? '⏳ Saving...' : '💾 Save Vessel'}
            </button>
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
          {vessels.length} vessel{vessels.length !== 1 ? 's' : ''}.{loadingCloud ? ' ☁️ Syncing...' : ''} Active vessel is used in chat and work orders.
        </p>

        {vessels.length === 0 && !loadingCloud && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚓</p>
            <p className="text-sm mb-4" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>No vessels yet.</p>
            <button onClick={startNew} className="btn-primary px-8">+ Add Your First Vessel</button>
          </div>
        )}

        {vessels.length === 0 && loadingCloud && (
          <div className="text-center py-12">
            <p className="text-2xl mb-3">☁️</p>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Loading your fleet...</p>
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
                    {v.insuranceExpiry && (() => {
                      const expiry = new Date(v.insuranceExpiry + '-01')
                      const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
                      return daysLeft <= 30 ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,120,0,0.25)', color: '#FFB347', fontFamily: 'Georgia, serif', border: '1px solid rgba(200,120,0,0.4)' }}
                          title={`Insurance expires ${v.insuranceExpiry}`}>
                          ⚠️ {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
                        </span>
                      ) : null
                    })()}
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

