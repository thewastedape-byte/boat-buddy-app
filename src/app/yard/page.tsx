'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth, userKey } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

// ── Storage keys ──
const YARD_SPOTS_KEY = 'bb_yard_spots'
const YARD_CONFIG_KEY = 'bb_yard_config'
const YARD_IMAGE_KEY = 'bb_yard_image'
const YARD_PINS_KEY = 'bb_yard_pins'
const YARD_SAT_PINS_KEY = 'bb_yard_sat_pins'
const GMAPS_API_KEY = 'AIzaSyAWt36-XbSJ_i2DJoXRTxheVaX_k-2eIsE'

// ── Types ──
type SpotStatus = 'available' | 'occupied' | 'reserved'
type TabType = 'grid' | 'custom' | 'satellite'

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

interface YardPin {
  id: string
  x: number // percentage of image width
  y: number // percentage of image height
  label: string
  vesselName: string
  ownerName: string
  notes: string
  status: SpotStatus
}

// ── Helpers ──
function generateLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + row)}${col + 1}`
}

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

// ── Styles ──
const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
const headStyle = { color: '#F5F0E8', fontFamily: 'Georgia, serif' }
const goldStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

// ── Spot Modal (shared between grid + custom map + satellite) ──
interface PinModalProps {
  title: string
  form: { vesselName: string; ownerName: string; notes: string; status: SpotStatus }
  onChange: (f: { vesselName: string; ownerName: string; notes: string; status: SpotStatus }) => void
  onSave: () => void
  onClose: () => void
  extraInfo?: string
}

function SlipModal({ title, form, onChange, onSave, onClose, extraInfo }: PinModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5" style={{ background: '#0d1f3c', border: '1px solid rgba(74,144,226,0.3)', borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={headStyle}>{title}</h2>
          <button onClick={onClose} style={{ color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {extraInfo && <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>{extraInfo}</p>}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs mb-1 block" style={dimStyle}>Status</label>
            <div className="flex gap-2">
              {(['available', 'occupied', 'reserved'] as SpotStatus[]).map(s => (
                <button key={s} onClick={() => onChange({ ...form, status: s })}
                  className="text-xs px-3 py-1.5 rounded-lg capitalize flex-1"
                  style={{
                    background: form.status === s ? (s === 'occupied' ? '#4A90E2' : s === 'reserved' ? '#C68B3A' : 'rgba(20,40,80,0.9)') : 'rgba(255,255,255,0.05)',
                    color: form.status === s ? (s === 'available' ? '#4A90E2' : '#fff') : 'rgba(245,240,232,0.4)',
                    border: form.status === s ? (s === 'occupied' ? '1px solid #4A90E2' : s === 'reserved' ? '1px solid #C68B3A' : '1px solid rgba(74,144,226,0.5)') : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', fontFamily: 'Georgia, serif',
                  }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={dimStyle}>Vessel Name</label>
            <input value={form.vesselName} onChange={e => onChange({ ...form, vesselName: e.target.value })}
              placeholder="e.g. Sea Wolf" className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(74,144,226,0.25)', color: '#F5F0E8', fontFamily: 'Georgia, serif', outline: 'none' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={dimStyle}>Owner Name</label>
            <input value={form.ownerName} onChange={e => onChange({ ...form, ownerName: e.target.value })}
              placeholder="e.g. John Smith" className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(74,144,226,0.25)', color: '#F5F0E8', fontFamily: 'Georgia, serif', outline: 'none' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={dimStyle}>Notes</label>
            <textarea value={form.notes} onChange={e => onChange({ ...form, notes: e.target.value })}
              placeholder="Storage notes, contact info, dates..." rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(74,144,226,0.25)', color: '#F5F0E8', fontFamily: 'Georgia, serif', outline: 'none' }} />
          </div>
          <button onClick={onSave} className="w-full py-3 rounded-xl text-sm font-bold mt-1"
            style={{ background: '#4A90E2', color: '#fff', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
            Save Slip
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty pin form ──
const emptyPinForm = { vesselName: '', ownerName: '', notes: '', status: 'available' as SpotStatus }

// ── Main Page ──
export default function YardPage() {
  const router = useRouter()
  const auth = getAuth()
  const [liveSub, setLiveSub] = useState<string | null>(null)
  const sub = liveSub || auth?.subscription || 'sailor'
  const isAdmiral = sub === 'admiral'
  const isCaptainPlus = sub === 'captain' || sub === 'admiral'
  const hasYardAddon = (auth as { yardAddon?: boolean } | null)?.yardAddon === true
  const hasYardAccess = isCaptainPlus || hasYardAddon

  // Tab state — grid is default
  const [activeTab, setActiveTab] = useState<TabType>('grid')

  // ── Grid state ──
  const [spots, setSpots] = useState<YardSpot[]>([])
  const [config, setConfig] = useState<YardConfig>({ rows: 10, cols: 10 })
  const [selectedSpot, setSelectedSpot] = useState<YardSpot | null>(null)
  const [showEditLayout, setShowEditLayout] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [draftConfig, setDraftConfig] = useState<YardConfig>({ rows: 10, cols: 10 })
  const [gridForm, setGridForm] = useState(emptyPinForm)

  // ── Custom map state ──
  const [yardImage, setYardImage] = useState<string | null>(null)
  const [pins, setPins] = useState<YardPin[]>([])
  const [selectedPin, setSelectedPin] = useState<YardPin | null>(null)
  const [pinForm, setPinForm] = useState(emptyPinForm)
  const [showClearPinsConfirm, setShowClearPinsConfirm] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // ── Satellite state ──
  const [satPins, setSatPins] = useState<YardPin[]>([])
  const [selectedSatPin, setSelectedSatPin] = useState<YardPin | null>(null)
  const [satPinForm, setSatPinForm] = useState(emptyPinForm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [pendingSatPin, setPendingSatPin] = useState<{ lat: number; lng: number } | null>(null)

  // ── Init ──
  useEffect(() => {
  if (auth?.email) {
    fetch('https://gemini-marine-api.onrender.com/api/db/users/' + encodeURIComponent(auth.email))
      .then(r => r.json())
      .then(u => { if (u?.subscription) setLiveSub(u.subscription) })
      .catch(() => {})
  }
}, [auth?.email])
useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    const c = loadLS<YardConfig>(YARD_CONFIG_KEY, { rows: 10, cols: 10 })
    setConfig(c)
    setDraftConfig(c)
    setSpots(loadLS<YardSpot[]>(YARD_SPOTS_KEY, []))
    setYardImage(loadLS<string | null>(YARD_IMAGE_KEY, null))
    setPins(loadLS<YardPin[]>(YARD_PINS_KEY, []))
    setSatPins(loadLS<YardPin[]>(YARD_SAT_PINS_KEY, []))
  }, [router])

  // ── Live subscription lookup ──
  useEffect(() => {
    if (auth?.email) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
      fetch(`${apiBase}/api/db/users/${encodeURIComponent(auth.email)}`)
        .then(r => r.json())
        .then(u => { if (u?.subscription) setLiveSub(u.subscription) })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.email])

  // ──────────────────────────────────────────────────────────────
  // GRID helpers
  // ──────────────────────────────────────────────────────────────
  const getSpot = useCallback((row: number, col: number): YardSpot => {
    const found = spots.find(s => s.row === row && s.col === col)
    if (found) return found
    return { id: `${row}-${col}`, row, col, label: generateLabel(row, col), vesselName: '', ownerName: '', notes: '', status: 'available' }
  }, [spots])

  const openSpot = (row: number, col: number) => {
    const spot = getSpot(row, col)
    setSelectedSpot(spot)
    setGridForm({ vesselName: spot.vesselName, ownerName: spot.ownerName, notes: spot.notes, status: spot.status })
  }

  const saveSpot = () => {
    if (!selectedSpot) return
    const updated: YardSpot = { ...selectedSpot, ...gridForm }
    const newSpots = spots.filter(s => !(s.row === updated.row && s.col === updated.col))
    newSpots.push(updated)
    setSpots(newSpots)
    saveLS(YARD_SPOTS_KEY, newSpots)
    setSelectedSpot(null)
  }

  const clearAll = () => {
    setSpots([])
    saveLS(YARD_SPOTS_KEY, [])
    setShowClearConfirm(false)
  }

  const applyLayout = () => {
    setConfig(draftConfig)
    saveLS(YARD_CONFIG_KEY, draftConfig)
    const trimmed = spots.filter(s => s.row < draftConfig.rows && s.col < draftConfig.cols)
    setSpots(trimmed)
    saveLS(YARD_SPOTS_KEY, trimmed)
    setShowEditLayout(false)
  }

  const spotColor = (spot: YardSpot) => spot.status === 'occupied' ? '#4A90E2' : spot.status === 'reserved' ? 'rgba(198,139,58,0.5)' : 'rgba(20,40,80,0.8)'
  const spotBorder = (spot: YardSpot) => spot.status === 'occupied' ? '#4A90E2' : spot.status === 'reserved' ? '#C68B3A' : 'rgba(74,144,226,0.25)'

  // ──────────────────────────────────────────────────────────────
  // CUSTOM MAP helpers
  // ──────────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target?.result as string
      setYardImage(b64)
      localStorage.setItem(userKey(YARD_IMAGE_KEY), b64)
    }
    reader.readAsDataURL(file)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const newPin: YardPin = {
      id: Date.now().toString(),
      x, y,
      label: `P${pins.length + 1}`,
      vesselName: '', ownerName: '', notes: '', status: 'available',
    }
    const updated = [...pins, newPin]
    setPins(updated)
    saveLS(YARD_PINS_KEY, updated)
    setSelectedPin(newPin)
    setPinForm(emptyPinForm)
  }

  const openPin = (pin: YardPin, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPin(pin)
    setPinForm({ vesselName: pin.vesselName, ownerName: pin.ownerName, notes: pin.notes, status: pin.status })
  }

  const savePin = () => {
    if (!selectedPin) return
    const updated = pins.map(p => p.id === selectedPin.id ? { ...p, ...pinForm } : p)
    setPins(updated)
    saveLS(YARD_PINS_KEY, updated)
    setSelectedPin(null)
  }

  const clearPins = () => {
    setPins([])
    saveLS(YARD_PINS_KEY, [])
    setShowClearPinsConfirm(false)
  }

  const pinDotColor = (status: SpotStatus) => status === 'occupied' ? '#4A90E2' : status === 'reserved' ? '#C68B3A' : '#6ab0f5'
  const pinBgColor = (status: SpotStatus) => status === 'occupied' ? '#4A90E2' : status === 'reserved' ? '#C68B3A' : 'rgba(106,176,245,0.25)'

  // ──────────────────────────────────────────────────────────────
  // SATELLITE / GOOGLE MAPS
  // ──────────────────────────────────────────────────────────────
  const loadGoogleMaps = useCallback(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google) {
      setMapsLoaded(true)
      return
    }
    if (document.getElementById('gmaps-script')) return
    const script = document.createElement('script')
    script.id = 'gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setMapsLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Load maps only when satellite tab is active
  useEffect(() => {
    if (activeTab === 'satellite' && isAdmiral) {
      loadGoogleMaps()
    }
  }, [activeTab, isAdmiral, loadGoogleMaps])

  // Init map when script is loaded and tab is satellite
  useEffect(() => {
    if (!mapsLoaded || activeTab !== 'satellite' || !mapRef.current || mapInstanceRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google
    if (!g) return

    const defaultCenter = { lat: 38.9, lng: -77.0 }
    const map = new g.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 16,
      mapTypeId: 'hybrid',
      disableDefaultUI: false,
      gestureHandling: 'greedy',
    })
    mapInstanceRef.current = map

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos: GeolocationPosition) => {
        map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, () => {})
    }

    // Render existing sat pins as markers
    renderSatMarkers(map, satPins, g)

    // Click to add new pin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.addListener('click', (e: any) => {
      if (!e.latLng) return
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setPendingSatPin({ lat, lng })
      setSatPinForm(emptyPinForm)
      setSelectedSatPin(null)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, activeTab])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderSatMarkers = (map: any, pinsToRender: YardPin[], g: any) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    pinsToRender.forEach(pin => {
      if (!pin.x || !pin.y) return // x = lat, y = lng for sat pins
      const marker = new g.maps.Marker({
        position: { lat: pin.x, lng: pin.y },
        map,
        title: pin.label,
        icon: {
          path: 0, // google.maps.SymbolPath.CIRCLE
          scale: 8,
          fillColor: pinDotColor(pin.status),
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        label: { text: pin.label, color: '#fff', fontSize: '9px', fontWeight: 'bold' },
      })
      marker.addListener('click', () => {
        setSelectedSatPin(pin)
        setSatPinForm({ vesselName: pin.vesselName, ownerName: pin.ownerName, notes: pin.notes, status: pin.status })
        setPendingSatPin(null)
      })
      markersRef.current.push(marker)
    })
  }

  // Re-render markers when satPins changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google
    if (!g) return
    renderSatMarkers(mapInstanceRef.current, satPins, g)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satPins, mapsLoaded])

  const saveSatPin = () => {
    if (pendingSatPin) {
      // New pin from map click
      const newPin: YardPin = {
        id: Date.now().toString(),
        x: pendingSatPin.lat,
        y: pendingSatPin.lng,
        label: `P${satPins.length + 1}`,
        ...satPinForm,
      }
      const updated = [...satPins, newPin]
      setSatPins(updated)
      saveLS(YARD_SAT_PINS_KEY, updated)
      setPendingSatPin(null)
    } else if (selectedSatPin) {
      // Update existing
      const updated = satPins.map(p => p.id === selectedSatPin.id ? { ...p, ...satPinForm } : p)
      setSatPins(updated)
      saveLS(YARD_SAT_PINS_KEY, updated)
      setSelectedSatPin(null)
    }
  }

  // ──────────────────────────────────────────────────────────────
  // LOCKED VIEW
  // ──────────────────────────────────────────────────────────────
  if (!hasYardAccess) {
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
          <div className="relative w-full max-w-sm mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(198,139,58,0.3)' }}>
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none', background: 'rgba(10,20,40,0.9)', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '3px' }}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} style={{ height: '28px', borderRadius: '4px', background: i % 5 === 0 ? '#4A90E2' : i % 7 === 0 ? 'rgba(198,139,58,0.5)' : 'rgba(20,40,80,0.8)', border: '1px solid rgba(74,144,226,0.2)' }} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(10,20,40,0.65)' }}>
              <span style={{ fontSize: '2.5rem' }}>🔒</span>
              <p className="text-sm font-bold mt-2" style={headStyle}>Yard Manager Locked</p>
            </div>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ ...headStyle, fontFamily: 'Georgia, serif' }}>⚓ Yard Manager</h1>
          <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ ...dimStyle, color: '#333333' }}>
            Yard Manager is included with <strong style={goldStyle}>Captain</strong> and <strong style={goldStyle}>Admiral</strong> plans, or available as an add-on for $29/mo
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/upgrade" className="text-sm px-5 py-3 rounded-xl text-center font-bold"
              style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⬆️ Upgrade Plan
            </Link>
            <Link href="/yard-addon-checkout" className="text-sm px-5 py-3 rounded-xl text-center"
              style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
              ⚓ Add Yard Manager ($29/mo)
            </Link>
          </div>
        </main>
        <NavBar />
      </div>
    )
  }

  const occupiedCount = spots.filter(s => s.status === 'occupied').length
  const reservedCount = spots.filter(s => s.status === 'reserved').length
  const totalSlips = config.rows * config.cols

  // ──────────────────────────────────────────────────────────────
  // FULL YARD MANAGER
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <span className="text-sm font-bold" style={goldStyle}>⚓ Yard Manager</span>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 pb-28">
        {/* ── View Tabs ── */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {/* Grid — always available to captain+ */}
          <TabPill label="Grid View" active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} />

          {/* Custom Map — captain+ */}
          {isCaptainPlus
            ? <TabPill label="Custom Map" active={activeTab === 'custom'} onClick={() => setActiveTab('custom')} />
            : <TabPill label="🔒 Custom Map" active={false} locked onClick={() => {}} />
          }

          {/* Satellite — admiral only */}
          {isAdmiral
            ? <TabPill label="Satellite" active={activeTab === 'satellite'} onClick={() => setActiveTab('satellite')} />
            : <TabPill label="🔒 Satellite" active={false} locked onClick={() => {}} />
          }

          {/* Import Data — admiral only, link */}
          {isAdmiral && (
            <Link href="/yard/import"
              className="text-xs px-4 py-2 rounded-full ml-auto"
              style={{ background: '#C68B3A', color: '#3D1C02', border: '2px solid #C68B3A', fontFamily: 'Georgia, serif', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
              📥 Import Data
            </Link>
          )}
        </div>

        {/* ───────── GRID VIEW ───────── */}
        {activeTab === 'grid' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl font-bold" style={headStyle}>Boat Yard</h1>
              <div className="flex gap-2">
                <button onClick={() => { setDraftConfig(config); setShowEditLayout(true) }}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#1B3A5C', color: '#FFFFFF', border: '2px solid #4A90E2', fontFamily: 'Georgia, serif', cursor: 'pointer', fontWeight: '600' }}>
                  ✏️ Edit Layout
                </button>
                <button onClick={() => setShowClearConfirm(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: '#8B1A1A', color: '#FFFFFF', border: '2px solid #e87070', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  🗑 Clear All
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-4 text-xs font-bold" style={{ background: 'rgba(255,255,255,0.75)', borderRadius: '8px', padding: '6px 10px', fontFamily: 'Georgia, serif', color: '#1A0A00' }}>
              <span>{totalSlips} slips</span>
              <span style={{ color: '#1B3A5C' }}>● {occupiedCount} occupied</span>
              <span style={{ color: '#8B4500' }}>● {reservedCount} reserved</span>
              <span>● {totalSlips - occupiedCount - reservedCount} open</span>
            </div>

            <div className="flex gap-3 mb-3 text-xs flex-wrap" style={{ background: 'rgba(255,255,255,0.75)', borderRadius: '8px', padding: '6px 10px' }}>
              {[
                { color: 'rgba(20,40,80,0.8)', border: 'rgba(74,144,226,0.25)', label: 'Available' },
                { color: '#4A90E2', border: '#4A90E2', label: 'Occupied' },
                { color: 'rgba(198,139,58,0.5)', border: '#C68B3A', label: 'Reserved' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color, border: `1px solid ${item.border}` }} />
                  <span style={{ color: '#1A0A00', fontFamily: 'Georgia, serif', fontWeight: '600' }}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl" style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(74,144,226,0.2)', padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.cols}, minmax(36px, 1fr))`, gap: '4px', minWidth: config.cols * 40 }}>
                {Array.from({ length: config.rows }).map((_, row) =>
                  Array.from({ length: config.cols }).map((_, col) => {
                    const spot = getSpot(row, col)
                    return (
                      <button key={`${row}-${col}`} onClick={() => openSpot(row, col)}
                        title={`${spot.label}${spot.vesselName ? ` – ${spot.vesselName}` : ''}`}
                        style={{
                          height: '40px', borderRadius: '5px', background: spotColor(spot),
                          border: `1px solid ${spotBorder(spot)}`, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px', fontFamily: 'Georgia, serif',
                          color: spot.status === 'available' ? 'rgba(74,144,226,0.6)' : '#fff',
                          fontWeight: 'bold', transition: 'transform 0.1s, opacity 0.1s', padding: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                        {spot.label}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* ───────── CUSTOM MAP VIEW ───────── */}
        {activeTab === 'custom' && isCaptainPlus && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold" style={headStyle}>Custom Map</h1>
              <div className="flex gap-2">
                {yardImage && (
                  <button onClick={() => setShowClearPinsConfirm(true)}
                    className="text-xs px-3 py-1.5 rounded-lg font-bold"
                    style={{ background: '#8B1A1A', color: '#FFFFFF', border: '2px solid #e87070', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    🗑 Clear Pins
                  </button>
                )}
              </div>
            </div>

            {!yardImage ? (
              <div className="flex flex-col items-center justify-center rounded-xl py-16 px-6 text-center"
                style={{ background: 'rgba(10,20,40,0.7)', border: '2px dashed rgba(74,144,226,0.3)' }}>
                <span style={{ fontSize: '3rem' }}>🗺️</span>
                <p className="text-sm mt-3 mb-4" style={dimStyle}>Upload an aerial photo or diagram of your boat yard</p>
                <label className="text-sm px-5 py-3 rounded-xl font-bold cursor-pointer"
                  style={{ background: '#4A90E2', color: '#fff', fontFamily: 'Georgia, serif' }}>
                  📁 Upload Yard Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-3 items-center">
                  <label className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                    style={{ background: 'rgba(74,144,226,0.15)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.3)', fontFamily: 'Georgia, serif' }}>
                    🔄 Change Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  <span className="text-xs" style={dimStyle}>Tap image to drop a pin • {pins.length} pin{pins.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Legend */}
                <div className="flex gap-3 mb-2 text-xs flex-wrap">
                  {[
                    { color: '#6ab0f5', label: 'Available' },
                    { color: '#4A90E2', label: 'Occupied' },
                    { color: '#C68B3A', label: 'Reserved' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Map container */}
                <div ref={imgRef} onClick={handleImageClick}
                  className="relative rounded-xl overflow-hidden"
                  style={{ cursor: 'crosshair', border: '1px solid rgba(74,144,226,0.3)', maxHeight: '500px', touchAction: 'none' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={yardImage} alt="Yard map" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', maxHeight: '500px', pointerEvents: 'none' }} />

                  {/* Pins overlay */}
                  {pins.map(pin => (
                    <button key={pin.id}
                      onClick={e => openPin(pin, e)}
                      title={`${pin.label}${pin.vesselName ? ` – ${pin.vesselName}` : ''}`}
                      style={{
                        position: 'absolute',
                        left: `${pin.x}%`,
                        top: `${pin.y}%`,
                        transform: 'translate(-50%, -50%)',
                        background: pinBgColor(pin.status),
                        border: `2px solid ${pinDotColor(pin.status)}`,
                        borderRadius: '50%',
                        width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        padding: 0,
                        transition: 'transform 0.15s',
                        fontSize: '10px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontFamily: 'Georgia, serif',
                        boxShadow: `0 0 0 2px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5)`,
                      }}>
                      ⚓
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.3)', fontFamily: 'Georgia, serif' }}>
                  Tap anywhere on the map to add a slip pin
                </p>
              </>
            )}
          </>
        )}

        {/* ───────── SATELLITE VIEW ───────── */}
        {activeTab === 'satellite' && (
          <>
            {!isAdmiral ? (
              <LockedTabMessage
                icon="🛰️"
                title="Satellite View — Admiral Only"
                message="Upgrade to the Admiral plan to access satellite mapping with Google Maps integration."
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-xl font-bold" style={headStyle}>Satellite View</h1>
                  <span className="text-xs" style={dimStyle}>{satPins.length} pin{satPins.length !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs mb-3" style={dimStyle}>Click anywhere on the map to drop a slip marker</p>

                <div style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(74,144,226,0.3)', background: 'rgba(255,255,255,0.88)', padding: '28px 20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '2.5rem' }}>🛰️</span>
                  <p className="text-sm font-bold mt-3 mb-1" style={{ color: '#1A0A00', fontFamily: 'Georgia, serif' }}>Satellite View — Coming Soon</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(26,10,0,0.6)', fontFamily: 'Georgia, serif' }}>Google Maps is being configured. Use the Custom Map tab to upload your yard layout and drop pins on it.</p>
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', background: '#1B3A5C', color: '#fff', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontFamily: 'Georgia, serif' }}>
                    Open Google Maps ↗
                  </a>
                </div>
                <div ref={mapRef} style={{ display: 'none' }} />

                {satPins.length > 0 && (
                  <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(74,144,226,0.15)' }}>
                    {satPins.map(pin => (
                      <div key={pin.id} className="flex items-center gap-3 px-3 py-2.5"
                        style={{ borderBottom: '1px solid rgba(74,144,226,0.1)', background: 'rgba(10,20,40,0.5)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: pinDotColor(pin.status), flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={headStyle}>{pin.label}{pin.vesselName ? ` — ${pin.vesselName}` : ''}</p>
                          {pin.ownerName && <p className="text-xs truncate" style={dimStyle}>{pin.ownerName}</p>}
                        </div>
                        <span className="text-xs capitalize" style={{ color: pinDotColor(pin.status), fontFamily: 'Georgia, serif' }}>{pin.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Modals ── */}

      {/* Grid spot modal */}
      {selectedSpot && (
        <SlipModal
          title={`Slip ${selectedSpot.label}`}
          form={gridForm}
          onChange={setGridForm}
          onSave={saveSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}

      {/* Custom map pin modal */}
      {selectedPin && (
        <SlipModal
          title={`Pin ${selectedPin.label}`}
          form={pinForm}
          onChange={setPinForm}
          onSave={savePin}
          onClose={() => setSelectedPin(null)}
          extraInfo={`Position: ${selectedPin.x.toFixed(1)}%, ${selectedPin.y.toFixed(1)}%`}
        />
      )}

      {/* Satellite new pin modal */}
      {(pendingSatPin || selectedSatPin) && (
        <SlipModal
          title={pendingSatPin ? 'New Satellite Pin' : `Pin ${selectedSatPin?.label}`}
          form={satPinForm}
          onChange={setSatPinForm}
          onSave={saveSatPin}
          onClose={() => { setPendingSatPin(null); setSelectedSatPin(null) }}
          extraInfo={pendingSatPin ? `Lat: ${pendingSatPin.lat.toFixed(5)}, Lng: ${pendingSatPin.lng.toFixed(5)}` : selectedSatPin ? `Lat: ${selectedSatPin.x.toFixed(5)}, Lng: ${selectedSatPin.y.toFixed(5)}` : undefined}
        />
      )}

      {/* Grid Edit Layout Modal */}
      {showEditLayout && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowEditLayout(false)}>
          <div className="w-full max-w-lg rounded-t-2xl p-5" style={{ background: '#0d1f3c', border: '1px solid rgba(198,139,58,0.3)', borderBottom: 'none', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)', overflowY: 'auto', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={headStyle}>Edit Layout</h2>
              <button onClick={applyLayout} className="text-sm px-4 py-2 rounded-xl font-bold"
                style={{ background: '#C68B3A', color: '#3D1C02', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                Apply ({draftConfig.rows}×{draftConfig.cols})
              </button>
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
            </div>
          </div>
        </div>
      )}

      {/* Grid Clear Confirm */}
      {showClearConfirm && (
        <ConfirmModal
          message="This will remove all vessel assignments. The grid layout stays the same."
          onConfirm={clearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {/* Custom map clear pins confirm */}
      {showClearPinsConfirm && (
        <ConfirmModal
          message="This will remove all map pins. The uploaded image stays."
          onConfirm={clearPins}
          onCancel={() => setShowClearPinsConfirm(false)}
        />
      )}

      <NavBar />
    </div>
  )
}

// ── Helper components ──

function TabPill({ label, active, onClick, locked }: { label: string; active: boolean; onClick: () => void; locked?: boolean }) {
  return (
    <button onClick={onClick}
      className="text-xs px-4 py-2 rounded-full"
      style={{
        background: active ? '#1B3A5C' : locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.82)',
        color: active ? '#fff' : locked ? 'rgba(26,10,0,0.4)' : '#1A0A00',
        border: active ? '2px solid #1B3A5C' : locked ? '1px solid rgba(26,10,0,0.15)' : '2px solid rgba(26,10,0,0.25)',
        cursor: locked ? 'default' : 'pointer',
        fontFamily: 'Georgia, serif',
        transition: 'all 0.15s',
      }}>
      {label}
    </button>
  )
}

function LockedTabMessage({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl"
      style={{ background: 'rgba(10,20,40,0.7)', border: '1px solid rgba(198,139,58,0.25)' }}>
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <p className="text-base font-bold mt-3 mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>🔒 {title}</p>
      <p className="text-xs max-w-xs leading-relaxed mb-5" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>{message}</p>
      <Link href="/upgrade" className="text-sm px-5 py-2.5 rounded-xl font-bold"
        style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
        ⬆️ Upgrade to Admiral
      </Link>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0d1f3c', border: '1px solid rgba(232,112,112,0.4)' }}>
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-base font-bold mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Are you sure?</h2>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>{message}</p>
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
