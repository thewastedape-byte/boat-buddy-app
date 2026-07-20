'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth, updateAuthSubscription, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

// ── Storage keys ──
const SLIPS_KEY = 'bb_marina_slips'
const RENTALS_KEY = 'bb_marina_rentals'
const TRANSIENT_KEY = 'bb_marina_transient'
const WAITLIST_KEY = 'bb_marina_waitlist'
const DOCKS_KEY = 'bb_marina_docks'

// ── Types ──
type SlipStatus = 'available' | 'rented' | 'reserved' | 'maintenance'
type LeaseType = 'monthly' | 'seasonal' | 'annual'
type PaymentStatus = 'paid' | 'due_soon' | 'overdue'
type BookingStatus = 'upcoming' | 'active' | 'checked_out'
type TabType = 'slips' | 'rentals' | 'transient' | 'waitlist'
type PowerType = 'none' | '30amp' | '50amp' | 'double30'
type DiscountCard = 'none' | 'boatus' | 'seatow' | 'towboatus' | 'other'

interface Dock {
  id: string
  name: string
}

interface SlipAmenities {
  amp30: boolean
  amp50: boolean
  water: boolean
  pumpout: boolean
  liveaboard: boolean
}

interface Slip {
  id: string
  name: string
  dock: string
  length: number
  beam: number
  amenities: SlipAmenities
  status: SlipStatus
  rentalId?: string
  notes: string
}

interface Payment {
  date: string
  amount: number
  status: PaymentStatus
}

interface Rental {
  id: string
  slipId: string
  vesselName: string
  ownerName: string
  phone: string
  email: string
  leaseType: LeaseType
  startDate: string
  endDate: string
  monthlyRate: number
  autoRenew: boolean
  notes: string
  payments: Payment[]
}

interface TransientBooking {
  id: string
  slipId: string
  vesselName: string
  captainName: string
  phone: string
  checkin: string
  checkout: string
  nightlyRate: number
  notes: string
  status: BookingStatus
  powerType: PowerType
  loa: number
  beam: number
  waterAtSlip: boolean
  discountCard: DiscountCard
  discountCardNumber: string
}

interface WaitlistEntry {
  id: string
  name: string
  vesselName: string
  phone: string
  email: string
  lengthNeeded: number
  dateAdded: string
  notes: string
  notified: boolean
}

// ── Helpers ──
function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(userKey(key))
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function saveLS(key: string, value: unknown) {
  localStorage.setItem(userKey(key), JSON.stringify(value))
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function diffDays(a: string, b: string) {
  const d1 = new Date(a).getTime()
  const d2 = new Date(b).getTime()
  return Math.max(0, Math.ceil((d2 - d1) / 86400000))
}

function paymentStatusLabel(s: PaymentStatus) {
  if (s === 'paid') return '✅ Paid'
  if (s === 'due_soon') return '⚠️ Due Soon'
  return '🔴 Overdue'
}

function paymentStatusColor(s: PaymentStatus) {
  if (s === 'paid') return '#4caf82'
  if (s === 'due_soon') return '#C68B3A'
  return '#e87070'
}

function bookingStatusColor(s: BookingStatus) {
  if (s === 'active') return '#4A90E2'
  if (s === 'upcoming') return '#C68B3A'
  return 'rgba(245,240,232,0.3)'
}

function slipStatusColor(s: SlipStatus) {
  if (s === 'available') return '#4caf82'
  if (s === 'rented') return '#4A90E2'
  if (s === 'reserved') return '#A855F7'
  return '#e87070'
}

function slipStatusBg(s: SlipStatus) {
  if (s === 'available') return 'rgba(76,175,130,0.18)'
  if (s === 'rented') return 'rgba(74,144,226,0.18)'
  if (s === 'reserved') return 'rgba(168,85,247,0.18)'
  return 'rgba(232,112,112,0.18)'
}

// ── Styles ──
const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
const headStyle = { color: '#F5F0E8', fontFamily: 'Georgia, serif' }
const goldStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(74,144,226,0.25)',
  color: '#F5F0E8',
  fontFamily: 'Georgia, serif',
  outline: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
  width: '100%',
  fontSize: '14px',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { ...dimStyle, fontSize: '11px', display: 'block', marginBottom: '4px' }

// ── Input component ──
function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle} />
    </div>
  )
}

// ── Tab Pill ──
function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        background: active ? '#1B3A5C' : 'rgba(255,255,255,0.82)',
        color: active ? '#fff' : '#1A0A00',
        border: active ? '2px solid #1B3A5C' : '2px solid rgba(26,10,0,0.25)',
        borderRadius: '999px',
        padding: '6px 14px',
        fontSize: '12px',
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}>
      {label}
    </button>
  )
}

