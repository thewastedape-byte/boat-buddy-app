'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

interface Job {
  id: string
  symptom: string
  diagnosis: string
  status: string
  vessel_id?: string
  vessel?: { name: string; engine_make: string; engine_model: string }
  assigned_to?: string
  labor_hours?: number
  notes?: string
  created_at: string
  updated_at: string
  user_id?: string
}

const STATUS_COLS = [
  { key: 'open', label: 'Open', color: '#e87070' },
  { key: 'in_progress', label: 'In Progress', color: '#C68B3A' },
  { key: 'complete', label: 'Complete', color: '#70c070' },
  { key: 'invoiced', label: 'Invoiced', color: 'rgba(245,240,232,0.4)' },
]

const NEXT_STATUS: Record<string, string> = {
  open: 'in_progress',
  in_progress: 'complete',
  complete: 'invoiced',
}

export default function ServicePage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const auth = getAuth()

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    loadJobs()
  }, [router])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const email = auth?.email || ''
      const r = await fetch(`${API_URL}/api/db/jobs?user_email=${encodeURIComponent(email)}`)
      if (r.ok) {
        const data = await r.json()
        setJobs(data)
      } else {
        // Fall back to localStorage
        const raw = localStorage.getItem('boat_buddy_repair_log')
        if (raw) {
          const local = JSON.parse(raw).map((j: {id:string;symptom:string;diagnosis:string;date:number}) => ({
            ...j, status: j.status || 'open', created_at: new Date(j.date).toISOString()
          }))
          setJobs(local)
        }
      }
    } catch {
      const raw = localStorage.getItem('boat_buddy_repair_log')
      if (raw) setJobs(JSON.parse(raw).map((j: {id:string;symptom:string;diagnosis:string;date:number}) => ({...j, status: j.status||'open', created_at: new Date(j.date).toISOString()})))
    } finally { setLoading(false) }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/db/jobs/${id}`, {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({status: newStatus})
      })
    } catch {}
    setJobs(prev => prev.map(j => j.id === id ? {...j, status: newStatus} : j))
  }

  const filteredJobs = jobs.filter(j => {
    if (filter === 'open') return j.status === 'open'
    if (filter === 'mine') return j.assigned_to === auth?.email || j.user_id === auth?.email
    if (filter === 'unassigned') return !j.assigned_to
    return true
  })

  const jobsByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = filteredJobs.filter(j => j.status === col.key)
    return acc
  }, {} as Record<string, Job[]>)

  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          + New Job
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>🔩 Service Department</h1>
        <p className="text-xs mb-4" style={dimStyle}>{jobs.length} total jobs</p>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[['all','All'],['open','Open'],['mine','My Jobs'],['unassigned','Unassigned']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: filter===k ? '#C68B3A' : 'rgba(198,139,58,0.15)', color: filter===k ? '#3D1C02' : '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12 text-sm" style={dimStyle}>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔩</p>
            <p className="text-sm mb-4" style={dimStyle}>No jobs yet. Start a chat to diagnose a problem.</p>
            <Link href="/" className="btn-primary inline-block px-6 py-2 text-sm" style={{ textDecoration: 'none' }}>Start Diagnosis</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {STATUS_COLS.map(col => (
              <div key={col.key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <h2 className="text-xs uppercase tracking-wider font-bold" style={{ color: col.color, fontFamily: 'Georgia, serif' }}>
                    {col.label} ({jobsByStatus[col.key]?.length || 0})
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {(jobsByStatus[col.key] || []).map(job => (
                    <div key={job.id} className="panel p-3">
                      <div className="flex items-start justify-between gap-2" onClick={() => setExpanded(expanded === job.id ? null : job.id)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{job.symptom || 'No description'}</p>
                          <p className="text-xs mt-0.5" style={dimStyle}>
                            {job.vessel?.name || 'Unknown vessel'} · {new Date(job.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                          </p>
                        </div>
                        <span style={{ color: 'rgba(198,139,58,0.5)', fontSize: '12px' }}>{expanded === job.id ? '▲' : '▼'}</span>
                      </div>

                      {expanded === job.id && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(198,139,58,0.2)' }}>
                          {job.diagnosis && (
                            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'system-ui, sans-serif' }}>
                              {job.diagnosis.substring(0, 300)}{job.diagnosis.length > 300 ? '...' : ''}
                            </p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {NEXT_STATUS[job.status] && (
                              <button onClick={() => updateStatus(job.id, NEXT_STATUS[job.status])}
                                className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', cursor: 'pointer', border: 'none' }}>
                                → Mark {STATUS_COLS.find(c => c.key === NEXT_STATUS[job.status])?.label}
                              </button>
                            )}
                            <Link href={`/workorder?id=${job.id}`} className="text-xs px-3 py-1.5 rounded-lg"
                              style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                              📄 Work Order
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(jobsByStatus[col.key] || []).length === 0 && (
                    <p className="text-xs px-2 py-3" style={dimStyle}>No {col.label.toLowerCase()} jobs</p>
                  )}
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
