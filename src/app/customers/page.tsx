'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

interface Customer {
  id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  user_id?: string
}

const EMPTY: Customer = { name: '', email: '', phone: '', address: '', notes: '' }

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<Customer>(EMPTY)
  const auth = getAuth()

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    loadCustomers()
  }, [router])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const email = auth?.email || ''
      const r = await fetch(`${API_URL}/api/db/customers?user_email=${encodeURIComponent(email)}`)
      if (r.ok) setCustomers(await r.json())
    } catch {} finally { setLoading(false) }
  }

  const saveCustomer = async () => {
    const email = auth?.email || ''
    const payload = { ...form, user_id: email }
    try {
      if (editing?.id) {
        const r = await fetch(`${API_URL}/api/db/customers/${editing.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        if (r.ok) { const d = await r.json(); setCustomers(prev => prev.map(c => c.id === d.id ? d : c)) }
      } else {
        const r = await fetch(`${API_URL}/api/db/customers`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
        if (r.ok) { const d = await r.json(); setCustomers(prev => [d, ...prev]) }
      }
    } catch {}
    setShowForm(false); setEditing(null); setForm(EMPTY)
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    try { await fetch(`${API_URL}/api/db/customers/${id}`, { method: 'DELETE' }) } catch {}
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone||'').includes(search)
  )
  const set = (k: keyof Customer, v: string) => setForm(f => ({...f, [k]: v}))
  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY) }}
          className="text-xs px-3 py-1.5 rounded-lg font-bold"
          style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer' }}>
          + Add Customer
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>👥 Customers</h1>
        <p className="text-xs mb-4" style={dimStyle}>{customers.length} customers</p>

        <input className="input-field mb-4" placeholder="Search by name, email, or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />

        {showForm && (
          <div className="panel p-4 mb-4">
            <h2 className="text-sm font-bold mb-3" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
              {editing ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <div className="flex flex-col gap-3">
              <div><label className="block text-xs mb-1" style={labelStyle}>Name *</label>
                <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Captain John Smith" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs mb-1" style={labelStyle}>Email</label>
                  <input type="email" className="input-field" value={form.email||''} onChange={e => set('email', e.target.value)} placeholder="john@example.com" /></div>
                <div><label className="block text-xs mb-1" style={labelStyle}>Phone</label>
                  <input className="input-field" value={form.phone||''} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" /></div>
              </div>
              <div><label className="block text-xs mb-1" style={labelStyle}>Address</label>
                <input className="input-field" value={form.address||''} onChange={e => set('address', e.target.value)} placeholder="123 Marina Dr, Annapolis MD" /></div>
              <div><label className="block text-xs mb-1" style={labelStyle}>Notes</label>
                <textarea className="input-field resize-none" rows={2} value={form.notes||''} onChange={e => set('notes', e.target.value)} placeholder="Preferred contact method, special instructions..." /></div>
              <div className="flex gap-2">
                <button onClick={saveCustomer} className="btn-primary flex-1" style={{ fontSize: '14px', padding: '10px' }}>💾 Save</button>
                <button onClick={() => { setShowForm(false); setEditing(null) }}
                  className="flex-1 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? <p className="text-center py-8 text-sm" style={dimStyle}>Loading customers...</p> :
          filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-sm mb-4" style={dimStyle}>{search ? 'No customers match your search.' : 'No customers yet.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(customer => (
                <div key={customer.id || customer.name} className="panel p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{customer.name}</p>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {customer.email && <p className="text-xs" style={dimStyle}>✉️ {customer.email}</p>}
                        {customer.phone && <p className="text-xs" style={dimStyle}>📞 {customer.phone}</p>}
                        {customer.address && <p className="text-xs" style={dimStyle}>📍 {customer.address}</p>}
                        {customer.notes && <p className="text-xs mt-1 italic" style={dimStyle}>{customer.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setEditing(customer); setForm(customer); setShowForm(true) }}
                        style={{ background: 'rgba(198,139,58,0.15)', color: 'rgba(198,139,58,0.7)', border: '1px solid rgba(198,139,58,0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                        ✏️
                      </button>
                      {customer.id && (
                        <button onClick={() => deleteCustomer(customer.id!)}
                          style={{ background: 'rgba(139,26,26,0.15)', color: 'rgba(245,240,232,0.4)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
      <NavBar />
    </div>
  )
}
