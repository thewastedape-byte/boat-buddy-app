'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { isLoggedIn, getAuth, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
const LOW_STOCK_THRESHOLD = 3

interface Part {
  id: string
  name: string
  part_number?: string
  barcode?: string
  supplier?: string
  qty: number
  min_qty?: number
  unit_price?: number
  location?: string
  user_id?: string
}

const EMPTY_PART: Omit<Part, 'id'> = { name: '', part_number: '', barcode: '', supplier: '', qty: 0, min_qty: 1, unit_price: 0, location: '' }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2) }

export default function InventoryPage() {
  const router = useRouter()
  const auth = getAuth()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Part | null>(null)
  const [form, setForm] = useState<Omit<Part, 'id'>>(EMPTY_PART)
  const [showScanner, setShowScanner] = useState(false)
  const [scanMode, setScanMode] = useState<'lookup' | 'add-field'>('lookup')
  const [scanResult, setScanResult] = useState<{part: Part | null; code: string} | null>(null)
  const [scanQty, setScanQty] = useState(1)
  const [scanAction, setScanAction] = useState<'in' | 'out'>('in')
  const [toast, setToast] = useState('')

  // Bluetooth/USB scanner: listen for rapid keyboard input ending in Enter
  const scanBuffer = useRef('')
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleBTScan = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (showForm || showScanner) return

    if (e.key === 'Enter') {
      const code = scanBuffer.current.trim()
      scanBuffer.current = ''
      if (code.length >= 4) handleScannedCode(code)
    } else if (e.key.length === 1) {
      scanBuffer.current += e.key
      if (scanTimer.current) clearTimeout(scanTimer.current)
      scanTimer.current = setTimeout(() => { scanBuffer.current = '' }, 100)
    }
  }, [showForm, showScanner, parts])

  useEffect(() => {
    window.addEventListener('keydown', handleBTScan)
    return () => window.removeEventListener('keydown', handleBTScan)
  }, [handleBTScan])

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    loadParts()
  }, [router])

  const loadParts = async () => {
    setLoading(true)
    try {
      const email = auth?.email || ''
      const r = await fetch(`${API_URL}/api/db/parts?user_email=${encodeURIComponent(email)}`)
      if (r.ok) {
        const data = await r.json()
        setParts(data)
      }
    } catch {
      // Fall back to localStorage
      const raw = localStorage.getItem(userKey('bb_inventory'))
      if (raw) setParts(JSON.parse(raw))
    } finally { setLoading(false) }
  }

  const saveParts = (updated: Part[]) => {
    setParts(updated)
    localStorage.setItem(userKey('bb_inventory'), JSON.stringify(updated))
  }

  const handleScannedCode = (code: string) => {
    const found = parts.find(p => p.barcode === code || p.part_number === code)
    setScanResult({ part: found || null, code })
    setScanQty(1)
    setScanAction('out') // Default to scan-out (pulling for a job)
  }

  const confirmScan = async () => {
    if (!scanResult) return
    if (scanResult.part) {
      // Update existing part qty
      const newQty = scanAction === 'in'
        ? scanResult.part.qty + scanQty
        : Math.max(0, scanResult.part.qty - scanQty)
      await updatePartQty(scanResult.part.id, newQty)
      showToast(`${scanAction === 'in' ? '📥 Stocked in' : '📤 Pulled out'}: ${scanResult.part.name} × ${scanQty}`)
      // If scan-out, offer to add to work order
      if (scanAction === 'out') {
        addToActiveWorkOrder(scanResult.part, scanQty)
      }
    } else {
      // New part — open form pre-filled with barcode
      setForm({ ...EMPTY_PART, barcode: scanResult.code })
      setEditing(null)
      setShowForm(true)
    }
    setScanResult(null)
  }

  const addToActiveWorkOrder = (part: Part, qty: number) => {
    try {
      const existing = JSON.parse(localStorage.getItem(userKey('bb_workorder_parts')) || '[]')
      const newPart = { description: part.name, part_number: part.part_number || '', qty, unit_price: part.unit_price || 0 }
      localStorage.setItem(userKey('bb_workorder_parts'), JSON.stringify([...existing, newPart]))
      showToast(`✅ Added to Work Order: ${part.name}`)
    } catch {}
  }

  const updatePartQty = async (id: string, newQty: number) => {
    const updated = parts.map(p => p.id === id ? { ...p, qty: newQty } : p)
    saveParts(updated)
    try {
      const part = updated.find(p => p.id === id)
      await fetch(`${API_URL}/api/db/parts/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...part, qty: newQty })
      })
    } catch {}
  }

  const savePart = async () => {
    const email = auth?.email || ''
    const payload = { ...form, user_id: email }
    try {
      if (editing?.id) {
        const r = await fetch(`${API_URL}/api/db/parts/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (r.ok) {
          const d = await r.json()
          saveParts(parts.map(p => p.id === d.id ? d : p))
        } else {
          saveParts(parts.map(p => p.id === editing.id ? { id: editing.id, ...form } : p))
        }
      } else {
        const r = await fetch(`${API_URL}/api/db/parts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (r.ok) {
          const d = await r.json()
          saveParts([d, ...parts])
        } else {
          saveParts([{ id: generateId(), ...form }, ...parts])
        }
      }
    } catch {
      if (editing?.id) {
        saveParts(parts.map(p => p.id === editing.id ? { id: editing.id, ...form } : p))
      } else {
        saveParts([{ id: generateId(), ...form }, ...parts])
      }
    }
    setShowForm(false); setEditing(null); setForm(EMPTY_PART)
    showToast('✅ Part saved')
  }

  const deletePart = async (id: string) => {
    if (!confirm('Delete this part?')) return
    try { await fetch(`${API_URL}/api/db/parts/${id}`, { method: 'DELETE' }) } catch {}
    saveParts(parts.filter(p => p.id !== id))
  }

  const setField = (k: keyof typeof EMPTY_PART, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const lowStock = parts.filter(p => p.qty <= (p.min_qty ?? LOW_STOCK_THRESHOLD))
  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.part_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').includes(search) ||
    (p.supplier || '').toLowerCase().includes(search.toLowerCase())
  )

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      {/* Camera scanner overlay */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => { setShowScanner(false); handleScannedCode(code) }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan result modal */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-t-2xl p-5" style={{ background: '#1a0a02', border: '1px solid rgba(198,139,58,0.4)' }}>
            {scanResult.part ? (
              <>
                <p className="text-xs mb-1" style={dimStyle}>Part found:</p>
                <p className="text-lg font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{scanResult.part.name}</p>
                <p className="text-xs mb-3" style={dimStyle}>
                  {scanResult.part.part_number && `# ${scanResult.part.part_number} · `}
                  Current stock: <strong style={{ color: scanResult.part.qty <= 0 ? '#e87070' : '#70c070' }}>{scanResult.part.qty}</strong>
                </p>

                <div className="flex gap-2 mb-3">
                  {(['out', 'in'] as const).map(a => (
                    <button key={a} onClick={() => setScanAction(a)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold"
                      style={{ background: scanAction === a ? '#C68B3A' : 'rgba(198,139,58,0.1)', color: scanAction === a ? '#3D1C02' : '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
                      {a === 'out' ? '📤 Scan Out (Job)' : '📥 Scan In (Stock)'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <p className="text-sm" style={labelStyle}>Qty:</p>
                  <button onClick={() => setScanQty(q => Math.max(1, q - 1))}
                    style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', borderRadius: '8px', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer' }}>−</button>
                  <span className="text-xl font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', minWidth: '32px', textAlign: 'center' }}>{scanQty}</span>
                  <button onClick={() => setScanQty(q => q + 1)}
                    style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', borderRadius: '8px', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer' }}>+</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm mb-1" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>Part not found</p>
                <p className="text-xs mb-3" style={dimStyle}>Barcode: <code style={{ color: '#C68B3A' }}>{scanResult.code}</code></p>
                <p className="text-xs mb-4" style={dimStyle}>Add this as a new part?</p>
              </>
            )}

            <div className="flex gap-2">
              <button onClick={confirmScan} className="btn-primary flex-1" style={{ fontSize: '14px', padding: '12px' }}>
                {scanResult.part ? (scanAction === 'out' ? '📤 Confirm Pull' : '📥 Confirm Stock') : '➕ Add New Part'}
              </button>
              <button onClick={() => setScanResult(null)}
                className="py-3 px-4 rounded-lg text-sm"
                style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 flex justify-center z-50 px-4">
          <div className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(20,8,2,0.97)', color: '#F5F0E8', border: '1px solid rgba(198,139,58,0.5)', fontFamily: 'Georgia, serif' }}>
            {toast}
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <div className="flex gap-2">
          <button onClick={() => setShowScanner(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-bold"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
            📷 Scan
          </button>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_PART) }}
            className="text-xs px-3 py-1.5 rounded-lg font-bold"
            style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer' }}>
            + Add Part
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>📦 Parts Inventory</h1>
        <p className="text-xs mb-2" style={dimStyle}>{parts.length} parts · {lowStock.length} low stock</p>

        {/* Scanner hint */}
        <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(198,139,58,0.08)', color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif', border: '1px solid rgba(198,139,58,0.15)' }}>
          📷 Tap Scan for camera · 🔌 Bluetooth scanners work automatically — just scan anywhere on this page
        </p>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(232,112,112,0.1)', border: '1px solid rgba(232,112,112,0.3)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>⚠️ Low Stock ({lowStock.length})</p>
            {lowStock.map(p => (
              <p key={p.id} className="text-xs" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
                {p.name} — {p.qty} left
              </p>
            ))}
          </div>
        )}

        <input className="input-field mb-4" placeholder="Search name, part #, barcode, supplier..."
          value={search} onChange={e => setSearch(e.target.value)} />

        {/* Add/Edit form */}
        {showForm && (
          <div className="panel p-4 mb-4">
            <h2 className="text-sm font-bold mb-3" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
              {editing ? 'Edit Part' : 'Add Part'}
            </h2>
            <div className="flex flex-col gap-3">
              <div><label className="block text-xs mb-1" style={labelStyle}>Part Name *</label>
                <input className="input-field" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Impeller Kit, Oil Filter, etc." /></div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs mb-1" style={labelStyle}>Part Number</label>
                  <input className="input-field" value={form.part_number || ''} onChange={e => setField('part_number', e.target.value)} placeholder="MFG-12345" /></div>
                <div>
                  <label className="block text-xs mb-1" style={labelStyle}>Barcode / UPC</label>
                  <div className="flex gap-1">
                    <input className="input-field flex-1" value={form.barcode || ''} onChange={e => setField('barcode', e.target.value)} placeholder="Scan or type" />
                    <button onClick={() => { setScanMode('add-field'); setShowScanner(true) }}
                      style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', borderRadius: '8px', padding: '0 8px', fontSize: '16px', cursor: 'pointer' }}>
                      📷
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs mb-1" style={labelStyle}>Quantity in Stock</label>
                  <input type="number" className="input-field" value={form.qty} onChange={e => setField('qty', parseInt(e.target.value) || 0)} /></div>
                <div><label className="block text-xs mb-1" style={labelStyle}>Min Qty (Low Stock Alert)</label>
                  <input type="number" className="input-field" value={form.min_qty || 1} onChange={e => setField('min_qty', parseInt(e.target.value) || 1)} /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs mb-1" style={labelStyle}>Unit Price ($)</label>
                  <input type="number" step="0.01" className="input-field" value={form.unit_price || ''} onChange={e => setField('unit_price', parseFloat(e.target.value) || 0)} placeholder="0.00" /></div>
                <div><label className="block text-xs mb-1" style={labelStyle}>Supplier</label>
                  <input className="input-field" value={form.supplier || ''} onChange={e => setField('supplier', e.target.value)} placeholder="West Marine, etc." /></div>
              </div>

              <div><label className="block text-xs mb-1" style={labelStyle}>Storage Location</label>
                <input className="input-field" value={form.location || ''} onChange={e => setField('location', e.target.value)} placeholder="Bin A3, Shelf 2, etc." /></div>

              <div className="flex gap-2">
                <button onClick={savePart} className="btn-primary flex-1" style={{ fontSize: '14px', padding: '10px' }}>💾 Save</button>
                <button onClick={() => { setShowForm(false); setEditing(null) }}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Parts list */}
        {loading ? <p className="text-center py-8 text-sm" style={dimStyle}>Loading...</p> :
          filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm" style={dimStyle}>{search ? 'No parts match your search.' : 'No parts yet. Add one or scan a barcode.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(part => {
                const isLow = part.qty <= (part.min_qty ?? LOW_STOCK_THRESHOLD)
                return (
                  <div key={part.id} className="panel p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{part.name}</p>
                          {isLow && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(232,112,112,0.2)', color: '#e87070', border: '1px solid rgba(232,112,112,0.3)' }}>Low Stock</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {part.part_number && <p className="text-xs" style={dimStyle}>#{part.part_number}</p>}
                          {part.barcode && <p className="text-xs" style={dimStyle}>UPC: {part.barcode}</p>}
                          {part.supplier && <p className="text-xs" style={dimStyle}>{part.supplier}</p>}
                          {part.location && <p className="text-xs" style={dimStyle}>📍{part.location}</p>}
                          {part.unit_price ? <p className="text-xs" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>${part.unit_price.toFixed(2)}</p> : null}
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => updatePartQty(part.id, Math.max(0, part.qty - 1))}
                          style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.25)', borderRadius: '6px', width: '28px', height: '28px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span className="text-sm font-bold w-8 text-center" style={{ color: isLow ? '#e87070' : '#F5F0E8', fontFamily: 'Georgia, serif' }}>{part.qty}</span>
                        <button onClick={() => updatePartQty(part.id, part.qty + 1)}
                          style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.25)', borderRadius: '6px', width: '28px', height: '28px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => { setEditing(part); setForm({ name: part.name, part_number: part.part_number || '', barcode: part.barcode || '', supplier: part.supplier || '', qty: part.qty, min_qty: part.min_qty ?? 1, unit_price: part.unit_price || 0, location: part.location || '' }); setShowForm(true) }}
                          style={{ background: 'rgba(198,139,58,0.1)', color: 'rgba(198,139,58,0.7)', border: '1px solid rgba(198,139,58,0.2)', borderRadius: '6px', padding: '3px 7px', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => deletePart(part.id)}
                          style={{ background: 'rgba(139,26,26,0.1)', color: 'rgba(245,240,232,0.3)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '6px', padding: '3px 7px', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </main>
      <NavBar />
    </div>
  )
}