// ── Status Badge ──
function StatusBadge({ status, label }: { status: string; label: string }) {
  const color = slipStatusColor(status as SlipStatus)
  const bg = slipStatusBg(status as SlipStatus)
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}40`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
      {label}
    </span>
  )
}

// ── Amenity Badge ──
function AmenityBadge({ label }: { label: string }) {
  return (
    <span style={{ background: 'rgba(74,144,226,0.12)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.3)', borderRadius: '5px', padding: '1px 6px', fontSize: '10px', fontFamily: 'Georgia, serif' }}>
      {label}
    </span>
  )
}

// ── Confirm Modal ──
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0d1f3c', border: '1px solid rgba(232,112,112,0.4)' }}>
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-base font-bold mb-2" style={headStyle}>Are you sure?</h2>
        <p className="text-xs mb-5 leading-relaxed" style={dimStyle}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#e87070', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SLIP GRID CELL
// ─────────────────────────────────────────────────────────
function SlipCell({ slip, occupantName, onClick }: {
  slip: Slip; occupantName?: string; onClick: () => void
}) {
  const bg = slipStatusBg(slip.status)
  const color = slipStatusColor(slip.status)

  return (
    <button onClick={onClick}
      style={{
        background: bg,
        border: `1.5px solid ${color}70`,
        borderRadius: '10px',
        padding: '8px 4px 6px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'calc(25% - 6px)',
        minHeight: '68px',
        gap: '2px',
        flexShrink: 0,
      }}>
      <span style={{ color, fontSize: '13px', fontWeight: 'bold', fontFamily: 'Georgia, serif', lineHeight: 1 }}>{slip.name}</span>
      <span style={{ fontSize: '8px', color, opacity: 0.85, fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {slip.status === 'available' ? 'open' : slip.status === 'rented' ? 'rented' : slip.status === 'reserved' ? 'rsvd' : 'maint'}
      </span>
      {occupantName && (
        <span style={{
          fontSize: '7px', color: 'rgba(245,240,232,0.65)', fontFamily: 'Georgia, serif',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '62px', textAlign: 'center', lineHeight: 1.2,
        }}>
          {occupantName}
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// DOCK MANAGER MODAL
// ─────────────────────────────────────────────────────────
interface DockManagerProps {
  docks: Dock[]
  onAddDock: (dock: Dock, slipCount: number, slipLength: number, slipBeam: number) => void
  onRenameDock: (id: string, newName: string) => void
  onDeleteDock: (id: string) => void
  onClose: () => void
}

function DockManagerModal({ docks, onAddDock, onRenameDock, onDeleteDock, onClose }: DockManagerProps) {
  const [dockName, setDockName] = useState('')
  const [slipCount, setSlipCount] = useState('0')
  const [slipLength, setSlipLength] = useState('30')
  const [slipBeam, setSlipBeam] = useState('12')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingDock, setEditingDock] = useState<{ id: string; name: string } | null>(null)

  const handleAdd = () => {
    if (!dockName.trim()) return
    const newDock: Dock = { id: genId(), name: dockName.trim() }
    onAddDock(newDock, parseInt(slipCount) || 0, parseFloat(slipLength) || 30, parseFloat(slipBeam) || 12)
    setDockName('')
    setSlipCount('0')
  }

  const handleRename = () => {
    if (!editingDock || !editingDock.name.trim()) return
    onRenameDock(editingDock.id, editingDock.name.trim())
    setEditingDock(null)
  }

  const autoSlipName = (dock: string, i: number) => {
    const d = dock.trim()
    if (!d) return `${i}`
    if (d.length === 1 || d.length <= 2) return `${d}${i}`
    return `${d} ${i}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 overflow-y-auto"
        style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none', maxHeight: '88vh', paddingBottom: '80px' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={headStyle}>⚓ Configure Docks</h2>
          <button onClick={onClose} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Existing docks */}
        {docks.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider mb-2" style={goldStyle}>Your Docks</p>
            <div className="flex flex-col gap-2">
              {docks.map(dock => (
                <div key={dock.id}>
                  {editingDock?.id === dock.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        value={editingDock.name}
                        onChange={e => setEditingDock({ ...editingDock, name: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                        autoFocus
                      />
                      <button onClick={handleRename}
                        style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingDock(null)}
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(74,144,226,0.08)', border: '1px solid rgba(74,144,226,0.2)' }}>
                      <span className="text-sm font-bold" style={headStyle}>⚓ Dock {dock.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingDock({ id: dock.id, name: dock.name })}
                          style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                          ✏️ Rename
                        </button>
                        <button onClick={() => setDeleteConfirm(dock.id)}
                          style={{ background: 'rgba(232,112,112,0.12)', color: '#e87070', border: '1px solid rgba(232,112,112,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new dock */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.2)' }}>
          <p className="text-xs uppercase tracking-wider mb-3" style={goldStyle}>Add New Dock</p>
          <div className="flex flex-col gap-3">
            <div>
              <label style={labelStyle}>Dock Name</label>
              <input
                value={dockName}
                onChange={e => setDockName(e.target.value)}
                placeholder="e.g. A, B, North, East, Main..."
                style={inputStyle}
              />
              {dockName && (
                <p className="text-xs mt-1" style={dimStyle}>
                  Slips will be named: {autoSlipName(dockName, 1)}, {autoSlipName(dockName, 2)}, {autoSlipName(dockName, 3)}...
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Auto-generate Slips (0 = create dock only)</label>
              <input
                type="number"
                value={slipCount}
                onChange={e => setSlipCount(e.target.value)}
                placeholder="0"
                style={inputStyle}
                min="0"
                max="100"
              />
            </div>

            {parseInt(slipCount) > 0 && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label style={labelStyle}>Default Length (ft)</label>
                  <input type="number" value={slipLength} onChange={e => setSlipLength(e.target.value)} style={inputStyle} placeholder="30" />
                </div>
                <div className="flex-1">
                  <label style={labelStyle}>Default Beam (ft)</label>
                  <input type="number" value={slipBeam} onChange={e => setSlipBeam(e.target.value)} style={inputStyle} placeholder="12" />
                </div>
              </div>
            )}

            <button onClick={handleAdd}
              style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              + Add Dock
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 rounded-xl p-3 flex flex-wrap gap-3" style={{ background: 'rgba(10,20,40,0.5)', border: '1px solid rgba(74,144,226,0.1)' }}>
          {([['available', 'Open'], ['rented', 'Rented'], ['reserved', 'Reserved'], ['maintenance', 'Maint']] as [SlipStatus, string][]).map(([s, l]) => (
            <div key={s} className="flex items-center gap-1">
              <span style={{ width: 10, height: 10, borderRadius: 3, background: slipStatusBg(s), border: `1px solid ${slipStatusColor(s)}70`, display: 'inline-block' }} />
              <span style={{ fontSize: '11px', ...dimStyle }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmModal
          message="Remove this dock? Slips in this dock will move to Ungrouped but won't be deleted."
          onConfirm={() => { onDeleteDock(deleteConfirm); setDeleteConfirm(null) }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SLIP DETAIL MODAL
// ─────────────────────────────────────────────────────────
interface SlipModalProps {
  slip: Partial<Slip> | null
  rentals: Rental[]
  docks: Dock[]
  defaultDock?: string
  onSave: (s: Partial<Slip>) => void
  onDelete?: () => void
  onClose: () => void
}

function SlipDetailModal({ slip, rentals, docks, defaultDock, onSave, onDelete, onClose }: SlipModalProps) {
  const [form, setForm] = useState<Partial<Slip>>(slip || {
    name: '', dock: defaultDock || docks[0]?.name || 'Ungrouped', length: 30, beam: 12,
    amenities: { amp30: false, amp50: false, water: false, pumpout: false, liveaboard: false },
    status: 'available', notes: '',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [nameError, setNameError] = useState(false)

  const linkedRental = form.rentalId ? rentals.find(r => r.id === form.rentalId) : null

  const toggle = (key: keyof SlipAmenities) => {
    setForm(f => ({ ...f, amenities: { ...(f.amenities || { amp30: false, amp50: false, water: false, pumpout: false, liveaboard: false }), [key]: !(f.amenities?.[key]) } }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 overflow-y-auto"
        style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none', maxHeight: '90vh', paddingBottom: '80px' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={headStyle}>{slip?.id ? `Slip: ${slip.name}` : '+ New Slip'}</h2>
          <button onClick={onClose} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Dock selector */}
          <div>
            <label style={labelStyle}>Dock</label>
            <select value={form.dock || ''} onChange={e => setForm(f => ({ ...f, dock: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {docks.map(d => (
                <option key={d.id} value={d.name} style={{ background: '#0d1f3c' }}>Dock {d.name}</option>
              ))}
              <option value="Ungrouped" style={{ background: '#0d1f3c' }}>Ungrouped</option>
            </select>
          </div>

          <Field label="Slip Name / Number" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. A1, B3, 12" />

          <div className="flex gap-3">
            <div className="flex-1">
              <label style={labelStyle}>Max LOA (ft)</label>
              <input type="number" value={form.length || ''} onChange={e => setForm(f => ({ ...f, length: Number(e.target.value) }))}
                style={inputStyle} placeholder="30" />
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Max Beam (ft)</label>
              <input type="number" value={form.beam || ''} onChange={e => setForm(f => ({ ...f, beam: Number(e.target.value) }))}
                style={inputStyle} placeholder="12" />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label style={labelStyle}>Amenities</label>
            <div className="flex flex-wrap gap-2">
              {([['amp30', '30A'], ['amp50', '50A'], ['water', 'Water'], ['pumpout', 'Pump-out'], ['liveaboard', 'Liveaboard OK']] as [keyof SlipAmenities, string][]).map(([key, label]) => (
                <button key={key} onClick={() => toggle(key)}
                  style={{
                    background: form.amenities?.[key] ? 'rgba(74,144,226,0.3)' : 'rgba(255,255,255,0.05)',
                    color: form.amenities?.[key] ? '#4A90E2' : 'rgba(245,240,232,0.4)',
                    border: form.amenities?.[key] ? '1px solid #4A90E2' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {(['available', 'rented', 'reserved', 'maintenance'] as SlipStatus[]).map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                  style={{
                    background: form.status === s ? slipStatusBg(s) : 'rgba(255,255,255,0.05)',
                    color: form.status === s ? slipStatusColor(s) : 'rgba(245,240,232,0.4)',
                    border: form.status === s ? `1px solid ${slipStatusColor(s)}` : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', textTransform: 'capitalize',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {linkedRental && (
            <div style={{ background: 'rgba(74,144,226,0.08)', border: '1px solid rgba(74,144,226,0.2)', borderRadius: '10px', padding: '10px 12px' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#4A90E2', fontFamily: 'Georgia, serif' }}>Linked Rental</p>
              <p className="text-xs" style={headStyle}>{linkedRental.vesselName} — {linkedRental.ownerName}</p>
              <p className="text-xs mt-0.5" style={dimStyle}>{linkedRental.leaseType} · ${linkedRental.monthlyRate}/mo</p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any notes about this slip..." rows={2}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>

          {nameError && (
            <p style={{ color: '#e87070', fontSize: '12px', fontFamily: 'Georgia, serif', textAlign: 'center', margin: '0' }}>
              ⚠️ Slip name is required
            </p>
          )}
          <button onClick={() => { if (!form.name?.trim()) { setNameError(true); return } setNameError(false); onSave(form) }}
            style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif', marginTop: '4px' }}>
            Save Slip
          </button>

          {onDelete && (
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'rgba(232,112,112,0.12)', color: '#e87070', border: '1px solid rgba(232,112,112,0.3)', borderRadius: '12px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              🗑 Delete Slip
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          message="This will permanently delete this slip. Any linked rental will be unlinked."
          onConfirm={() => { setShowDeleteConfirm(false); onDelete?.() }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// RENTAL DETAIL MODAL
// ─────────────────────────────────────────────────────────
interface RentalModalProps {
  rental: Partial<Rental> | null
  slips: Slip[]
  onSave: (r: Partial<Rental>) => void
  onEnd?: () => void
  onClose: () => void
}

function RentalDetailModal({ rental, slips, onSave, onEnd, onClose }: RentalModalProps) {
  const [form, setForm] = useState<Partial<Rental>>(rental || {
    slipId: '', vesselName: '', ownerName: '', phone: '', email: '',
    leaseType: 'monthly', startDate: '', endDate: '', monthlyRate: 0,
    autoRenew: false, notes: '', payments: [],
  })
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const availableSlips = slips.filter(s => s.status === 'available' || s.id === form.slipId)

  const markPaid = () => {
    const today = new Date().toISOString().split('T')[0]
    const newPayment: Payment = { date: today, amount: form.monthlyRate || 0, status: 'paid' }
    setForm(f => ({ ...f, payments: [...(f.payments || []), newPayment] }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 overflow-y-auto"
        style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={headStyle}>{rental?.id ? 'Rental Details' : '+ New Rental'}</h2>
          <button onClick={onClose} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Vessel Name" value={form.vesselName || ''} onChange={v => setForm(f => ({ ...f, vesselName: v }))} placeholder="e.g. Sea Wolf" />
          <Field label="Owner Name" value={form.ownerName || ''} onChange={v => setForm(f => ({ ...f, ownerName: v }))} placeholder="John Smith" />
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Phone" value={form.phone || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" />
            </div>
            <div className="flex-1">
              <Field label="Email" value={form.email || ''} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="owner@email.com" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Assign Slip</label>
            <select value={form.slipId || ''} onChange={e => setForm(f => ({ ...f, slipId: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— Select slip —</option>
              {availableSlips.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0d1f3c' }}>
                  {s.name} ({s.length}×{s.beam}ft)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Lease Type</label>
            <div className="flex gap-2">
              {(['monthly', 'seasonal', 'annual'] as LeaseType[]).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, leaseType: t }))}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', textTransform: 'capitalize',
                    background: form.leaseType === t ? 'rgba(74,144,226,0.3)' : 'rgba(255,255,255,0.05)',
                    color: form.leaseType === t ? '#4A90E2' : 'rgba(245,240,232,0.5)',
                    border: form.leaseType === t ? '1px solid #4A90E2' : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Start Date" value={form.startDate || ''} onChange={v => setForm(f => ({ ...f, startDate: v }))} type="date" />
            </div>
            <div className="flex-1">
              <Field label="End Date" value={form.endDate || ''} onChange={v => setForm(f => ({ ...f, endDate: v }))} type="date" />
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Field label="Monthly Rate ($)" value={form.monthlyRate || ''} onChange={v => setForm(f => ({ ...f, monthlyRate: Number(v) }))} type="number" placeholder="500" />
            </div>
            <div className="flex-1 flex items-center gap-2 pb-2">
              <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={!!form.autoRenew} onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))}
                  style={{ accentColor: '#4A90E2', width: '16px', height: '16px', cursor: 'pointer' }} />
                Auto-renew
              </label>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Additional notes..."
              style={{ ...inputStyle, resize: 'none' }} />
          </div>

          {rental?.id && (form.payments || []).length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment History</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(74,144,226,0.15)' }}>
                {(form.payments || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: i < (form.payments || []).length - 1 ? '1px solid rgba(74,144,226,0.1)' : 'none', background: 'rgba(10,20,40,0.5)' }}>
                    <span className="text-xs" style={headStyle}>{p.date}</span>
                    <span className="text-xs font-bold" style={headStyle}>${p.amount}</span>
                    <span className="text-xs" style={{ color: paymentStatusColor(p.status), fontFamily: 'Georgia, serif' }}>{paymentStatusLabel(p.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rental?.id && (
            <button onClick={markPaid}
              style={{ background: 'rgba(76,175,130,0.15)', color: '#4caf82', border: '1px solid rgba(76,175,130,0.3)', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              ✅ Mark as Paid (This Month)
            </button>
          )}

          <button onClick={() => onSave(form)}
            style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif', marginTop: '4px' }}>
            Save Rental
          </button>

          {onEnd && (
            <button onClick={() => setShowEndConfirm(true)}
              style={{ background: 'rgba(232,112,112,0.12)', color: '#e87070', border: '1px solid rgba(232,112,112,0.3)', borderRadius: '12px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              🚫 End Rental
            </button>
          )}
        </div>
      </div>

      {showEndConfirm && (
        <ConfirmModal
          message="This will end the rental and mark the slip as available."
          onConfirm={() => { setShowEndConfirm(false); onEnd?.() }}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// TRANSIENT BOOKING MODAL
// ─────────────────────────────────────────────────────────
interface TransientModalProps {
  booking: Partial<TransientBooking> | null
  slips: Slip[]
  onSave: (b: Partial<TransientBooking>) => void
  onClose: () => void
}

function TransientModal({ booking, slips, onSave, onClose }: TransientModalProps) {
  const [form, setForm] = useState<Partial<TransientBooking>>(booking || {
    slipId: '', vesselName: '', captainName: '', phone: '',
    checkin: '', checkout: '', nightlyRate: 0, notes: '', status: 'upcoming',
    powerType: 'none', loa: 0, beam: 0, waterAtSlip: false,
    discountCard: 'none', discountCardNumber: '',
  })

  const nights = form.checkin && form.checkout ? diffDays(form.checkin, form.checkout) : 0
  const total = nights * (form.nightlyRate || 0)
  const availableSlips = slips.filter(s => s.status === 'available' || s.id === form.slipId)

  const btnToggle = (active: boolean) => ({
    padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif',
    background: active ? 'rgba(74,144,226,0.3)' : 'rgba(255,255,255,0.05)',
    color: active ? '#4A90E2' : 'rgba(245,240,232,0.4)',
    border: active ? '1px solid #4A90E2' : '1px solid rgba(255,255,255,0.1)',
  } as React.CSSProperties)

  const discountLabels: Record<DiscountCard, string> = {
    none: 'None', boatus: 'BoatUS', seatow: 'Sea Tow', towboatus: 'TowBoatUS', other: 'Other'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 overflow-y-auto"
        style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none', maxHeight: '92vh', paddingBottom: '80px' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={headStyle}>{booking?.id ? 'Booking Details' : '+ New Booking'}</h2>
          <button onClick={onClose} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div className="flex flex-col gap-3">

          {/* Vessel & Captain */}
          <Field label="Vessel Name" value={form.vesselName || ''} onChange={v => setForm(f => ({ ...f, vesselName: v }))} placeholder="e.g. Blue Horizon" />
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Captain Name" value={form.captainName || ''} onChange={v => setForm(f => ({ ...f, captainName: v }))} placeholder="Jane Doe" />
            </div>
            <div className="flex-1">
              <Field label="Phone" value={form.phone || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" />
            </div>
          </div>

          {/* Vessel dimensions */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label style={labelStyle}>Vessel LOA (ft)</label>
              <input type="number" value={form.loa || ''} onChange={e => setForm(f => ({ ...f, loa: Number(e.target.value) }))}
                placeholder="e.g. 38" style={inputStyle} />
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Vessel Beam (ft)</label>
              <input type="number" value={form.beam || ''} onChange={e => setForm(f => ({ ...f, beam: Number(e.target.value) }))}
                placeholder="e.g. 12" style={inputStyle} />
            </div>
          </div>

          {/* Slip */}
          <div>
            <label style={labelStyle}>Assign Slip (Available Only)</label>
            <select value={form.slipId || ''} onChange={e => setForm(f => ({ ...f, slipId: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— Select slip —</option>
              {availableSlips.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0d1f3c' }}>
                  {s.name} ({s.length}ft × {s.beam}ft)
                  {s.amenities.amp30 ? ' · 30A' : ''}
                  {s.amenities.amp50 ? ' · 50A' : ''}
                  {s.amenities.water ? ' · Water' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dates & nights */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Check-in" value={form.checkin || ''} onChange={v => setForm(f => ({ ...f, checkin: v }))} type="date" />
            </div>
            <div className="flex-1">
              <Field label="Check-out" value={form.checkout || ''} onChange={v => setForm(f => ({ ...f, checkout: v }))} type="date" />
            </div>
          </div>
          {nights > 0 && (
            <div className="rounded-lg px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(74,144,226,0.08)', border: '1px solid rgba(74,144,226,0.2)' }}>
              <span style={{ fontSize: '12px', ...dimStyle }}>🌙 {nights} night{nights !== 1 ? 's' : ''}</span>
              {total > 0 && <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A90E2', fontFamily: 'Georgia, serif' }}>Total: ${total}</span>}
            </div>
          )}

          <Field label="Nightly Rate ($)" value={form.nightlyRate || ''} onChange={v => setForm(f => ({ ...f, nightlyRate: Number(v) }))} type="number" placeholder="75" />

          {/* Power */}
          <div>
            <label style={labelStyle}>Power Required</label>
            <div className="flex gap-2 flex-wrap">
              {([['none', 'None'], ['30amp', '30A'], ['50amp', '50A'], ['double30', 'Double 30A']] as [PowerType, string][]).map(([p, l]) => (
                <button key={p} onClick={() => setForm(f => ({ ...f, powerType: p }))}
                  style={btnToggle(form.powerType === p)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Water at slip */}
          <div className="flex items-center gap-3">
            <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={!!form.waterAtSlip} onChange={e => setForm(f => ({ ...f, waterAtSlip: e.target.checked }))}
                style={{ accentColor: '#4A90E2', width: '16px', height: '16px', cursor: 'pointer' }} />
              <span style={{ ...dimStyle, fontSize: '13px' }}>💧 Water at slip</span>
            </label>
          </div>

          {/* Discount card */}
          <div>
            <label style={labelStyle}>Discount Card</label>
            <div className="flex gap-2 flex-wrap">
              {(['none', 'boatus', 'seatow', 'towboatus', 'other'] as DiscountCard[]).map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, discountCard: c }))}
                  style={btnToggle(form.discountCard === c)}>
                  {discountLabels[c]}
                </button>
              ))}
            </div>
            {form.discountCard !== 'none' && (
              <input
                className="mt-2"
                value={form.discountCardNumber || ''}
                onChange={e => setForm(f => ({ ...f, discountCardNumber: e.target.value }))}
                placeholder="Card number / membership #"
                style={inputStyle}
              />
            )}
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div className="flex gap-2">
              {(['upcoming', 'active', 'checked_out'] as BookingStatus[]).map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif',
                    background: form.status === s ? `${bookingStatusColor(s)}22` : 'rgba(255,255,255,0.05)',
                    color: form.status === s ? bookingStatusColor(s) : 'rgba(245,240,232,0.4)',
                    border: form.status === s ? `1px solid ${bookingStatusColor(s)}` : '1px solid rgba(255,255,255,0.1)',
                  }}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Notes..."
              style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <button onClick={() => onSave(form)}
            style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif', marginTop: '4px' }}>
            Save Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// WAITLIST ENTRY MODAL
// ─────────────────────────────────────────────────────────
interface WaitlistModalProps {
  entry: Partial<WaitlistEntry> | null
  onSave: (e: Partial<WaitlistEntry>) => void
  onClose: () => void
}

function WaitlistModal({ entry, onSave, onClose }: WaitlistModalProps) {
  const [form, setForm] = useState<Partial<WaitlistEntry>>(entry || {
    name: '', vesselName: '', phone: '', email: '', lengthNeeded: 30,
    dateAdded: new Date().toISOString().split('T')[0], notes: '', notified: false,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 overflow-y-auto"
        style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={headStyle}>{entry?.id ? 'Edit Waitlist Entry' : '+ Add to Waitlist'}</h2>
          <button onClick={onClose} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Name" value={form.name || ''} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="John Smith" />
          <Field label="Vessel Name" value={form.vesselName || ''} onChange={v => setForm(f => ({ ...f, vesselName: v }))} placeholder="e.g. Lucky Star" />
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Phone" value={form.phone || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(555) 000-0000" />
            </div>
            <div className="flex-1">
              <Field label="Email" value={form.email || ''} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@example.com" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Slip Length Needed (ft)" value={form.lengthNeeded || ''} onChange={v => setForm(f => ({ ...f, lengthNeeded: Number(v) }))} type="number" placeholder="35" />
            </div>
            <div className="flex-1">
              <Field label="Date Added" value={form.dateAdded || ''} onChange={v => setForm(f => ({ ...f, dateAdded: v }))} type="date" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Any preferences or notes..."
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <button onClick={() => onSave(form)}
            style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif', marginTop: '4px' }}>
            Save Entry
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
export default function MarinaPage() {
  const router = useRouter()
  const auth = getAuth()
  const [liveSub, setLiveSub] = useState<string | null>(null)
  const sub = liveSub || auth?.subscription || 'sailor'
  const isCaptainPlus = sub === 'captain' || sub === 'admiral'

  const [activeTab, setActiveTab] = useState<TabType>('slips')
  const [searchQuery, setSearchQuery] = useState('')
  const [slips, setSlips] = useState<Slip[]>([])
  const [docks, setDocks] = useState<Dock[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [transient, setTransient] = useState<TransientBooking[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])

  // Modal state
  const [editSlip, setEditSlip] = useState<Slip | 'new' | null>(null)
  const [newSlipDock, setNewSlipDock] = useState<string | undefined>(undefined)
  const [editRental, setEditRental] = useState<Rental | 'new' | null>(null)
  const [editBooking, setEditBooking] = useState<TransientBooking | 'new' | null>(null)
  const [editWaitlist, setEditWaitlist] = useState<WaitlistEntry | 'new' | null>(null)
  const [showDockManager, setShowDockManager] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const loadedSlips = loadLS<Slip[]>(SLIPS_KEY, [])
    // Migrate old slips without dock field
    const migratedSlips = loadedSlips.map(s => ({ dock: 'Main', ...s }))
    setSlips(migratedSlips)
    setDocks(loadLS<Dock[]>(DOCKS_KEY, []))
    setRentals(loadLS<Rental[]>(RENTALS_KEY, []))
    setTransient(loadLS<TransientBooking[]>(TRANSIENT_KEY, []))
    setWaitlist(loadLS<WaitlistEntry[]>(WAITLIST_KEY, []))
  }, [router])

  useEffect(() => {
    if (auth?.email) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
      fetch(`${apiBase}/api/db/users/${encodeURIComponent(auth.email)}`)
        .then(r => r.json())
        .then(u => {
          if (u?.subscription) {
            setLiveSub(u.subscription)
            updateAuthSubscription(u.subscription)
          }
        })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.email])

  // ── DOCK handlers ──
  const addDock = (dock: Dock, slipCount: number, slipLen: number, slipBeam: number) => {
    // Use functional update to avoid stale closure when adding multiple docks
    setDocks(prev => {
      const updatedDocks = [...prev, dock]
      saveLS(DOCKS_KEY, updatedDocks)
      return updatedDocks
    })

    if (slipCount > 0) {
      const newSlips: Slip[] = Array.from({ length: slipCount }, (_, i) => {
        const n = dock.name.trim()
        const slipName = (n.length <= 2) ? `${n}${i + 1}` : `${n} ${i + 1}`
        return {
          id: genId(),
          name: slipName,
          dock: dock.name,
          length: slipLen,
          beam: slipBeam,
          amenities: { amp30: false, amp50: false, water: false, pumpout: false, liveaboard: false },
          status: 'available' as SlipStatus,
          notes: '',
        }
      })
      setSlips(prev => {
        const updated = [...prev, ...newSlips]
        saveLS(SLIPS_KEY, updated)
        return updated
      })
    }
  }

  const renameDock = (id: string, newName: string) => {
    const dock = docks.find(d => d.id === id)
    if (!dock) return
    const oldName = dock.name
    const updatedDocks = docks.map(d => d.id === id ? { ...d, name: newName } : d)
    setDocks(updatedDocks)
    saveLS(DOCKS_KEY, updatedDocks)
    // Update slips in this dock
    const updatedSlips = slips.map(s => s.dock === oldName ? { ...s, dock: newName } : s)
    setSlips(updatedSlips)
    saveLS(SLIPS_KEY, updatedSlips)
  }

  const deleteDock = (id: string) => {
    const dock = docks.find(d => d.id === id)
    if (!dock) return
    const updatedDocks = docks.filter(d => d.id !== id)
    setDocks(updatedDocks)
    saveLS(DOCKS_KEY, updatedDocks)
    // Move slips to Ungrouped
    const updatedSlips = slips.map(s => s.dock === dock.name ? { ...s, dock: 'Ungrouped' } : s)
    setSlips(updatedSlips)
    saveLS(SLIPS_KEY, updatedSlips)
  }

  // ── SLIP handlers ──
  const saveSlip = (form: Partial<Slip>) => {
    if (!form.name) return
    if (editSlip === 'new') {
      const newSlip: Slip = {
        id: genId(), name: form.name, dock: form.dock || 'Ungrouped',
        length: form.length || 30, beam: form.beam || 12,
        amenities: form.amenities || { amp30: false, amp50: false, water: false, pumpout: false, liveaboard: false },
        status: form.status || 'available', notes: form.notes || '',
      }
      const updated = [...slips, newSlip]
      setSlips(updated); saveLS(SLIPS_KEY, updated)
    } else if (editSlip) {
      const updated = slips.map(s => s.id === editSlip.id ? { ...s, ...form } as Slip : s)
      setSlips(updated); saveLS(SLIPS_KEY, updated)
    }
    setEditSlip(null)
    setNewSlipDock(undefined)
  }

  const deleteSlip = (id: string) => {
    const updated = slips.filter(s => s.id !== id)
    setSlips(updated); saveLS(SLIPS_KEY, updated)
    const updatedRentals = rentals.map(r => r.slipId === id ? { ...r, slipId: '' } : r)
    setRentals(updatedRentals); saveLS(RENTALS_KEY, updatedRentals)
    setEditSlip(null)
  }

  // ── RENTAL handlers ──
  const saveRental = (form: Partial<Rental>) => {
    if (!form.vesselName) return
    if (editRental === 'new') {
      const newRental: Rental = {
        id: genId(), slipId: form.slipId || '', vesselName: form.vesselName || '',
        ownerName: form.ownerName || '', phone: form.phone || '', email: form.email || '',
        leaseType: form.leaseType || 'monthly', startDate: form.startDate || '',
        endDate: form.endDate || '', monthlyRate: form.monthlyRate || 0,
        autoRenew: form.autoRenew || false, notes: form.notes || '', payments: form.payments || [],
      }
      const updated = [...rentals, newRental]
      setRentals(updated); saveLS(RENTALS_KEY, updated)
      if (newRental.slipId) {
        const updatedSlips = slips.map(s => s.id === newRental.slipId ? { ...s, status: 'rented' as SlipStatus, rentalId: newRental.id } : s)
        setSlips(updatedSlips); saveLS(SLIPS_KEY, updatedSlips)
      }
    } else if (editRental) {
      const updated = rentals.map(r => r.id === editRental.id ? { ...r, ...form } as Rental : r)
      setRentals(updated); saveLS(RENTALS_KEY, updated)
    }
    setEditRental(null)
  }

  const endRental = (rental: Rental) => {
    const updated = rentals.filter(r => r.id !== rental.id)
    setRentals(updated); saveLS(RENTALS_KEY, updated)
    if (rental.slipId) {
      const updatedSlips = slips.map(s => s.id === rental.slipId ? { ...s, status: 'available' as SlipStatus, rentalId: undefined } : s)
      setSlips(updatedSlips); saveLS(SLIPS_KEY, updatedSlips)
    }
    setEditRental(null)
  }

  // ── TRANSIENT handlers ──
  const saveBooking = (form: Partial<TransientBooking>) => {
    if (!form.vesselName) return
    if (editBooking === 'new') {
      const newBooking: TransientBooking = {
        id: genId(), slipId: form.slipId || '', vesselName: form.vesselName || '',
        captainName: form.captainName || '', phone: form.phone || '',
        checkin: form.checkin || '', checkout: form.checkout || '',
        nightlyRate: form.nightlyRate || 0, notes: form.notes || '',
        status: form.status || 'upcoming',
        powerType: form.powerType || 'none',
        loa: form.loa || 0, beam: form.beam || 0,
        waterAtSlip: form.waterAtSlip || false,
        discountCard: form.discountCard || 'none',
        discountCardNumber: form.discountCardNumber || '',
      }
      const updated = [...transient, newBooking]
      setTransient(updated); saveLS(TRANSIENT_KEY, updated)
    } else if (editBooking) {
      const updated = transient.map(b => b.id === editBooking.id ? { ...b, ...form } as TransientBooking : b)
      setTransient(updated); saveLS(TRANSIENT_KEY, updated)
    }
    setEditBooking(null)
  }

  // ── WAITLIST handlers ──
  const saveWaitlistEntry = (form: Partial<WaitlistEntry>) => {
    if (!form.name) return
    if (editWaitlist === 'new') {
      const newEntry: WaitlistEntry = {
        id: genId(), name: form.name || '', vesselName: form.vesselName || '',
        phone: form.phone || '', email: form.email || '',
        lengthNeeded: form.lengthNeeded || 30,
        dateAdded: form.dateAdded || new Date().toISOString().split('T')[0],
        notes: form.notes || '', notified: false,
      }
      const updated = [...waitlist, newEntry]
      setWaitlist(updated); saveLS(WAITLIST_KEY, updated)
    } else if (editWaitlist) {
      const updated = waitlist.map(e => e.id === editWaitlist.id ? { ...e, ...form } as WaitlistEntry : e)
      setWaitlist(updated); saveLS(WAITLIST_KEY, updated)
    }
    setEditWaitlist(null)
  }

  const notifyWaitlist = (id: string) => {
    const updated = waitlist.map(e => e.id === id ? { ...e, notified: true } : e)
    setWaitlist(updated); saveLS(WAITLIST_KEY, updated)
  }

  const removeWaitlistEntry = (id: string) => {
    const updated = waitlist.filter(e => e.id !== id)
    setWaitlist(updated); saveLS(WAITLIST_KEY, updated)
  }

  // ── Stats ──
  const totalSlips = slips.length
  const rentedSlips = slips.filter(s => s.status === 'rented').length
  const availableSlips = slips.filter(s => s.status === 'available').length
  const maintenanceSlips = slips.filter(s => s.status === 'maintenance').length

  // ── Dock grouping ──
  const allDockNames = [
    ...docks.map(d => d.name),
    ...Array.from(new Set(slips.map(s => s.dock).filter(d => !docks.find(dk => dk.name === d)))),
  ]

  // ── Locked view ──
  if (!isCaptainPlus) {
    return (
      <div className="bg-wood min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
          <Logo size="sm" />
          <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif' }}>
            ⚓ Marina Manager
          </span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pb-28 text-center">
          <div className="relative w-full max-w-sm mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(198,139,58,0.3)' }}>
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none', background: 'rgba(10,20,40,0.9)', padding: '16px' }}>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: '52px', borderRadius: '10px', background: i % 3 === 0 ? 'rgba(74,144,226,0.3)' : i % 3 === 1 ? 'rgba(198,139,58,0.2)' : 'rgba(20,40,80,0.8)', border: '1px solid rgba(74,144,226,0.2)' }} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(10,20,40,0.65)' }}>
              <span style={{ fontSize: '2.5rem' }}>🔒</span>
              <p className="text-sm font-bold mt-2" style={headStyle}>Marina Manager Locked</p>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ ...headStyle, fontFamily: 'Georgia, serif' }}>⚓ Marina Manager</h1>
          <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ ...dimStyle, color: 'rgba(245,240,232,0.85)' }}>
            Marina Manager is included with <strong style={goldStyle}>Captain</strong> and <strong style={goldStyle}>Admiral</strong> plans.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/upgrade" className="text-sm px-5 py-3 rounded-xl text-center font-bold"
              style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⬆️ Upgrade to Captain
            </Link>
            <Link href="/marina-addon-checkout" className="text-sm px-5 py-3 rounded-xl text-center"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⚓ Add Marina Manager ($49/mo)
            </Link>
          </div>
        </main>
        <NavBar />
      </div>
    )
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <span className="text-sm font-bold" style={goldStyle}>⚓ Marina Manager</span>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 pb-28">
        {/* Search bar */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>🔍</span>
          <input
            type="search"
            placeholder="Search by vessel or owner..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.85)', border: '2px solid rgba(26,10,0,0.3)', color: '#1A0A00', fontFamily: 'system-ui, sans-serif', outline: 'none' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#1A0A00', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          )}
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <TabPill label="⚓ Slips" active={activeTab === 'slips'} onClick={() => setActiveTab('slips')} />
          <TabPill label="📋 Rentals" active={activeTab === 'rentals'} onClick={() => setActiveTab('rentals')} />
          <TabPill label="🛥️ Transient" active={activeTab === 'transient'} onClick={() => setActiveTab('transient')} />
          <TabPill label="📋 Waitlist" active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')} />
        </div>

        {/* ─── SLIPS TAB ─── */}
        {activeTab === 'slips' && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'Total', value: totalSlips, color: '#F5F0E8' },
                { label: 'Rented', value: rentedSlips, color: '#4A90E2' },
                { label: 'Open', value: availableSlips, color: '#4caf82' },
                { label: 'Maint.', value: maintenanceSlips, color: '#e87070' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-2 text-center"
                  style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.15)' }}>
                  <p className="text-lg font-bold" style={{ color: stat.color, fontFamily: 'Georgia, serif' }}>{stat.value}</p>
                  <p className="text-xs" style={dimStyle}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Configure Docks button */}
            <button onClick={() => setShowDockManager(true)}
              className="w-full mb-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'rgba(198,139,58,0.12)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.35)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              ⚙️ Configure Docks
            </button>

            {/* No slips at all */}
            {slips.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span style={{ fontSize: '3rem' }}>⚓</span>
                <p className="text-sm mt-3 mb-1 font-bold" style={headStyle}>No slips yet</p>
                <p className="text-xs mb-4" style={dimStyle}>Configure your docks to auto-generate slips, or add them individually.</p>
                <button onClick={() => setShowDockManager(true)}
                  style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  ⚙️ Set Up Docks
                </button>
              </div>
            )}

            {/* Dock grids */}
            {allDockNames.map(dockName => {
              const dockSlips = slips.filter(s => s.dock === dockName)
              if (dockSlips.length === 0 && !docks.find(d => d.name === dockName)) return null
              const filteredDockSlips = searchQuery
                ? dockSlips.filter(s => {
                  const rental = rentals.find(r => r.slipId === s.id)
                  const booking = transient.find(b => b.slipId === s.id)
                  return s.name.toLowerCase().includes(searchQuery.toLowerCase())
                    || rental?.vesselName.toLowerCase().includes(searchQuery.toLowerCase())
                    || rental?.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
                    || booking?.vesselName.toLowerCase().includes(searchQuery.toLowerCase())
                    || booking?.captainName.toLowerCase().includes(searchQuery.toLowerCase())
                })
                : dockSlips

              return (
                <div key={dockName} className="mb-5">
                  {/* Dock header */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={goldStyle}>
                      ⚓ Dock {dockName}
                      <span className="ml-2 text-xs font-normal" style={dimStyle}>
                        {dockSlips.filter(s => s.status === 'available').length} open / {dockSlips.length} total
                      </span>
                    </h2>
                    <button
                      onClick={() => { setNewSlipDock(dockName); setEditSlip('new') }}
                      style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                      + Slip
                    </button>
                  </div>

                  {/* Slip grid */}
                  {filteredDockSlips.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {filteredDockSlips.map(slip => {
                        const rental = rentals.find(r => r.slipId === slip.id)
                        const booking = transient.find(b => b.slipId === slip.id && b.status !== 'checked_out')
                        const occupant = rental?.vesselName || booking?.vesselName
                        return (
                          <SlipCell
                            key={slip.id}
                            slip={slip}
                            occupantName={occupant}
                            onClick={() => setEditSlip(slip)}
                          />
                        )
                      })}
                    </div>
                  ) : searchQuery ? (
                    <p className="text-xs py-2" style={dimStyle}>No matches in Dock {dockName}</p>
                  ) : (
                    <p className="text-xs py-2" style={dimStyle}>No slips in this dock yet — tap + Slip to add one.</p>
                  )}
                </div>
              )
            })}

            {/* Color legend */}
            {slips.length > 0 && (
              <div className="mt-2 rounded-xl p-3 flex flex-wrap gap-3" style={{ background: 'rgba(10,20,40,0.5)', border: '1px solid rgba(74,144,226,0.1)' }}>
                {([['available', 'Open'], ['rented', 'Rented'], ['reserved', 'Reserved'], ['maintenance', 'Maintenance']] as [SlipStatus, string][]).map(([s, l]) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: slipStatusBg(s), border: `1px solid ${slipStatusColor(s)}70`, display: 'inline-block' }} />
                    <span style={{ fontSize: '11px', ...dimStyle }}>{l}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── RENTALS TAB ─── */}
        {activeTab === 'rentals' && (
          <>
            <button onClick={() => setEditRental('new')}
              className="w-full mb-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.35)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              + New Rental
            </button>

            {rentals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span style={{ fontSize: '3rem' }}>📋</span>
                <p className="text-sm mt-3 mb-1 font-bold" style={headStyle}>No rentals yet</p>
                <p className="text-xs" style={dimStyle}>Create a rental agreement to track slip leases</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {rentals.filter(r => !searchQuery || r.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) || r.ownerName.toLowerCase().includes(searchQuery.toLowerCase())).map(rental => {
                  const slip = slips.find(s => s.id === rental.slipId)
                  const lastPayment = rental.payments[rental.payments.length - 1]
                  const payStatus: PaymentStatus = lastPayment?.status || 'due_soon'
                  return (
                    <button key={rental.id} onClick={() => setEditRental(rental)}
                      className="w-full text-left rounded-xl p-4"
                      style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.18)', cursor: 'pointer' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-base font-bold" style={headStyle}>{rental.vesselName}</p>
                          <p className="text-xs mt-0.5" style={dimStyle}>{rental.ownerName}</p>
                        </div>
                        <span style={{
                          background: rental.leaseType === 'monthly' ? 'rgba(74,144,226,0.15)' : rental.leaseType === 'annual' ? 'rgba(198,139,58,0.15)' : 'rgba(76,175,130,0.15)',
                          color: rental.leaseType === 'monthly' ? '#4A90E2' : rental.leaseType === 'annual' ? '#C68B3A' : '#4caf82',
                          border: `1px solid ${rental.leaseType === 'monthly' ? '#4A90E240' : rental.leaseType === 'annual' ? '#C68B3A40' : '#4caf8240'}`,
                          borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontFamily: 'Georgia, serif', textTransform: 'capitalize', fontWeight: 'bold',
                        }}>
                          {rental.leaseType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs" style={dimStyle}>
                        {slip && <span>📍 {slip.name}</span>}
                        <span>💰 ${rental.monthlyRate}/mo</span>
                        {rental.startDate && <span>📅 {rental.startDate}{rental.endDate ? ` → ${rental.endDate}` : ' · Ongoing'}</span>}
                      </div>
                      <div className="mt-2">
                        <span style={{ color: paymentStatusColor(payStatus), fontSize: '12px', fontFamily: 'Georgia, serif' }}>
                          {paymentStatusLabel(payStatus)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── TRANSIENT TAB ─── */}
        {activeTab === 'transient' && (
          <>
            <button onClick={() => setEditBooking('new')}
              className="w-full mb-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.35)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              + New Booking
            </button>

            {transient.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span style={{ fontSize: '3rem' }}>🛥️</span>
                <p className="text-sm mt-3 mb-1 font-bold" style={headStyle}>No transient bookings</p>
                <p className="text-xs" style={dimStyle}>Track short-term guest dock bookings here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {transient.filter(b => !searchQuery || b.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) || b.captainName.toLowerCase().includes(searchQuery.toLowerCase())).map(booking => {
                  const slip = slips.find(s => s.id === booking.slipId)
                  const nights = booking.checkin && booking.checkout ? diffDays(booking.checkin, booking.checkout) : 0
                  const total = nights * booking.nightlyRate
                  return (
                    <button key={booking.id} onClick={() => setEditBooking(booking)}
                      className="w-full text-left rounded-xl p-4"
                      style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.18)', cursor: 'pointer' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-base font-bold" style={headStyle}>{booking.vesselName}</p>
                          <p className="text-xs mt-0.5" style={dimStyle}>{booking.captainName}</p>
                        </div>
                        <span style={{
                          background: `${bookingStatusColor(booking.status)}22`,
                          color: bookingStatusColor(booking.status),
                          border: `1px solid ${bookingStatusColor(booking.status)}50`,
                          borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontFamily: 'Georgia, serif', textTransform: 'capitalize', fontWeight: 'bold',
                        }}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs mb-1" style={dimStyle}>
                        {slip && <span>📍 {slip.name}</span>}
                        {booking.checkin && <span>📅 {booking.checkin} → {booking.checkout}</span>}
                        {nights > 0 && <span>🌙 {nights}n</span>}
                        {total > 0 && <span style={{ color: '#4A90E2', fontFamily: 'Georgia, serif' }}>💰 ${total}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {booking.loa > 0 && <span style={{ ...dimStyle, fontSize: '10px' }}>LOA: {booking.loa}ft</span>}
                        {booking.powerType !== 'none' && <span style={{ fontSize: '10px', color: '#4A90E2', fontFamily: 'Georgia, serif' }}>⚡ {booking.powerType === 'double30' ? 'Double 30A' : booking.powerType}</span>}
                        {booking.waterAtSlip && <span style={{ fontSize: '10px', color: '#4caf82', fontFamily: 'Georgia, serif' }}>💧 Water</span>}
                        {booking.discountCard !== 'none' && <span style={{ fontSize: '10px', color: '#C68B3A', fontFamily: 'Georgia, serif' }}>🎫 {booking.discountCard.toUpperCase()}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── WAITLIST TAB ─── */}
        {activeTab === 'waitlist' && (
          <>
            <button onClick={() => setEditWaitlist('new')}
              className="w-full mb-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.35)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              + Add to Waitlist
            </button>

            {availableSlips > 0 && waitlist.filter(e => !e.notified).length > 0 && (
              <div className="mb-4 rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'rgba(76,175,130,0.1)', border: '1px solid rgba(76,175,130,0.3)' }}>
                <span style={{ fontSize: '1.5rem' }}>🟢</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#4caf82', fontFamily: 'Georgia, serif' }}>Slips Available!</p>
                  <p className="text-xs" style={dimStyle}>{availableSlips} slip{availableSlips !== 1 ? 's' : ''} open — notify your waitlist</p>
                </div>
              </div>
            )}

            {waitlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span style={{ fontSize: '3rem' }}>📋</span>
                <p className="text-sm mt-3 mb-1 font-bold" style={headStyle}>Waitlist is empty</p>
                <p className="text-xs" style={dimStyle}>Add people waiting for a slip</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {waitlist.filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.vesselName.toLowerCase().includes(searchQuery.toLowerCase())).map((entry, idx) => (
                  <div key={entry.id} className="rounded-xl p-4"
                    style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.18)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>#{idx + 1}</span>
                          <p className="text-base font-bold" style={headStyle}>{entry.name}</p>
                        </div>
                        {entry.vesselName && <p className="text-xs mt-0.5" style={dimStyle}>🛥️ {entry.vesselName}</p>}
                      </div>
                      {entry.notified && (
                        <span style={{ background: 'rgba(76,175,130,0.15)', color: '#4caf82', border: '1px solid rgba(76,175,130,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontFamily: 'Georgia, serif' }}>
                          Notified ✅
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-3" style={dimStyle}>
                      {entry.phone && <span>📞 {entry.phone}</span>}
                      {entry.email && <span>✉️ {entry.email}</span>}
                      <span>📏 Needs {entry.lengthNeeded}ft</span>
                      <span>📅 {entry.dateAdded}</span>
                    </div>
                    {entry.notes && <p className="text-xs mb-3 truncate" style={dimStyle}>{entry.notes}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => setEditWaitlist(entry)}
                        style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', background: 'rgba(74,144,226,0.12)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.3)' }}>
                        ✏️ Edit
                      </button>
                      {!entry.notified && availableSlips > 0 && (
                        <button onClick={() => notifyWaitlist(entry.id)}
                          style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', background: 'rgba(76,175,130,0.12)', color: '#4caf82', border: '1px solid rgba(76,175,130,0.3)' }}>
                          🔔 Notify
                        </button>
                      )}
                      <button onClick={() => removeWaitlistEntry(entry.id)}
                        style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', background: 'rgba(232,112,112,0.1)', color: '#e87070', border: '1px solid rgba(232,112,112,0.25)' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {showDockManager && (
        <DockManagerModal
          docks={docks}
          onAddDock={addDock}
          onRenameDock={renameDock}
          onDeleteDock={deleteDock}
          onClose={() => setShowDockManager(false)}
        />
      )}

      {editSlip && (
        <SlipDetailModal
          slip={editSlip === 'new' ? null : editSlip}
          rentals={rentals}
          docks={docks}
          defaultDock={newSlipDock}
          onSave={saveSlip}
          onDelete={editSlip !== 'new' ? () => deleteSlip((editSlip as Slip).id) : undefined}
          onClose={() => { setEditSlip(null); setNewSlipDock(undefined) }}
        />
      )}

      {editRental && (
        <RentalDetailModal
          rental={editRental === 'new' ? null : editRental}
          slips={slips}
          onSave={saveRental}
          onEnd={editRental !== 'new' ? () => endRental(editRental as Rental) : undefined}
          onClose={() => setEditRental(null)}
        />
      )}

      {editBooking && (
        <TransientModal
          booking={editBooking === 'new' ? null : editBooking}
          slips={slips}
          onSave={saveBooking}
          onClose={() => setEditBooking(null)}
        />
      )}

      {editWaitlist && (
        <WaitlistModal
          entry={editWaitlist === 'new' ? null : editWaitlist}
          onSave={saveWaitlistEntry}
          onClose={() => setEditWaitlist(null)}
        />
      )}

      <NavBar />
    </div>
  )
}
