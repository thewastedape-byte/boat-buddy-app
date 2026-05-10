'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isLoggedIn, getAuth } from '@/lib/auth'
import NavBar from '@/components/NavBar'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
const APP_URL = 'https://boatbuddy.thewastedape.com'

interface TeamMember {
  id?: string
  email: string
  name?: string
  role: string
  subscription?: string
}

const SEAT_LIMITS: Record<string, number> = {
  captain: 5,
  admiral: 10,
}

export default function TeamPage() {
  const router = useRouter()
  const auth = getAuth()
  const sub = auth?.subscription || 'first_mate'
  const seatLimit = SEAT_LIMITS[sub] || 5
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteSent, setInviteSent] = useState(false)
  const [error, setError] = useState('')
  const [teamName, setTeamName] = useState('My Team')
  const [inviteLink, setInviteLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    // Load team from localStorage for now
    const saved = localStorage.getItem('bb_team_members')
    if (saved) setMembers(JSON.parse(saved))
    const savedName = localStorage.getItem('bb_team_name')
    if (savedName) setTeamName(savedName)
    else {
      setTeamName('My Marine Shop')
    }
  }, [router])

  const saveMembers = (m: TeamMember[]) => {
    setMembers(m)
    localStorage.setItem('bb_team_members', JSON.stringify(m))
  }

  const generateInviteLink = async () => {
    setGeneratingLink(true)
    setInviteLink('')
    try {
      const r = await fetch(`${API_URL}/api/invites/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_email: auth?.email, role: inviteRole })
      })
      if (r.ok) {
        const d = await r.json()
        setInviteLink(d.inviteUrl)
      }
    } catch {} finally { setGeneratingLink(false) }
  }

  const copyLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!inviteEmail) { setError('Enter an email address.'); return }
    if (members.length >= seatLimit) { setError(`Seat limit reached (${seatLimit} seats on ${sub} plan).`); return }
    if (members.find(m => m.email === inviteEmail.toLowerCase())) { setError('This email is already on your team.'); return }

    // Generate invite link then send email
    let link = inviteLink
    if (!link) {
      try {
        const r = await fetch(`${API_URL}/api/invites/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner_email: auth?.email, role: inviteRole })
        })
        if (r.ok) { const d = await r.json(); link = d.inviteUrl; setInviteLink(link) }
      } catch {}
    }

    // Send invite email with link
    try {
      await fetch(`${API_URL}/api/send-invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: inviteEmail, fromName: auth?.name || 'Your team', teamName, role: inviteRole, inviteLink: link })
      })
    } catch {}

    const newMember: TeamMember = { email: inviteEmail.toLowerCase(), role: inviteRole }
    saveMembers([...members, newMember])
    setInviteEmail('')
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 3000)
  }

  const removeMember = (email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return
    saveMembers(members.filter(m => m.email !== email))
  }

  const changeRole = (email: string, newRole: string) => {
    saveMembers(members.map(m => m.email === email ? { ...m, role: newRole } : m))
  }

  const seatsUsed = members.length + 1 // +1 for owner
  const dimStyle = { color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }
  const labelStyle = { color: '#C68B3A', fontFamily: 'Georgia, serif' }

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20,8,2,0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/settings" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          ← Settings
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>⚓ Team Management</h1>
        <p className="text-xs mb-5" style={dimStyle}>{sub.charAt(0).toUpperCase()+sub.slice(1)} plan · {seatsUsed} of {seatLimit} seats used</p>

        {/* Seat usage bar */}
        <div className="panel p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={labelStyle}>Seat Usage</p>
            <p className="text-xs font-bold" style={{ color: seatsUsed >= seatLimit ? '#e87070' : '#70c070', fontFamily: 'Georgia, serif' }}>
              {seatsUsed} / {seatLimit}
            </p>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(198,139,58,0.15)' }}>
            <div className="h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (seatsUsed/seatLimit)*100)}%`, background: seatsUsed >= seatLimit ? '#e87070' : '#C68B3A' }} />
          </div>
          {seatsUsed >= seatLimit && sub === 'admiral' && (
            <p className="text-xs mt-2" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
              Need more seats? Add 5-seat packs — $35/mo each. <a href="mailto:thewastedape@gmail.com?subject=Add Seat Pack" style={{ color: '#C68B3A' }}>Contact us →</a>
            </p>
          )}
        </div>

        {/* Team name */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-2" style={labelStyle}>Team Name</h2>
          <input className="input-field" value={teamName}
            onChange={e => { setTeamName(e.target.value); localStorage.setItem('bb_team_name', e.target.value) }}
            placeholder="Your shop or yard name" />
        </div>

        {/* Current members */}
        <div className="panel p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Team Members</h2>

          {/* Owner */}
          <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(198,139,58,0.15)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{auth?.name || auth?.email}</p>
              <p className="text-xs" style={dimStyle}>{auth?.email}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#C68B3A', color: '#3D1C02', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>Owner</span>
          </div>

          {members.map(member => (
            <div key={member.email} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
              <div>
                <p className="text-sm" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>{member.name || member.email}</p>
                {member.name && <p className="text-xs" style={dimStyle}>{member.email}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select value={member.role} onChange={e => changeRole(member.email, e.target.value)}
                  style={{ background: 'rgba(198,139,58,0.1)', border: '1px solid rgba(198,139,58,0.3)', borderRadius: '6px', color: '#C68B3A', padding: '2px 6px', fontSize: '11px', fontFamily: 'Georgia, serif' }}>
                  <option value="member" style={{ background: '#1a0a02' }}>Member</option>
                  <option value="admin" style={{ background: '#1a0a02' }}>Admin</option>
                </select>
                <button onClick={() => removeMember(member.email)}
                  style={{ background: 'rgba(139,26,26,0.2)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(139,26,26,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-xs py-2" style={dimStyle}>No team members yet. Invite someone below.</p>
          )}
        </div>

        {/* Invite form */}
        {seatsUsed < seatLimit ? (
          <div className="panel p-4">
            <h2 className="text-xs uppercase tracking-wider mb-3" style={labelStyle}>Invite Team Member</h2>
            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs mb-1" style={dimStyle}>Email Address</label>
                <input type="email" className="input-field" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} placeholder="tech@yourshop.com" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={dimStyle}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input-field"
                  style={{ background: 'rgba(245,240,232,0.1)', color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                  <option value="member" style={{ background: '#1a0a02' }}>Member — can view and add jobs</option>
                  <option value="admin" style={{ background: '#1a0a02' }}>Admin — full access except billing</option>
                </select>
              </div>
              {error && <p className="text-xs" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{error}</p>}
              {inviteSent && <p className="text-xs" style={{ color: '#70c070', fontFamily: 'Georgia, serif' }}>✓ Invite sent!</p>}
              <button type="submit" className="btn-primary w-full" style={{ fontSize: '14px', padding: '10px' }}>
                ✉️ Send Invite by Email
              </button>

              {/* Or share invite link directly */}
              <div className="pt-2" style={{ borderTop: '1px solid rgba(198,139,58,0.15)' }}>
                <p className="text-xs mb-2" style={dimStyle}>Or share an invite link directly:</p>
                {!inviteLink ? (
                  <button type="button" onClick={generateInviteLink} disabled={generatingLink}
                    className="w-full py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(198,139,58,0.12)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                    {generatingLink ? 'Generating...' : '🔗 Generate Invite Link'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(198,139,58,0.08)', border: '1px solid rgba(198,139,58,0.2)' }}>
                      <p className="text-xs flex-1 truncate" style={{ color: '#C68B3A', fontFamily: 'monospace' }}>{inviteLink}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={copyLink}
                        className="flex-1 py-2 rounded-lg text-sm font-bold"
                        style={{ background: linkCopied ? 'rgba(112,192,112,0.2)' : '#C68B3A', color: linkCopied ? '#70c070' : '#3D1C02', border: 'none', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                        {linkCopied ? '✓ Copied!' : '📋 Copy Link'}
                      </button>
                      <button type="button" onClick={() => setInviteLink('')}
                        className="py-2 px-3 rounded-lg text-xs"
                        style={{ background: 'rgba(139,26,26,0.15)', color: 'rgba(245,240,232,0.4)', border: '1px solid rgba(139,26,26,0.2)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)', fontFamily: 'Georgia, serif' }}>Link expires in 7 days. Valid for one signup.</p>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="panel p-4 text-center">
            <p className="text-sm mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>All seats filled</p>
            <p className="text-xs" style={dimStyle}>
              {sub === 'captain' ? 'Upgrade to Admiral for 10 seats' : 'Add a 5-seat pack for $35/mo'}
            </p>
            <Link href="/upgrade" className="btn-primary inline-block mt-3 px-6 py-2 text-sm" style={{ textDecoration: 'none' }}>
              {sub === 'captain' ? 'Upgrade to Admiral' : 'Add Seats'}
            </Link>
          </div>
        )}
      </main>
      <NavBar />
    </div>
  )
}
