'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth, userKey } from '@/lib/auth'

function useOverdueCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(userKey('boat_buddy_maintenance'))
      if (!stored) return
      const items = JSON.parse(stored)
      const today = new Date().setHours(0, 0, 0, 0)
      let overdue = 0
      for (const item of items) {
        if (!item.enabled) continue
        if (!item.lastDoneDate) { overdue++; continue }
        const daysSince = Math.floor((today - new Date(item.lastDoneDate).getTime()) / 86400000)
        if (item.intervalDays - daysSince < 0) overdue++
      }
      setCount(overdue)
    } catch {}
  }, [])
  return count
}

export default function NavBar() {
  const pathname = usePathname()
  const auth = getAuth()
  const sub = auth?.subscription || 'stow_away'
  const isTeam = sub === 'captain' || sub === 'admiral'
  const overdueCount = useOverdueCount()

  const MaintBadge = overdueCount > 0 ? (
    <span style={{
      position: 'absolute',
      top: 2,
      right: 2,
      background: '#ef4444',
      borderRadius: '50%',
      width: 8,
      height: 8,
      display: 'block',
    }} />
  ) : null

  if (isTeam) {
    // Captain / Admiral nav
    return (
      <nav className="nav-bar fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', overflowX: 'auto' }}>
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">⚓</span>
          <span>AI</span>
        </Link>
        <Link href="/history" className={`nav-item ${pathname === '/history' ? 'active' : ''}`}>
          <span className="nav-icon">📋</span>
          <span>History</span>
        </Link>
        <Link href="/vessel" className={`nav-item ${pathname === '/vessel' ? 'active' : ''}`}>
          <span className="nav-icon">🚢</span>
          <span>Vessel</span>
        </Link>
        <Link href="/service" className={`nav-item ${pathname === '/service' ? 'active' : ''}`}>
          <span className="nav-icon">🔧</span>
          <span>Service</span>
        </Link>
        <Link href="/maintenance" className={`nav-item ${pathname === '/maintenance' ? 'active' : ''}`} style={{ position: 'relative' }}>
          {MaintBadge}
          <span className="nav-icon">🔔</span>
          <span>Maint</span>
        </Link>
        <Link href="/yard" className={`nav-item ${pathname === '/yard' ? 'active' : ''}`}>
          <span className="nav-icon">🏗️</span>
          <span>Yard</span>
        </Link>
        <Link href="/marina" className={`nav-item ${pathname === '/marina' ? 'active' : ''}`}>
          <span className="nav-icon">⛵</span>
          <span>Marina</span>
        </Link>
        <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    )
  }

  // Default nav - Stow Away / First Mate (Yard + Marina link to add-on page)
  const isPaid = sub === 'first_mate' || sub === 'team_member'
  return (
    <nav className="nav-bar fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', overflowX: 'auto' }}>
      <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
        <span className="nav-icon">⚓</span>
        <span>Chat</span>
      </Link>
      <Link href="/history" className={`nav-item ${pathname === '/history' ? 'active' : ''}`}>
        <span className="nav-icon">📋</span>
        <span>History</span>
      </Link>
      <Link href="/vessel" className={`nav-item ${pathname === '/vessel' ? 'active' : ''}`}>
        <span className="nav-icon">🚢</span>
        <span>Vessel</span>
      </Link>
      <Link href="/maintenance" className={`nav-item ${pathname === '/maintenance' ? 'active' : ''}`} style={{ position: 'relative' }}>
        {MaintBadge}
        <span className="nav-icon">🔔</span>
        <span>Maint</span>
      </Link>
      <Link href="/yard" className={`nav-item ${pathname === '/yard' ? 'active' : ''}`}>
        <span className="nav-icon">🏗️</span>
        <span>Yard</span>
      </Link>
      <Link href="/marina" className={`nav-item ${pathname === '/marina' ? 'active' : ''}`}>
        <span className="nav-icon">⛵</span>
        <span>Marina</span>
      </Link>
      <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
        <span className="nav-icon">⚙️</span>
        <span>Settings</span>
      </Link>
    </nav>
  )
}
