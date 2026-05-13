'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getAuth } from '@/lib/auth'

export default function NavBar() {
  const pathname = usePathname()
  const auth = getAuth()
  const sub = auth?.subscription || 'stow_away'
  const isTeam = sub === 'captain' || sub === 'admiral'

  if (isTeam) {
    // Captain / Admiral nav
    return (
      <nav className="nav-bar fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">🧠</span>
          <span>AI</span>
        </Link>
        <Link href="/service" className={`nav-item ${pathname === '/service' ? 'active' : ''}`}>
          <span className="nav-icon">🔩</span>
          <span>Service</span>
        </Link>
        <Link href="/yard" className={`nav-item ${pathname === '/yard' ? 'active' : ''}`}>
          <span className="nav-icon">⚓</span>
          <span>Yard</span>
        </Link>
        <Link href="/inventory" className={`nav-item ${pathname === '/inventory' ? 'active' : ''}`}>
          <span className="nav-icon">📦</span>
          <span>Inventory</span>
        </Link>
        <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    )
  }

  // Default nav — Sailor / First Mate (locked Yard)
  return (
    <nav className="nav-bar fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
        <span className="nav-icon">💬</span>
        <span>Chat</span>
      </Link>
      <Link href="/history" className={`nav-item ${pathname === '/history' ? 'active' : ''}`}>
        <span className="nav-icon">📋</span>
        <span>History</span>
      </Link>
      <Link href="/vessel" className={`nav-item ${pathname === '/vessel' ? 'active' : ''}`}>
        <span className="nav-icon">⚓</span>
        <span>Vessel</span>
      </Link>
      <Link href="/yard" className={`nav-item ${pathname === '/yard' ? 'active' : ''}`}>
        <span className="nav-icon">🔒</span>
        <span>Yard</span>
      </Link>
      <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
        <span className="nav-icon">⚙️</span>
        <span>Settings</span>
      </Link>
    </nav>
  )
}
