'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const YARD_SPOTS_KEY = 'bb_yard_spots'

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

type FieldKey = 'label' | 'vesselName' | 'ownerName' | 'phone' | 'email' | 'notes' | 'status' | 'ignore'

interface FieldOption { value: FieldKey; label: string }

const FIELD_OPTIONS: FieldOption[] = [
  { value: 'ignore', label: '— Ignore —' },
  { value: 'label', label: 'Slip / Spot Label' },
  { value: 'vesselName', label: 'Vessel Name' },
  { value: 'ownerName', label: 'Owner Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'notes', label: 'Notes' },
  { value: 'status', label: 'Status' },
]

// Auto-detect common column header names
function autoDetectField(header: string): FieldKey {
  const h = header.toLowerCase().trim()
  if (/slip|spot|berth|bay|#|num/.test(h)) return 'label'
  if (/vessel|boat|ship|craft/.test(h)) return 'vesselName'
  if (/owner|name|contact|customer/.test(h)) return 'ownerName'
  if (/phone|tel|mobile|cell/.test(h)) return 'phone'
  if (/email|mail/.test(h)) return 'email'
  if (/note|comment|remark|info/.test(h)) return 'notes'
  if (/status|state/.test(h)) return 'status'
  return 'ignore'
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  return lines.map(line => {
    const cells: string[] = []
    let inQuotes = false
    let current = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current.trim())
    return cells
  })
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

function normalizeStatus(val: string): SpotStatus {
  const v = val.toLowerCase().trim()
  if (v === 'occupied' || v === 'taken' || v === 'full' || v === 'yes') return 'occupied'
  if (v === 'reserved' || v === 'hold' || v === 'pending') return 'reserved'
  return 'available'
}

const SAMPLE_CSV = `Slip,Vessel Name,Owner,Phone,Email,Notes,Status
A1,Sea Breeze,John Smith,410-555-1234,john@email.com,Oil change due,occupied
A2,Lady Luck,Mary Jones,410-555-5678,mary@email.com,,available
B1,Blue Horizon,Tom Brown,410-555-9012,tom@email.com,Winter storage,reserved
B2,Ocean Spirit,Sarah Davis,410-555-3456,sarah@email.com,,available
C1,Wind Dancer,Mike Wilson,410-555-7890,mike@email.com,New customer,occupied`

const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
const headStyle = { color: '#F5F0E8', fontFamily: 'Georgia, serif' }

export default function ImportPage() {
  const router = useRouter()
  const auth = getAuth()
  const sub = auth?.subscription || 'sailor'
  const isAdmiral = sub === 'admiral'

  const [stage, setStage] = useState<'upload' | 'map' | 'preview' | 'done'>('upload')
  const [csvRows, setCsvRows] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<FieldKey[]>([])
  const [importCount, setImportCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    if (!isAdmiral) { router.replace('/yard'); return }
  }, [router, isAdmiral])

  const processCSVText = (text: string) => {
    const rows = parseCSV(text)
    if (rows.length < 2) { alert('CSV must have a header row and at least one data row.'); return }
    const hdrs = rows[0]
    const autoMap = hdrs.map(h => autoDetectField(h))
    setHeaders(hdrs)
    setMapping(autoMap)
    setCsvRows(rows.slice(1))
    setStage('map')
  }

  const handleFileUpload = (file: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      processCSVText(text)
    }
    reader.readAsText(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileUpload(file)
    } else {
      alert('Please upload a .csv file.')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const previewRows = csvRows.slice(0, 5)

  const getMappedValue = (row: string[], fieldKey: FieldKey): string => {
    const idx = mapping.indexOf(fieldKey)
    return idx >= 0 ? (row[idx] || '') : ''
  }

  const doImport = () => {
    const existing = loadSpots()
    const spotMap = new Map<string, YardSpot>()
    existing.forEach(s => spotMap.set(s.label.toLowerCase(), s))

    // Find max row/col to place new spots
    let maxRow = existing.reduce((m, s) => Math.max(m, s.row), -1)
    let maxCol = existing.reduce((m, s) => Math.max(m, s.col), 0)

    let imported = 0

    csvRows.forEach((row, idx) => {
      const label = getMappedValue(row, 'label') || `IMP${idx + 1}`
      const vesselName = getMappedValue(row, 'vesselName')
      const ownerName = getMappedValue(row, 'ownerName')
      const phone = getMappedValue(row, 'phone')
      const email = getMappedValue(row, 'email')
      const rawNotes = getMappedValue(row, 'notes')
      const rawStatus = getMappedValue(row, 'status')

      // Build notes — include phone/email if mapped
      const noteParts = [rawNotes]
      if (phone) noteParts.push(`📞 ${phone}`)
      if (email) noteParts.push(`✉️ ${email}`)
      const notes = noteParts.filter(Boolean).join(' · ')

      const status = rawStatus ? normalizeStatus(rawStatus) : 'available'

      const key = label.toLowerCase()
      if (spotMap.has(key)) {
        // Update existing
        const existing = spotMap.get(key)!
        spotMap.set(key, { ...existing, vesselName, ownerName, notes, status })
      } else {
        // Add new — place at next row
        maxRow++
        const newSpot: YardSpot = {
          id: `imp-${Date.now()}-${idx}`,
          row: maxRow,
          col: maxCol,
          label,
          vesselName,
          ownerName,
          notes,
          status,
        }
        spotMap.set(key, newSpot)
      }
      imported++
    })

    const updated = Array.from(spotMap.values())
    saveSpots(updated)
    setImportCount(imported)
    setStage('done')
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'boat-buddy-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isAdmiral) return null

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Link href="/yard" style={{ color: 'rgba(245,240,232,0.5)', textDecoration: 'none', fontSize: '18px' }}>←</Link>
        <Logo size="sm" />
        <span className="text-sm font-bold ml-auto" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>📥 Import Data</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-28">
        <h1 className="text-xl font-bold mb-1" style={headStyle}>Import Yard Data</h1>
        <p className="text-sm mb-5" style={dimStyle}>Upload a CSV file to bulk-import slip assignments into the Yard Manager.</p>

        {/* ── Stage: Upload ── */}
        {stage === 'upload' && (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl py-12 px-6 text-center mb-4"
              style={{
                background: isDragging ? 'rgba(74,144,226,0.15)' : 'rgba(10,20,40,0.7)',
                border: `2px dashed ${isDragging ? '#4A90E2' : 'rgba(74,144,226,0.3)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              <span style={{ fontSize: '2.5rem' }}>📄</span>
              <p className="text-sm mt-3 font-bold" style={headStyle}>Drop CSV here or click to browse</p>
              <p className="text-xs mt-1" style={dimStyle}>.csv files only</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleInputChange} style={{ display: 'none' }} />
            </div>

            {/* Sample download */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(10,20,40,0.5)', border: '1px solid rgba(74,144,226,0.15)' }}>
              <p className="text-sm font-bold mb-1" style={headStyle}>Expected Format</p>
              <pre className="text-xs overflow-x-auto mb-3" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'monospace', lineHeight: '1.6' }}>
                {`Slip,Vessel Name,Owner,Phone,Email,Notes,Status\nA1,Sea Breeze,John Smith,410-555-1234,...`}
              </pre>
              <p className="text-xs mb-3" style={dimStyle}>Column order doesn&apos;t matter — you&apos;ll map them in the next step.</p>
              <button onClick={downloadSample}
                className="text-xs px-4 py-2 rounded-lg"
                style={{ background: 'rgba(198,139,58,0.18)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                ⬇️ Download Sample CSV
              </button>
            </div>
          </>
        )}

        {/* ── Stage: Column Mapper ── */}
        {stage === 'map' && (
          <>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.2)' }}>
              <p className="text-sm font-bold mb-3" style={headStyle}>Map Your Columns</p>
              <p className="text-xs mb-4" style={dimStyle}>We detected {headers.length} column{headers.length !== 1 ? 's' : ''}. Map each to a Boat Buddy field.</p>

              <div className="flex flex-col gap-3">
                {headers.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1 text-xs px-3 py-2 rounded-lg truncate" style={{ background: 'rgba(255,255,255,0.06)', color: '#F5F0E8', fontFamily: 'Georgia, serif', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {header}
                    </div>
                    <span style={{ color: 'rgba(245,240,232,0.3)', fontSize: '12px' }}>→</span>
                    <select
                      value={mapping[idx]}
                      onChange={e => {
                        const updated = [...mapping]
                        updated[idx] = e.target.value as FieldKey
                        setMapping(updated)
                      }}
                      className="flex-1 text-xs px-2 py-2 rounded-lg"
                      style={{ background: '#0d1f3c', color: '#F5F0E8', border: '1px solid rgba(74,144,226,0.3)', fontFamily: 'Georgia, serif', outline: 'none', cursor: 'pointer' }}>
                      {FIELD_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl mb-4 overflow-hidden" style={{ border: '1px solid rgba(74,144,226,0.2)' }}>
              <div className="px-4 py-2.5" style={{ background: 'rgba(74,144,226,0.12)', borderBottom: '1px solid rgba(74,144,226,0.2)' }}>
                <p className="text-xs font-bold" style={headStyle}>Preview (first {previewRows.length} rows)</p>
              </div>
              <div className="overflow-x-auto">
                {previewRows.map((row, rowIdx) => {
                  const label = getMappedValue(row, 'label') || `Row ${rowIdx + 1}`
                  const vessel = getMappedValue(row, 'vesselName')
                  const owner = getMappedValue(row, 'ownerName')
                  const status = getMappedValue(row, 'status')
                  return (
                    <div key={rowIdx} className="flex items-center gap-3 px-4 py-2.5"
                      style={{ borderBottom: '1px solid rgba(74,144,226,0.08)', background: rowIdx % 2 === 0 ? 'rgba(10,20,40,0.6)' : 'rgba(10,20,40,0.3)' }}>
                      <span className="text-xs font-bold w-10 shrink-0" style={{ color: '#4A90E2', fontFamily: 'Georgia, serif' }}>{label}</span>
                      <span className="text-xs flex-1 truncate" style={headStyle}>{vessel || <span style={{ color: 'rgba(245,240,232,0.3)' }}>—</span>}</span>
                      <span className="text-xs flex-1 truncate" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>{owner || '—'}</span>
                      <span className="text-xs w-16 text-right capitalize shrink-0" style={{ color: status ? 'rgba(245,240,232,0.7)' : 'rgba(245,240,232,0.3)', fontFamily: 'Georgia, serif' }}>{status || 'available'}</span>
                    </div>
                  )
                })}
              </div>
              {csvRows.length > 5 && (
                <div className="px-4 py-2" style={{ background: 'rgba(10,20,40,0.4)' }}>
                  <p className="text-xs" style={dimStyle}>+{csvRows.length - 5} more rows…</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStage('upload')}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={doImport}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: '#4A90E2', color: '#fff', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                Import {csvRows.length} Record{csvRows.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {/* ── Stage: Done ── */}
        {stage === 'done' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span style={{ fontSize: '3.5rem' }}>✅</span>
            <h2 className="text-xl font-bold mt-4 mb-2" style={headStyle}>Import Complete!</h2>
            <p className="text-base mb-1" style={{ color: '#4A90E2', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              Imported {importCount} record{importCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm mb-8" style={dimStyle}>
              Existing slips with matching labels were updated. New slips were added to the grid.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link href="/yard"
                className="py-3 rounded-xl text-sm font-bold text-center"
                style={{ background: '#4A90E2', color: '#fff', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
                ⚓ View Yard Manager
              </Link>
              <button onClick={() => setStage('upload')}
                className="py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                📥 Import Another File
              </button>
            </div>
          </div>
        )}
      </main>

      <NavBar />
    </div>
  )
}
