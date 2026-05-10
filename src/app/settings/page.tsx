'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth, logout, changePassword } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

export default function SettingsPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<{ email: string; name: string } | null>(null)
  const [darkMode] = useState(true)
  const [notifications, setNotifications] = useState(false)
  const [language, setLanguage] = useState('en')
  const [showChangePw, setShowChangePw] = useState(false)
  const [bizName, setBizName] = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [bizLogo, setBizLogo] = useState('')
  const [bizSaved, setBizSaved] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    const a = getAuth()
    setAuth(a)
    setNotifications(localStorage.getItem('bb_notifications') === 'true')
    setLanguage(localStorage.getItem('bb_language') || 'en')
    setBizName(localStorage.getItem('bb_biz_name') || '')
    setBizPhone(localStorage.getItem('bb_biz_phone') || '')
    setBizAddress(localStorage.getItem('bb_biz_address') || '')
    setBizLogo(localStorage.getItem('bb_biz_logo') || '')
  }, [router])

  const saveBizProfile = () => {
    localStorage.setItem('bb_biz_name', bizName)
    localStorage.setItem('bb_biz_phone', bizPhone)
    localStorage.setItem('bb_biz_address', bizAddress)
    if (bizLogo) localStorage.setItem('bb_biz_logo', bizLogo)
    setBizSaved(true)
    setTimeout(() => setBizSaved(false), 2000)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) { alert('Logo must be under 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setBizLogo(dataUrl)
      localStorage.setItem('bb_biz_logo', dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (!currentPw || !newPw || !confirmPw) { setPwError('Fill in all fields.'); return }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    const result = changePassword(auth?.email || '', currentPw, newPw)
    if (!result.success) { setPwError(result.error || 'Failed.'); return }
    setPwSuccess(true)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setTimeout(() => { setPwSuccess(false); setShowChangePw(false) }, 2000)
  }

  const handleClearData = () => {
    if (!confirm('Clear all app data including chat history?')) return
    const keys = Object.keys(localStorage).filter(k => k.startsWith('boat_buddy') || k.startsWith('chat_'))
    keys.forEach(k => localStorage.removeItem(k))
    router.push('/login')
  }

  const toggleNotifications = () => {
    const newVal = !notifications
    setNotifications(newVal)
    localStorage.setItem('bb_notifications', String(newVal))
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="text-xl font-bold mb-6" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
          ⚙️ Settings
        </h1>

        {/* Profile */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Account
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'rgba(198,139,58,0.3)', color: '#F5F0E8', border: '2px solid rgba(198,139,58,0.5)' }}>
              {auth?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{auth?.name || 'Captain'}</p>
              <p className="text-sm" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>{auth?.email}</p>
            </div>
          </div>
        </div>

        {/* Business Profile */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Business Profile</h2>
          <p className="text-xs mb-3" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Appears on work orders and invoices</p>
          <div className="flex flex-col gap-3">
            {/* Logo upload */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Business Logo</label>
              <div className="flex items-center gap-3">
                {bizLogo
                  ? <img src={bizLogo} alt="Logo" style={{ height: '48px', maxWidth: '120px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '4px' }} />
                  : <div className="flex items-center justify-center rounded-lg" style={{ width: '80px', height: '48px', background: 'rgba(198,139,58,0.1)', border: '1px dashed rgba(198,139,58,0.4)', color: 'rgba(198,139,58,0.5)', fontSize: '11px', fontFamily: 'Georgia, serif' }}>No logo</div>
                }
                <div className="flex flex-col gap-1">
                  <label className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                    style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
                    📁 Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {bizLogo && <button onClick={() => { setBizLogo(''); localStorage.removeItem('bb_biz_logo') }}
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(139,26,26,0.3)', fontFamily: 'Georgia, serif' }}>Remove</button>}
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.3)', fontFamily: 'Georgia, serif' }}>PNG or JPG, max 500KB. Shows on work orders.</p>
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Shop / Company Name</label>
              <input className="input-field" value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Solomons Marine Service" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Phone</label>
              <input className="input-field" value={bizPhone} onChange={e => setBizPhone(e.target.value)} placeholder="(410) 555-0000" />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Address</label>
              <input className="input-field" value={bizAddress} onChange={e => setBizAddress(e.target.value)} placeholder="123 Marina Dr, Solomons MD 20688" />
            </div>
            <button onClick={saveBizProfile} className="btn-primary w-full" style={{ fontSize: '14px', padding: '10px' }}>
              {bizSaved ? '✓ Saved!' : '💾 Save Business Profile'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="panel p-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Security</h2>
            <button onClick={() => { setShowChangePw(!showChangePw); setPwError(''); setPwSuccess(false) }}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
              {showChangePw ? 'Cancel' : '🔐 Change Password'}
            </button>
          </div>
          {showChangePw && (
            <form onSubmit={handleChangePassword} className="mt-4">
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>Current Password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="input-field" placeholder="Current password" />
              </div>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  className="input-field" placeholder="New password (min 6 chars)" />
              </div>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="input-field" placeholder="Confirm new password" />
              </div>
              {pwError && <p className="text-xs mb-2" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{pwError}</p>}
              {pwSuccess && <p className="text-xs mb-2" style={{ color: '#70c070', fontFamily: 'Georgia, serif' }}>Password changed successfully!</p>}
              <button type="submit" className="btn-primary w-full" style={{ fontSize: '14px', padding: '10px' }}>Update Password</button>
            </form>
          )}
        </div>

        {/* Language */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Language / Idioma / Langue</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: 'en', label: '🇺🇸 English' },
              { code: 'es', label: '🇪🇸 Español' },
              { code: 'fr', label: '🇫🇷 Français' },
              { code: 'pt', label: '🇧🇷 Português' },
              { code: 'de', label: '🇩🇪 Deutsch' },
              { code: 'nl', label: '🇳🇱 Nederlands' },
            ].map(lang => (
              <button key={lang.code}
                onClick={() => { setLanguage(lang.code); localStorage.setItem('bb_language', lang.code); }}
                className="text-sm py-2 px-3 rounded-lg text-left transition-all"
                style={{
                  background: language === lang.code ? '#C68B3A' : 'rgba(198,139,58,0.1)',
                  color: language === lang.code ? '#3D1C02' : '#F5F0E8',
                  border: language === lang.code ? 'none' : '1px solid rgba(198,139,58,0.3)',
                  fontFamily: 'Georgia, serif',
                  fontWeight: language === lang.code ? 'bold' : 'normal',
                  cursor: 'pointer',
                }}>
                {lang.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>AI responses will be in your selected language.</p>
        </div>

        {/* Preferences */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Preferences
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Dark Mode</p>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Always on for better visibility</p>
            </div>
            <div className="w-10 h-6 rounded-full flex items-center px-0.5"
              style={{ background: '#C68B3A' }}>
              <div className="w-5 h-5 rounded-full ml-auto" style={{ background: '#3D1C02' }} />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'rgba(198,139,58,0.2)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Push Notifications</p>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Coming soon</p>
            </div>
            <button onClick={toggleNotifications}
              className="w-10 h-6 rounded-full flex items-center px-0.5 transition-all"
              style={{ background: notifications ? '#C68B3A' : 'rgba(245,240,232,0.15)' }}>
              <div className={`w-5 h-5 rounded-full transition-all ${notifications ? 'ml-auto' : 'ml-0'}`}
                style={{ background: notifications ? '#3D1C02' : 'rgba(245,240,232,0.5)' }} />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            About
          </h2>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>App Version</p>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>1.0.0</p>
          </div>
          <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'rgba(198,139,58,0.2)' }}>
            <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>API</p>
            <p className="text-xs truncate max-w-32" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
              gemini-marine-api
            </p>
          </div>
          <Link href="/terms" className="flex items-center justify-between py-2 border-t"
            style={{ borderColor: 'rgba(198,139,58,0.2)' }}>
            <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Terms &amp; Conditions</p>
            <p style={{ color: 'rgba(198,139,58,0.7)' }}>→</p>
          </Link>
        </div>

        {/* Captain/Admiral Team Tools */}
        {(auth?.subscription === 'captain' || auth?.subscription === 'admiral') && (
          <div className="panel p-4 mb-4">
            <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Team Tools</h2>
            <div className="flex flex-col gap-2">
              <a href="/team" className="flex items-center justify-between py-2"
                style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', textDecoration: 'none', borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
                <div>
                  <p className="text-sm">⚓ Team Management</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Invite members, manage seats and roles</p>
                </div>
                <span style={{ color: '#C68B3A' }}>→</span>
              </a>
              <a href="/integrations" className="flex items-center justify-between py-2"
                style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', textDecoration: 'none', borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
                <div>
                  <p className="text-sm">🔗 Integrations & Webhooks</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>Zapier, CSV export, webhook setup</p>
                </div>
                <span style={{ color: '#C68B3A' }}>→</span>
              </a>
              <a href="/api-keys" className="flex items-center justify-between py-2"
                style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                <div>
                  <p className="text-sm">🔑 Connected Apps</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>QuickBooks, PierVantage, Google Sheets</p>
                </div>
                <span style={{ color: '#C68B3A' }}>→</span>
              </a>
            </div>
          </div>
        )}

        {/* Cancel Subscription */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Subscription</h2>
          {(() => {
            const sub = auth?.subscription || 'stow_away'
            const plans: Record<string, {name: string; desc: string}> = {
              stow_away: { name: 'Stow Away (Free)', desc: '10 messages / day' },
              first_mate: { name: 'First Mate', desc: '$19.99 / month — Unlimited access' },
              captain: { name: 'Captain', desc: '$79 / month — 5 seats' },
              admiral: { name: 'Admiral', desc: '$149 / month — 10 seats' },
            }
            const plan = plans[sub] || plans.stow_away
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{plan.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>{plan.desc}</p>
                </div>
                {sub !== 'stow_away' && (
                  <a href="/settings/cancel" className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(139,26,26,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
                    Cancel
                  </a>
                )}
              </div>
            )
          })()}
        </div>

        {/* Danger zone */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#8B1A1A', fontFamily: 'Georgia, serif' }}>
            Danger Zone
          </h2>
          <button onClick={handleClearData}
            className="w-full text-left py-2 text-sm"
            style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>
            🗑️ Clear All Data
          </button>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="btn-danger w-full mt-2">
          ⬅ Sign Out
        </button>
      </main>

      <NavBar />
    </div>
  )
}
