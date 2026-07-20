'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'
import type { VesselProfile } from '../vessel/page'
import type { RepairLogEntry } from '../log/page'

const VESSEL_KEY = 'boat_buddy_vessel'
const REPAIR_LOG_KEY = 'boat_buddy_repair_log'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

interface PartRow { description: string; qty: string; price: string }

interface InventoryPart {
  id: string
  name: string
  part_number?: string
  qty: number
  unit_price?: number
  supplier?: string
  location?: string
  category?: string
}

function PartPickerModal({ onSelect, onClose }: {
  onSelect: (part: InventoryPart) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [parts, setParts] = useState<InventoryPart[]>([])

  useEffect(() => {
    // Load from localStorage first
    try {
      const authRaw = localStorage.getItem('boat_buddy_auth')
      const email = authRaw ? JSON.parse(authRaw)?.email || '' : ''
      const prefix = email ? `${email}:` : ''
      const raw = localStorage.getItem(`${prefix}bb_inventory`)
      if (raw) {
        const local: InventoryPart[] = JSON.parse(raw)
        setParts(local)
      }
    } catch {}
    // Also try API
    try {
      const authRaw = localStorage.getItem('boat_buddy_auth')
      const email = authRaw ? JSON.parse(authRaw)?.email || '' : ''
      if (email) {
        fetch(`${API_URL}/api/db/parts?user_email=${encodeURIComponent(email)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data && Array.isArray(data)) setParts(data) })
          .catch(() => {})
      }
    } catch {}
  }, [])

  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.part_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl flex flex-col" style={{ background: '#1a0a02', border: '1px solid rgba(198,139,58,0.4)', borderBottom: 'none', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: 16, margin: 0 }}>📦 Pick from Inventory</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div className="px-4 pb-2">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search parts, part#, supplier..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(198,139,58,0.3)', background: 'rgba(255,255,255,0.07)', color: '#F5F0E8', fontFamily: 'Georgia, serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-20">
          {filtered.length === 0 && (
            <p style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
              {parts.length === 0 ? 'No parts in inventory yet.' : 'No parts match your search.'}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
            {filtered.map(part => (
              <button
                key={part.id}
                onClick={() => onSelect(part)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(198,139,58,0.2)',
                  borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold', margin: 0 }}>{part.name}</p>
                  <p style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif', fontSize: 11, margin: '2px 0 0' }}>
                    {[part.part_number && `#${part.part_number}`, part.supplier, part.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {part.unit_price ? (
                    <p style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold', margin: 0 }}>${part.unit_price.toFixed(2)}</p>
                  ) : null}
                  <p style={{ color: part.qty <= 0 ? '#e87070' : 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif', fontSize: 11, margin: '1px 0 0' }}>
                    {part.qty} in stock
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryId = searchParams.get('id')

  const [vessel, setVessel] = useState<VesselProfile | null>(null)
  const [allVessels, setAllVessels] = useState<VesselProfile[]>([])
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopLogo, setShopLogo] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [laborNotes, setLaborNotes] = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [laborRate, setLaborRate] = useState('')
  const [techName, setTechName] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [workOrderNum, setWorkOrderNum] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [invoiceFromEmail, setInvoiceFromEmail] = useState('')
  const [invoiceAppPw, setInvoiceAppPw] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showPartPicker, setShowPartPicker] = useState(false)
  const [pickerTargetRow, setPickerTargetRow] = useState<number | null>(null)
  const [parts, setParts] = useState<PartRow[]>([
    { description: '', qty: '1', price: '' },
    { description: '', qty: '1', price: '' },
    { description: '', qty: '1', price: '' },
  ])

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    // Load business profile
    setInvoiceFromEmail(localStorage.getItem(userKey('bb_invoice_email')) || '')
    setInvoiceAppPw(localStorage.getItem(userKey('bb_invoice_app_pw')) || '')
    setShopName(localStorage.getItem(userKey('bb_biz_name')) || 'Boat Buddy Marine')
    setShopPhone(localStorage.getItem(userKey('bb_biz_phone')) || '')
    setShopAddress(localStorage.getItem(userKey('bb_biz_address')) || '')
    setShopLogo(localStorage.getItem(userKey('bb_biz_logo')) || '')
    try {
      // Load all vessels
      const allRaw = localStorage.getItem(userKey('boat_buddy_vessels'))
      const vessels: VesselProfile[] = allRaw ? JSON.parse(allRaw) : []
      setAllVessels(vessels)
      // Load active vessel
      const vRaw = localStorage.getItem(userKey(VESSEL_KEY))
      if (vRaw) setVessel(JSON.parse(vRaw))
      else if (vessels.length > 0) setVessel(vessels[0])
    } catch {}

    if (entryId) {
      try {
        const logRaw = localStorage.getItem(userKey(REPAIR_LOG_KEY))
        if (logRaw) {
          const log: RepairLogEntry[] = JSON.parse(logRaw)
          const found = log.find(e => e.id === entryId)
          if (found) {
            setProblemDesc(found.symptom)
            if (found.laborHours) setLaborHours(found.laborHours)
            if (found.notes) setLaborNotes(found.notes)
            if (found.parts && found.parts.length > 0) {
              const prefilled = found.parts.map(p => ({ description: p, qty: '1', price: '' }))
              setParts([...prefilled, { description: '', qty: '1', price: '' }, { description: '', qty: '1', price: '' }])
            }
            // Auto-select vessel matching this job
            if (found.vessel_id) {
              const matchedVessel = vessels.find(v => v.id === found.vessel_id)
              if (matchedVessel) setVessel(matchedVessel)
            }
          }
        }
      } catch {}
    }

    const now = new Date()
    setOrderDate(now.toISOString().split('T')[0])
    setWorkOrderNum('WO-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0'))
  }, [router, entryId])

  const updatePart = (i: number, field: keyof PartRow, val: string) => {
    setParts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }
  const addPartRow = () => setParts(prev => [...prev, { description: '', qty: '1', price: '' }])
  const removePartRow = (i: number) => setParts(prev => prev.filter((_, idx) => idx !== i))

  const openPicker = (rowIndex?: number) => {
    if (rowIndex !== undefined) {
      setPickerTargetRow(rowIndex)
    } else {
      // Find first empty row or append
      const emptyIdx = parts.findIndex(p => !p.description.trim())
      setPickerTargetRow(emptyIdx >= 0 ? emptyIdx : parts.length)
    }
    setShowPartPicker(true)
  }

  const handlePickPart = (part: InventoryPart) => {
    setShowPartPicker(false)
    const targetIdx = pickerTargetRow ?? parts.findIndex(p => !p.description.trim())
    const row: PartRow = {
      description: part.name + (part.part_number ? ` [${part.part_number}]` : ''),
      qty: '1',
      price: part.unit_price ? part.unit_price.toFixed(2) : '',
    }
    // Fill the target row, or append if needed
    if (targetIdx >= 0 && targetIdx < parts.length) {
      setParts(prev => prev.map((p, i) => i === targetIdx ? row : p))
    } else {
      setParts(prev => [...prev, row])
    }
    setPickerTargetRow(null)
    // Deduct 1 from inventory
    try {
      const authRaw = localStorage.getItem('boat_buddy_auth')
      const email = authRaw ? JSON.parse(authRaw)?.email || '' : ''
      const prefix = email ? `${email}:` : ''
      const invKey = `${prefix}bb_inventory`
      const raw = localStorage.getItem(invKey)
      if (raw) {
        const inv: InventoryPart[] = JSON.parse(raw)
        const updated = inv.map(p => p.id === part.id ? { ...p, qty: Math.max(0, p.qty - 1) } : p)
        localStorage.setItem(invKey, JSON.stringify(updated))
      }
      // Also update API
      fetch(`${API_URL}/api/db/parts/${part.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...part, qty: Math.max(0, part.qty - 1) })
      }).catch(() => {})
    } catch {}
  }

  // Calculations
  const partsTotal = parts.reduce((sum, p) => {
    const qty = parseFloat(p.qty) || 0
    const price = parseFloat(p.price) || 0
    return sum + qty * price
  }, 0)
  const laborTotal = (parseFloat(laborHours) || 0) * (parseFloat(laborRate) || 0)
  const grandTotal = partsTotal + laborTotal

  const fmt = (n: number) => n > 0 ? '$' + n.toFixed(2) : '—'

  const iStyle = { background: 'transparent', border: 'none', borderBottom: '1px solid #ccc', borderRadius: 0, color: '#1a1a1a', fontFamily: 'Georgia, serif', fontSize: '13px', padding: '2px 4px', width: '100%', outline: 'none' }
  const thStyle: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#555', borderBottom: '2px solid #333', whiteSpace: 'nowrap' as const }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="no-print flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <Link href="/log" className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
            ← Log
          </Link>
          <button onClick={() => window.print()}
            className="text-xs px-3 py-1.5 rounded-lg font-bold"
            style={{ background: '#C68B3A', color: '#3D1C02', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
            🖨️ Print
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 pb-28">
        <h1 className="no-print text-xl font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
          📄 Work Order / Repair Record
        </h1>

        {/* WHITE PAPER DOCUMENT */}
        <div id="work-order-doc" style={{
          background: '#fff', color: '#1a1a1a', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', padding: '28px 24px',
          maxWidth: '700px', margin: '0 auto 16px', fontFamily: 'Georgia, serif'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '3px solid #1a1a1a' }}>
            {shopLogo
              ? <img src={shopLogo} alt="logo" style={{ height: '60px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              : <div style={{ fontSize: '28px', marginBottom: '4px' }}>⚓</div>
            }
            <input value={shopName} onChange={e => setShopName(e.target.value)}
              style={{ ...iStyle, textAlign: 'center', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px', borderBottom: 'none', width: '100%', maxWidth: '100%' }} />
            <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', marginTop: '2px' }}>WORK ORDER / REPAIR RECORD</div>
            {shopPhone && <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{shopPhone}</div>}
            {shopAddress && <div style={{ fontSize: '10px', color: '#777', marginTop: '1px' }}>{shopAddress}</div>}
            {!shopPhone && !shopAddress && <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>boatbuddy.thewastedape.com</div>}
          </div>

          {/* WO # and Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '4px' }}>Work Order #</div>
              <input value={workOrderNum} onChange={e => setWorkOrderNum(e.target.value)} style={{ ...iStyle, fontSize: '14px', fontWeight: 'bold' }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '4px' }}>Date</div>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={{ ...iStyle }} />
            </div>
          </div>

          {/* Vessel Selector — screen only */}
          {allVessels.length > 1 && (
            <div className="no-print" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '6px', fontWeight: 'bold' }}>Select Vessel</div>
              <select
                value={vessel?.id || ''}
                onChange={e => {
                  const v = allVessels.find(v => v.id === e.target.value)
                  if (v) setVessel(v)
                }}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', fontFamily: 'Georgia, serif', background: '#f9f9f9', color: '#1a1a1a' }}
              >
                {allVessels.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.year} {v.make} {v.model}</option>
                ))}
              </select>
            </div>
          )}

          {/* Vessel Info */}
          <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '6px', padding: '14px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '10px', fontWeight: 'bold' }}>Vessel Information</div>
            {vessel ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '13px' }}>
                {vessel.name && <div><span style={{ color: '#666' }}>Name: </span><strong>{vessel.name}</strong></div>}
                {vessel.type && <div><span style={{ color: '#666' }}>Type: </span>{vessel.type}</div>}
                {vessel.year && <div><span style={{ color: '#666' }}>Year: </span>{vessel.year}</div>}
                {vessel.make && <div><span style={{ color: '#666' }}>Make: </span>{vessel.make}</div>}
                {vessel.model && <div><span style={{ color: '#666' }}>Model: </span>{vessel.model}</div>}
                {vessel.homePort && <div><span style={{ color: '#666' }}>Port: </span>{vessel.homePort}</div>}
                {vessel.engineMake && <div><span style={{ color: '#666' }}>Engine: </span>{vessel.engineMake} {vessel.engineModel}</div>}
                {vessel.engineSerial && <div><span style={{ color: '#666' }}>Serial: </span>{vessel.engineSerial}</div>}
                {vessel.engineHours && <div><span style={{ color: '#666' }}>Hours: </span>{vessel.engineHours}</div>}
                {vessel.documentNumber && <div><span style={{ color: '#666' }}>Doc/HIN: </span>{vessel.documentNumber}</div>}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#888' }}>No vessel profile — <Link href="/vessel" style={{ color: '#C68B3A' }}>set up vessel →</Link></p>
            )}
          </div>

          {/* Problem */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '6px', fontWeight: 'bold' }}>Problem / Symptom</div>
            <textarea value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={3}
              placeholder="Describe the problem or symptom reported..."
              style={{ ...iStyle, resize: 'none', borderBottom: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '8px', width: '100%', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>

          {/* Parts Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>Parts / Materials</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ ...thStyle, width: '50%' }}>Description</th>
                  <th style={{ ...thStyle, width: '12%', textAlign: 'center' }}>Qty</th>
                  <th style={{ ...thStyle, width: '18%', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ ...thStyle, width: '16%', textAlign: 'right' }}>Total</th>
                  <th style={{ ...thStyle, width: '4%' }} className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => {
                  const rowTotal = (parseFloat(p.qty) || 0) * (parseFloat(p.price) || 0)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input value={p.description} onChange={e => updatePart(i, 'description', e.target.value)}
                          placeholder="Part or material name" style={{ ...iStyle }} />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <input value={p.qty} onChange={e => updatePart(i, 'qty', e.target.value)}
                          style={{ ...iStyle, textAlign: 'center', width: '40px' }} />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <input value={p.price} onChange={e => updatePart(i, 'price', e.target.value)}
                          placeholder="0.00" style={{ ...iStyle, textAlign: 'right', width: '70px' }} />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#333' }}>
                        {rowTotal > 0 ? '$' + rowTotal.toFixed(2) : '—'}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }} className="no-print">
                        <button onClick={() => removePartRow(i)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                      </td>
                    </tr>
                  )
                })}
                <tr>
                  <td colSpan={3} style={{ padding: '6px 8px', borderTop: '2px solid #333', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parts Subtotal</td>
                  <td style={{ padding: '6px 8px', borderTop: '2px solid #333', fontWeight: 'bold', textAlign: 'right' }}>{fmt(partsTotal)}</td>
                  <td className="no-print" style={{ borderTop: '2px solid #333' }}></td>
                </tr>
              </tbody>
            </table>
            <div className="no-print flex gap-2" style={{ marginTop: '8px' }}>
              <button onClick={addPartRow}
                style={{ background: 'none', border: '1px dashed #bbb', borderRadius: '4px', color: '#888', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', flex: 1 }}>
                + Add Row
              </button>
              <button onClick={() => openPicker()}
                style={{ background: 'rgba(198,139,58,0.12)', border: '1px solid rgba(198,139,58,0.4)', borderRadius: '4px', color: '#C68B3A', padding: '4px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                📦 Search Inventory
              </button>
            </div>
          </div>

          {/* Labor */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '8px', fontWeight: 'bold' }}>Labor</div>
            <textarea value={laborNotes} onChange={e => setLaborNotes(e.target.value)} rows={3}
              placeholder="Describe work performed..."
              style={{ ...iStyle, resize: 'none', borderBottom: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '8px', width: '100%', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#f5f5f5', borderRadius: '6px', padding: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>Hours</div>
                <input value={laborHours} onChange={e => setLaborHours(e.target.value)} placeholder="0.0" style={{ ...iStyle }} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>Rate ($/hr)</div>
                <input value={laborRate} onChange={e => setLaborRate(e.target.value)} placeholder="0.00" style={{ ...iStyle }} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>Labor Total</div>
                <div style={{ padding: '2px 4px', fontWeight: 'bold', fontSize: '13px' }}>{fmt(laborTotal)}</div>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div style={{ background: '#1a1a1a', color: '#fff', borderRadius: '6px', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>TOTAL DUE</span>
            <span style={{ fontSize: '22px', fontWeight: 'bold' }}>{grandTotal > 0 ? '$' + grandTotal.toFixed(2) : '$___________'}</span>
          </div>

          {/* Technician */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '6px' }}>Technician Name</div>
              <input value={techName} onChange={e => setTechName(e.target.value)} placeholder="Name"
                style={{ ...iStyle }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '6px' }}>Signature</div>
              <div style={{ borderBottom: '1px solid #ccc', height: '28px' }}></div>
            </div>
          </div>

          {/* Customer Auth */}
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
              Customer Authorization: I authorize the above described work to be performed.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Customer Name</div>
                <div style={{ borderBottom: '1px solid #ccc', height: '28px' }}></div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Signature / Date</div>
                <div style={{ borderBottom: '1px solid #ccc', height: '28px' }}></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '12px' }}>
            <p style={{ fontSize: '10px', color: '#aaa' }}>Generated by Boat Buddy by WastedApe — AI-powered marine diagnostics</p>
          </div>
        </div>

        {/* Screen buttons */}
        <div className="no-print flex flex-col gap-3" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="btn-primary flex-1">
              🖨️ Print / Save PDF
            </button>
            <button onClick={() => setShowEmailForm(!showEmailForm)}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: showEmailForm ? 'rgba(139,26,26,0.2)' : 'rgba(198,139,58,0.2)', color: showEmailForm ? 'rgba(245,240,232,0.5)' : '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
              ✉️ Email to Customer
            </button>
          </div>

          {showEmailForm && (
            <div className="p-4 rounded-xl flex flex-col gap-3" style={{ background: 'rgba(198,139,58,0.06)', border: '1px solid rgba(198,139,58,0.2)' }}>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif' }}>Customer Name</label>
                <input className="input-field" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'rgba(198,139,58,0.7)', fontFamily: 'Georgia, serif' }}>Customer Email</label>
                <input type="email" className="input-field" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@example.com" />
              </div>
              <button
                disabled={!customerEmail || emailSending}
                onClick={async () => {
                  setEmailSending(true)
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
                  const partsSubtotal = parts.reduce((sum, p) => sum + (parseFloat(p.qty||'1') * parseFloat(p.price||'0')), 0)
                  const lTotal = laborHours && laborRate ? (parseFloat(laborHours) * parseFloat(laborRate)).toFixed(2) : '0.00'
                  const gTotal = (partsSubtotal + parseFloat(lTotal)).toFixed(2)
                  try {
                    const resp = await fetch(`${API_URL}/api/send-invoice`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        fromEmail: invoiceFromEmail || undefined,
                        appPassword: invoiceAppPw || undefined,
                        to: customerEmail, customerName, shopName, shopPhone, shopAddress,
                        workOrderNum, vessel: vessel ? `${vessel.name} — ${vessel.engine || ''}` : '',
                        problemDesc, parts, laborDesc: laborNotes, laborHours, laborRate,
                        laborTotal: lTotal, partsTotal: partsSubtotal.toFixed(2), grandTotal: gTotal,
                        techName, date: orderDate,
                      })
                    })
                    const data = await resp.json()
                    if (!resp.ok || data.error) { alert('Failed to send email: ' + (data.error || 'Unknown error')); return }
                    setEmailSent(true)
                    setTimeout(() => { setEmailSent(false); setShowEmailForm(false) }, 3000)
                  } catch (err: any) { alert('Send failed: ' + (err?.message || 'Network error')) } finally { setEmailSending(false) }
                }}
                className="btn-primary w-full py-3"
                style={{ opacity: !customerEmail || emailSending ? 0.5 : 1 }}>
                {emailSending ? 'Sending...' : emailSent ? '✓ Sent!' : '📨 Send Invoice Email'}
              </button>
            </div>
          )}

          <Link href="/log" className="text-center py-3 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ← Back to Log
          </Link>
        </div>
        <p className="no-print text-xs text-center mt-3" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
          Tip: Print → Save as PDF or email directly to customer.
        </p>
      </main>
      {showPartPicker && (
        <PartPickerModal
          onSelect={handlePickPart}
          onClose={() => { setShowPartPicker(false); setPickerTargetRow(null) }}
        />
      )}

      <NavBar />
    </div>
  )
}

export default function WorkOrderPage() {
  return (
    <Suspense fallback={
      <div className="bg-wood min-h-screen flex items-center justify-center">
        <p style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Loading...</p>
      </div>
    }>
      <WorkOrderContent />
    </Suspense>
  )
}
