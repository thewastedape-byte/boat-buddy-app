'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'

interface VesselProfile {
  id: string
  name: string
  year?: string
  make?: string
  model?: string
  type?: string
  homePort?: string
  engineMake?: string
  engineModel?: string
  engineSerial?: string
  engineHours?: string
  documentNumber?: string
}

interface MaintenanceItem {
  id: string
  name: string
  icon: string
  category: string
  intervalDays: number
  intervalHours?: number
  lastDoneDate: string
  lastDoneHours?: number
  notes: string
  enabled: boolean
  custom?: boolean
}

const DEFAULT_ITEMS: MaintenanceItem[] = [
  { id: 'engine-oil', name: 'Engine Oil & Filter', icon: '🛢️', category: 'Engine', intervalDays: 365, intervalHours: 100, lastDoneDate: '', notes: '', enabled: true },
  { id: 'raw-water-impeller', name: 'Raw Water Impeller', icon: '💧', category: 'Cooling', intervalDays: 180, intervalHours: 300, lastDoneDate: '', notes: '', enabled: true },
  { id: 'fuel-filter', name: 'Fuel Filter', icon: '⛽', category: 'Fuel', intervalDays: 365, lastDoneDate: '', notes: '', enabled: true },
  { id: 'zincs-anodes', name: 'Zincs / Anodes', icon: '⚓', category: 'Hull', intervalDays: 90, lastDoneDate: '', notes: '', enabled: true },
  { id: 'engine-belts', name: 'Engine Belts', icon: '🔧', category: 'Engine', intervalDays: 730, lastDoneDate: '', notes: '', enabled: true },
  { id: 'spark-plugs', name: 'Spark Plugs', icon: '⚡', category: 'Engine', intervalDays: 365, lastDoneDate: '', notes: '', enabled: true },
  { id: 'coolant', name: 'Coolant / Antifreeze', icon: '❄️', category: 'Cooling', intervalDays: 730, lastDoneDate: '', notes: '', enabled: true },
  { id: 'bottom-paint', name: 'Bottom Paint', icon: '🖌️', category: 'Hull', intervalDays: 365, lastDoneDate: '', notes: '', enabled: true },
  { id: 'fire-extinguisher', name: 'Fire Extinguisher', icon: '🔴', category: 'Safety', intervalDays: 365, lastDoneDate: '', notes: '', enabled: true },
  { id: 'life-jackets', name: 'Life Jackets', icon: '🦺', category: 'Safety', intervalDays: 365, lastDoneDate: '', notes: '', enabled: true },
  { id: 'epirb', name: 'EPIRB / Safety Gear', icon: '📡', category: 'Safety', intervalDays: 365, lastDoneDate: '', notes: '', enabled: true },
  { id: 'transmission-fluid', name: 'Transmission Fluid', icon: '⚙️', category: 'Engine', intervalDays: 730, lastDoneDate: '', notes: '', enabled: true },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysDiff(dateStr: string): number {
  if (!dateStr) return Infinity
  const then = new Date(dateStr).getTime()
  const now = new Date().setHours(0, 0, 0, 0)
  return Math.floor((now - then) / 86400000)
}

function getStatus(item: MaintenanceItem): { label: string; color: string; dot: string } {
  if (!item.lastDoneDate) {
    return { label: 'Never done — schedule now', color: '#ef4444', dot: '🔴' }
  }
  const daysSince = daysDiff(item.lastDoneDate)
  const daysUntilDue = item.intervalDays - daysSince
  if (daysUntilDue < 0) {
    return { label: `OVERDUE by ${Math.abs(daysUntilDue)} days`, color: '#ef4444', dot: '🔴' }
  } else if (daysUntilDue <= 30) {
    return { label: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`, color: '#f59e0b', dot: '🟡' }
  } else {
    return { label: `Due in ${daysUntilDue} days`, color: '#22c55e', dot: '🟢' }
  }
}

function isOverdue(item: MaintenanceItem): boolean {
  if (!item.lastDoneDate) return true
  return item.intervalDays - daysDiff(item.lastDoneDate) < 0
}

function loadVesselItems(vesselId: string): MaintenanceItem[] {
  if (typeof window === 'undefined') return DEFAULT_ITEMS
  const key = `boat_buddy_maintenance_${vesselId}`
  const stored = localStorage.getItem(key)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fall through */ }
  }
  return DEFAULT_ITEMS.map(i => ({ ...i }))
}

function saveVesselItems(vesselId: string, items: MaintenanceItem[]) {
  localStorage.setItem(`boat_buddy_maintenance_${vesselId}`, JSON.stringify(items))
}

function loadVesselHours(vessel: VesselProfile): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem(`bb_engine_hours_${vessel.id}`)
  if (stored !== null) return stored
  return vessel.engineHours || ''
}

function getVesselOverdueCount(vesselId: string): number {
  const items = loadVesselItems(vesselId)
  return items.filter(i => i.enabled && isOverdue(i)).length
}

export default function MaintenancePage() {
  const [vessels, setVessels] = useState<VesselProfile[]>([])
  const [selectedVesselId, setSelectedVesselId] = useState<string>('')
  const [items, setItems] = useState<MaintenanceItem[]>([])
  const [engineHours, setEngineHours] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MaintenanceItem>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<MaintenanceItem>>({ icon: '🔧', intervalDays: 365, notes: '', enabled: true, custom: true })
  const [mounted, setMounted] = useState(false)

  // Load vessels on mount
  useEffect(() => {
    setMounted(true)
    const raw = localStorage.getItem('boat_buddy_vessels')
    let vs: VesselProfile[] = []
    if (raw) {
      try { vs = JSON.parse(raw) } catch { /* ignore */ }
    }
    setVessels(vs)

    if (vs.length > 0) {
      const remembered = localStorage.getItem('bb_maint_selected_vessel')
      const initial = (remembered && vs.find(v => v.id === remembered)) ? remembered : vs[0].id
      setSelectedVesselId(initial)
      setItems(loadVesselItems(initial))
      const firstVessel = vs.find(v => v.id === initial) || vs[0]
      setEngineHours(loadVesselHours(firstVessel))
    }
  }, [])

  // When vessel selection changes, reload data
  function selectVessel(vesselId: string) {
    setSelectedVesselId(vesselId)
    localStorage.setItem('bb_maint_selected_vessel', vesselId)
    setItems(loadVesselItems(vesselId))
    setEditingId(null)
    setEditForm({})
    setShowAddForm(false)
    const v = vessels.find(v => v.id === vesselId)
    if (v) setEngineHours(loadVesselHours(v))
  }

  function saveItems(updated: MaintenanceItem[]) {
    setItems(updated)
    if (selectedVesselId) saveVesselItems(selectedVesselId, updated)
  }

  function markDone(id: string) {
    const updated = items.map(item =>
      item.id === id ? { ...item, lastDoneDate: todayStr(), lastDoneHours: engineHours ? parseFloat(engineHours) : item.lastDoneHours } : item
    )
    saveItems(updated)
  }

  function saveEdit(id: string) {
    const updated = items.map(item =>
      item.id === id ? { ...item, ...editForm } : item
    )
    saveItems(updated)
    setEditingId(null)
    setEditForm({})
  }

  function addCustomItem() {
    if (!newItem.name) return
    const item: MaintenanceItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name || '',
      icon: newItem.icon || '🔧',
      category: newItem.category || 'Custom',
      intervalDays: newItem.intervalDays || 365,
      lastDoneDate: newItem.lastDoneDate || '',
      notes: newItem.notes || '',
      enabled: true,
      custom: true,
    }
    saveItems([...items, item])
    setNewItem({ icon: '🔧', intervalDays: 365, notes: '', enabled: true, custom: true })
    setShowAddForm(false)
  }

  function removeItem(id: string) {
    saveItems(items.filter(i => i.id !== id))
  }

  function saveHours(val: string) {
    setEngineHours(val)
    if (selectedVesselId) localStorage.setItem(`bb_engine_hours_${selectedVesselId}`, val)
  }

  if (!mounted) return null

  const selectedVessel = vessels.find(v => v.id === selectedVesselId)
  const overdueCount = items.filter(i => i.enabled && isOverdue(i)).length
  const categories = Array.from(new Set(items.map(i => i.category)))

  // No vessels at all
  if (vessels.length === 0) {
    return (
      <div className="bg-wood min-h-screen pb-24">
        <div style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)', padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" style={{ color: 'rgba(245,240,232,0.6)', textDecoration: 'none', fontSize: 20 }}>←</Link>
            <h1 style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: 20, margin: 0 }}>🔔 Maintenance</h1>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(245,240,232,0.6)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚓</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#F5F0E8', marginBottom: 8 }}>No vessel profiles found.</p>
          <p style={{ fontSize: 13, marginBottom: 24 }}>Set up a vessel to track maintenance per boat.</p>
          <Link href="/vessel" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: 15, textDecoration: 'underline' }}>
            Set up a vessel →
          </Link>
        </div>
        <NavBar />
      </div>
    )
  }

  return (
    <div className="bg-wood min-h-screen pb-24">
      {/* Header */}
      <div style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)', padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{ color: 'rgba(245,240,232,0.6)', textDecoration: 'none', fontSize: 20 }}>←</Link>
          <div>
            <h1 style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: 20, margin: 0 }}>
              🔔 Maintenance{selectedVessel ? ` — ${selectedVessel.name}` : ''}
            </h1>
            {overdueCount > 0 && (
              <p style={{ color: '#ef4444', fontSize: 12, margin: '2px 0 0' }}>
                {overdueCount} item{overdueCount !== 1 ? 's' : ''} overdue
              </p>
            )}
          </div>
          {overdueCount > 0 && (
            <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
              {overdueCount}
            </span>
          )}
        </div>

        {/* Fleet Summary — only if multiple vessels */}
        {vessels.length > 1 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {vessels.map(v => {
              const oc = getVesselOverdueCount(v.id)
              const isSelected = v.id === selectedVesselId
              return (
                <button
                  key={v.id}
                  onClick={() => selectVessel(v.id)}
                  style={{
                    background: isSelected ? 'rgba(198,139,58,0.25)' : 'rgba(255,255,255,0.05)',
                    border: isSelected ? '1px solid rgba(198,139,58,0.7)' : '1px solid rgba(198,139,58,0.2)',
                    borderRadius: 20,
                    color: isSelected ? '#C68B3A' : 'rgba(245,240,232,0.6)',
                    padding: '4px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {v.name}
                  {oc > 0 ? (
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴{oc}</span>
                  ) : (
                    <span>🟢</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Vessel selector dropdown — always shown when vessels exist */}
        {vessels.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <select
              value={selectedVesselId}
              onChange={e => selectVessel(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(198,139,58,0.3)',
                borderRadius: 8,
                color: '#F5F0E8',
                padding: '6px 12px',
                fontSize: 14,
                width: '100%',
                fontFamily: 'Georgia, serif',
              }}
            >
              {vessels.map(v => (
                <option key={v.id} value={v.id} style={{ background: '#1a0a02' }}>
                  {v.name}{v.year ? ` (${v.year})` : ''}{v.make ? ` — ${v.make}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Add vessel shortcut */}
        <div style={{ marginTop: 6, textAlign: 'right' }}>
          <Link href="/vessel" style={{ color: '#C68B3A', fontSize: 12, fontFamily: 'Georgia, serif', opacity: 0.8 }}>
            + Add / Manage Vessels →
          </Link>
        </div>

        {/* Engine Hours */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(198,139,58,0.08)', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ color: '#C68B3A', fontSize: 16 }}>⚙️</span>
          <label style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>Engine Hours:</label>
          <input
            type="number"
            value={engineHours}
            onChange={e => saveHours(e.target.value)}
            placeholder="0"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(198,139,58,0.3)',
              borderRadius: 6,
              color: '#F5F0E8',
              padding: '4px 8px',
              width: 90,
              fontSize: 14,
            }}
          />
          <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: 12 }}>hrs</span>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Add Custom Item */}
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ width: '100%', marginBottom: 16 }}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Custom Item'}
        </button>

        {showAddForm && (
          <div className="panel" style={{ marginBottom: 16, padding: 16 }}>
            <h3 style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', marginTop: 0 }}>New Maintenance Item</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                placeholder="Name (required)"
                value={newItem.name || ''}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Icon emoji"
                  value={newItem.icon || ''}
                  onChange={e => setNewItem({ ...newItem, icon: e.target.value })}
                  style={{ ...inputStyle, width: 70 }}
                />
                <input
                  placeholder="Category"
                  value={newItem.category || ''}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>Every</label>
                <input
                  type="number"
                  value={newItem.intervalDays || ''}
                  onChange={e => setNewItem({ ...newItem, intervalDays: parseInt(e.target.value) || 365 })}
                  style={{ ...inputStyle, width: 80 }}
                />
                <label style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>days</label>
              </div>
              <input
                placeholder="Notes (optional)"
                value={newItem.notes || ''}
                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                style={inputStyle}
              />
              <button className="btn-primary" onClick={addCustomItem}>Add Item</button>
            </div>
          </div>
        )}

        {/* Items by Category */}
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat && i.enabled)
          if (catItems.length === 0) return null
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <h2 style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, opacity: 0.8 }}>
                {cat}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {catItems.map(item => {
                  const status = getStatus(item)
                  const isEdit = editingId === item.id
                  return (
                    <div key={item.id} className="panel" style={{ padding: 14 }}>
                      {isEdit ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={editForm.icon || item.icon}
                              onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                              style={{ ...inputStyle, width: 60 }}
                              placeholder="Icon"
                            />
                            <input
                              value={editForm.name !== undefined ? editForm.name : item.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              style={{ ...inputStyle, flex: 1 }}
                              placeholder="Name"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>Every</label>
                            <input
                              type="number"
                              value={editForm.intervalDays !== undefined ? editForm.intervalDays : item.intervalDays}
                              onChange={e => setEditForm({ ...editForm, intervalDays: parseInt(e.target.value) })}
                              style={{ ...inputStyle, width: 80 }}
                            />
                            <label style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>days</label>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>Last done:</label>
                            <input
                              type="date"
                              value={editForm.lastDoneDate !== undefined ? editForm.lastDoneDate : item.lastDoneDate}
                              onChange={e => setEditForm({ ...editForm, lastDoneDate: e.target.value })}
                              style={{ ...inputStyle, flex: 1 }}
                            />
                          </div>
                          <input
                            placeholder="Notes"
                            value={editForm.notes !== undefined ? editForm.notes : item.notes}
                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                            style={inputStyle}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-primary" onClick={() => saveEdit(item.id)} style={{ flex: 1 }}>Save</button>
                            <button onClick={() => { setEditingId(null); setEditForm({}) }} style={{ ...secondaryBtnStyle, flex: 1 }}>Cancel</button>
                          </div>
                          {item.custom && (
                            <button onClick={() => removeItem(item.id)} style={{ ...dangerBtnStyle, width: '100%' }}>Remove Item</button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24 }}>{item.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 600 }}>{item.name}</span>
                                <span>{status.dot}</span>
                              </div>
                              <div style={{ color: status.color, fontSize: 12, marginTop: 2 }}>{status.label}</div>
                              {item.lastDoneDate && (
                                <div style={{ color: 'rgba(245,240,232,0.4)', fontSize: 11, marginTop: 2 }}>
                                  Last done: {item.lastDoneDate} · Every {item.intervalDays}d
                                  {item.intervalHours ? ` / ${item.intervalHours}h` : ''}
                                </div>
                              )}
                              {item.notes && <div style={{ color: 'rgba(245,240,232,0.5)', fontSize: 11, marginTop: 2 }}>{item.notes}</div>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              className="btn-primary"
                              onClick={() => markDone(item.id)}
                              style={{ flex: 1, fontSize: 13, padding: '8px 0' }}
                            >
                              ✓ Mark Done
                            </button>
                            <button
                              onClick={() => { setEditingId(item.id); setEditForm({}) }}
                              style={{ ...secondaryBtnStyle, flex: 1, fontSize: 13, padding: '8px 0' }}
                            >
                              ✎ Edit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(245,240,232,0.5)', marginTop: 60 }}>
            <div style={{ fontSize: 48 }}>🔔</div>
            <p>No maintenance items yet.</p>
            <p style={{ fontSize: 13 }}>Add a custom item to get started.</p>
          </div>
        )}
      </div>

      <NavBar />
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(198,139,58,0.3)',
  borderRadius: 8,
  color: '#F5F0E8',
  padding: '8px 12px',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
}

const secondaryBtnStyle: React.CSSProperties = {
  background: 'rgba(198,139,58,0.12)',
  border: '1px solid rgba(198,139,58,0.4)',
  borderRadius: 8,
  color: '#C68B3A',
  padding: '8px 12px',
  cursor: 'pointer',
  fontFamily: 'Georgia, serif',
  fontSize: 14,
}

const dangerBtnStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: 8,
  color: '#ef4444',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 13,
}
