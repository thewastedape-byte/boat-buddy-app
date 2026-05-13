'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const YARD_SPOTS_KEY = 'bb_yard_spots'
const YARD_CONFIG_KEY = 'bb_yard_config'

type SpotStatus = 'available' | 'occupied' | 'reserved'

interface YardSpot {
  id: string
  row: number
  col: number
  label: string
  vesselName: string
  ownerName: string
  notes: string
  status: SpotStatus
}

interface YardConfig {
  rows: number
  cols: number
}

function generateLabel(row: number, col: number): string {
  const rowLetter = String.fromCharCode(65 + row) // A, B, C...
  return `${rowLetter}${col + 1}`
}

function loadSpots(): YardSpot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(YARD_SPOTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSpots(spots: YardSpot[]) {
  localStorage.setItem(YARD_SPOTS_KEY, JSON.stringify(spots))
}

function loadConfig(): YardConfig {
  if (typeof window === 'undefined') return { rows: 10, cols: 10 }
  try {
    const raw = localStorage.getItem(YARD_CONFIG_KEY)
    return raw ? JSON.parse(raw) : { rows: 10, cols: 10 }
  } catch { return { rows: 10, cols: 10 } }
}

function saveConfig(config: YardConfig) {
  localStorage.setItem(YARD_CONFIG_KEY, JSON.stringify(config))
}

const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
const headStyle = { color: '#F5F0E8', fontFamily: 'Georgia, serif' }
const goldStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

export default function YardPage() {
  const router = useRouter()
  const auth = getAuth()
  const sub = auth?.subscription || 'sailor'
  const hasAccess = sub === 'captain' || sub === 'admiral'

  const [spots, setSpots] = useState<YardSpot[]>([])
  const [config, setConfig] = useState<YardConfig>({ rows: 10, cols: 10 })
  const [selectedSpot, setSelectedSpot] = useState<YardSpot | null>(null)
  const [showEditLayout, setShowEditLayout] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [draftConfig, setDraftConfig] = useState<YardConfig>({ rows: 10, cols: 10 })
  const [form, setForm] = useState({ vesselName: '', ownerName: '', notes: '', status: 'available' as SpotStatus })

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const c = loadConfig()
    setConfig(c)
    setDraftConfig(c)
    setSpots(loadSpots())
  }, [router])

  const getSpot = useCallback((row: number, col: number): YardSpot => {
    const found = spots.find(s => s.row === row && s.col === col)
    if (found) return found
    return {
      id: `${row}-${col}`,
      row,
      col,
      label: generateLabel(row, col),
      vesselName: '',
      ownerName: '',
      notes: '',
      status: 'available',
    }
  }, [spots])

  const openSpot = (row: number, col: number) => {
    const spot = getSpot(row, col)
    setSelectedSpot(spot)
    setForm({
      vesselName: spot.vesselName,
      ownerName: spot.ownerName,
      notes: spot.notes,
      status: spot.status,
    })
  }

  const saveSpot = () => {
    if (!selectedSpot) return
    const updated: YardSpot = {
      ...selectedSpot,
      vesselName: form.vesselName,
      ownerName: form.ownerName,
      notes: form.notes,
      status: form.status,
    }
    const newSpots = spots.filter(s => !(s.row === updated.row && s.col === updated.col))
    newSpots.push(updated)
    setSpots(newSpots)
    saveSpots(newSpots)
    setSelectedSpot(null)
  }

  const clearAll = () => {
    setSpots([])
    saveSpots([])
    setShowClearConfirm(false)
  }

  const applyLayout = () => {
    setConfig(draftConfig)
    saveConfig(draftConfig)
    // Remove spots outside new bounds
    const trimmed = spots.filter(s => s.row < draftConfig.rows && s.col < draftConfig.cols)
    setSpots(trimmed)
    saveSpots(trimmed)
    setShowEditLayout(false)
  }

  const spotColor = (spot: YardSpot): string => {
    if (spot.status === 'occupied') return '#4A90E2'
    if (spot.status === 'reserved') return 'rgba(198,139,58,0.5)'
    return 'rgba(20,40,80,0.8)'
  }

  const spotBorder = (spot: YardSpot): string => {
    if (spot.status === 'occupied') return '#4A90E2'
    if (spot.status === 'reserved') return '#C68B3A'
    return 'rgba(74,144,226,0.25)'
  }

  const occupiedCount = spots.filter(s => s.status === 'occupied').length
  const reservedCount = spots.filter(s => s.status === 'reserved').length
  const totalSlips = config.rows * config.cols

  // ── Locked / upgrade view ──
  if (!hasAccess) {
    return (
      <div className="bg-wood min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
          <Logo size="sm" />
          <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
            ⚓ Yard Manager
          </span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pb-28 text-center">
          {/* Blurred yard preview */}
          <div className="relative w-full max-w-sm mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(198,139,58,0.3)' }}>
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none', background: 'rgba(10,20,40,0.9)', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '3px' }}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} style={{
                    height: '28px', borderRadius: '4px',
                    background: i % 5 === 0 ? '#4A90E2' : i % 7 === 0 ? 'rgba(198,139,58,0.5)' : 'rgba(20,40,80,0.8)',
                    border: '1px solid rgba(74,144,226,0.2)'
                  }} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(10,20,40,0.65)' }}>
              <span style={{ fontSize: '2.5rem' }}>🔒</span>
              <p className="text-sm font-bold mt-2" style={headStyle}>Yard Manager Locked</p>
            </div>
          </div>

          <h1 className="text-xl font-bold mb-2" style={{ ...headStyle, fontFamily: 'Georgia, serif' }}>⚓ Yard Manager</h1>
          <p className="text-sm mb-6 max-w-xs leading-relaxed" style={dimStyle}>
            Yard Manager is included with <strong style={goldStyle}>Captain</strong> and <strong style={goldStyle}>Admiral</strong> plans, or available as an add-on for $29/mo
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/upgrade"
              className="text-sm px-5 py-3 rounded-xl text-center font-bold"
              style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⬆️ Upgrade Plan
            </Link>
            <Link href="/yard-addon-checkout"
              className="text-sm px-5 py-3 rounded-xl text-center"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⚓ Add Yard Manager ($29/mo)
            </Link>
          </div>
        </main>
        <NavBar />
      </div>
    )
  }

  // ── Full Yard Manager ──
  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <span className="text-sm font-bold" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>⚓ Yard Manager</span>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 pb-28">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Boat Yard</h1>
          <div className="flex gap-2">
            <button onClick={() => { setDraftConfig(config); setShowEditLayout(true) }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              ✏️ Edit Layout
            </button>
            <button onClick={() => setShowClearConfirm(true)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(232,112,112,0.12)', color: '#e87070', border: '1px solid rgba(232,112,112,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              🗑 Clear All
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-4 text-xs" style={{ color: 'rgba(245,240,232,0.55)', fontFamily: 'Georgia, serif' }}>
          <span>{totalSlips} slips</span>
          <span style={{ color: '#4A90E2' }}>● {occupiedCount} occupied</span>
          <span style={{ color: '#C68B3A' }}>● {reservedCount} reserved</span>
          <span>● {totalSlips - occupiedCount - reservedCount} open</span>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mb-3 text-xs flex-wrap">
          {[
            { color: 'rgba(20,40,80,0.8)', border: 'rgba(74,144,226,0.25)', label: 'Available' },
            { color: '#4A90E2', border: '#4A90E2', label: 'Occupied' },
            { color: 'rgba(198,139,58,0.5)', border: '#C68B3A', label: 'Reserved' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color, border: `1px solid ${item.border}` }} />
              <span style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Yard Grid */}
        <div className="overflow-x-auto rounded-xl" style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.2)', padding: '12px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.cols}, minmax(36px, 1fr))`,
            gap: '4px',
            minWidth: config.cols * 40,
          }}>
            {Array.from({ length: config.rows }).map((_, row) =>
              Array.from({ length: config.cols }).map((_, col) => {
                const spot = getSpot(row, col)
                return (
                  <button
                    key={`${row}-${col}`}
                    onClick={() => openSpot(row, col)}
                    title={`${spot.label}${spot.vesselName ? ` – ${spot.vesselName}` : ''}`}
                    style={{
                      height: '40px',
                      borderRadius: '5px',
                      background: spotColor(spot),
                      border: `1px solid ${spotBorder(spot)}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontFamily: 'Georgia, serif',
                      color: spot.status === 'available' ? 'rgba(74,144,226,0.6)' : '#fff',
                      fontWeight: 'bold',
                      transition: 'transform 0.1s, opacity 0.1s',
                      padding: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {spot.label}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* ── Spot Modal ── */}
      {selectedSpot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelectedSpot(null)}>
          <div className="w-full max-w-lg rounded-t-2xl p-5" style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                Slip {selectedSpot.label}
              </h2>
              <button onClick={() => setSelectedSpot(null)} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Status */}
              <div>
                <label className="text-xs mb-1 block" style={dimStyle}>Status</label>
                <div className="flex gap-2">
                  {(['available', 'occupied', 'reserved'] as SpotStatus[]).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className="text-xs px-3 py-1.5 rounded-lg capitalize flex-1"
                      style={{
                        background: form.status === s
                          ? (s === 'occupied' ? '#4A90E2' : s === 'reserved' ? '#C68B3A' : 'rgba(20,40,80,0.9)')
                          : 'rgba(255,255,255,0.05)',
                        color: form.status === s ? (s === 'available' ? '#4A90E2' : '#fff') : 'rgba(245,240,232,0.4)',
                        border: form.status === s
                          ? (s === 'occupied' ? '1px solid #4A90E2' : s === 'reserved' ? '1px solid #C68B3A' : '1px solid rgba(74,144,226,0.5)')
                          : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontFamily: 'Georgia, serif',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vessel Name */}
              <div>
                <label className="text-xs mb-1 block" style={dimStyle}>Vessel Name</label>
                <input
                  value={form.vesselName}
                  onChange={e => setForm(f => ({ ...f, vesselName: e.target.value }))}
                  placeholder="e.g. Sea Wolf"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(74,144,226,0.25)', color: '#F5F0E8', fontFamily: 'Georgia, serif', outline: 'none' }}
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="text-xs mb-1 block" style={dimStyle}>Owner Name</label>
                <input
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(74,144,226,0.25)', color: '#F5F0E8', fontFamily: 'Georgia, serif', outline: 'none' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs mb-1 block" style={dimStyle}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Storage notes, contact info, dates..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(74,144,226,0.25)', color: '#F5F0E8', fontFamily: 'Georgia, serif', outline: 'none' }}
                />
              </div>

              <button onClick={saveSpot}
                className="w-full py-3 rounded-xl text-sm font-bold mt-1"
                style={{ background: '#4A90E2', color: '#fff', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                Save Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Layout Modal ── */}
      {showEditLayout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowEditLayout(false)}>
          <div className="w-full max-w-lg rounded-t-2xl p-5" style={{ background: '#0d1f3c', border: '1px solid rgba(198,139,58,0.3)', borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Edit Layout</h2>
              <button onClick={() => setShowEditLayout(false)} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs mb-1 block" style={dimStyle}>Rows: {draftConfig.rows}</label>
                <input type="range" min={2} max={20} value={draftConfig.rows}
                  onChange={e => setDraftConfig(d => ({ ...d, rows: Number(e.target.value) }))}
                  className="w-full" style={{ accentColor: '#4A90E2' }} />
                <div className="flex justify-between text-xs mt-0.5" style={dimStyle}><span>2</span><span>20</span></div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={dimStyle}>Columns: {draftConfig.cols}</label>
                <input type="range" min={2} max={20} value={draftConfig.cols}
                  onChange={e => setDraftConfig(d => ({ ...d, cols: Number(e.target.value) }))}
                  className="w-full" style={{ accentColor: '#4A90E2' }} />
                <div className="flex justify-between text-xs mt-0.5" style={dimStyle}><span>2</span><span>20</span></div>
              </div>
              <p className="text-xs" style={{ color: 'rgba(232,112,112,0.8)', fontFamily: 'Georgia, serif' }}>
                ⚠️ Shrinking the grid will remove spots outside the new bounds.
              </p>
              <button onClick={applyLayout}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: '#C68B3A', color: '#3D1C02', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                Apply Layout ({draftConfig.rows} × {draftConfig.cols})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clear Confirm Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0d1f3c', border: '1px solid rgba(232,112,112,0.4)' }}>
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="text-base font-bold mb-2" style={headStyle}>Clear All Spots?</h2>
            <p className="text-xs mb-5 leading-relaxed" style={dimStyle}>This will remove all vessel assignments. The grid layout stays the same.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Cancel
              </button>
              <button onClick={clearAll}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#e87070', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  )
}
