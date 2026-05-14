'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signup, login, isLoggedIn } from '@/lib/auth'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<{ownerEmail: string; role: string} | null>(null)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (isLoggedIn()) router.replace('/')
  }, [router])

  // Validate invite token on load
  useEffect(() => {
    if (!inviteToken) return
    fetch(`${API_URL}/api/invites/${inviteToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) setInviteInfo({ ownerEmail: data.ownerEmail, role: data.role })
        else setInviteError('This invite link is invalid or has expired.')
      })
      .catch(() => setInviteError('Could not validate invite. Try again.'))
  }, [inviteToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password || !confirm) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const result = signup(email.trim().toLowerCase(), password)
      if (!result.success) { setError(result.error || 'Sign up failed.'); return }

      // Track signup in Supabase
      try {
        const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
        if (SUPABASE_KEY) {
          await fetch(`${SUPABASE_URL}/rest/v1/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              created_at: new Date().toISOString(),
            }),
          })
        }
      } catch { /* non-fatal */ }

      // If invited, accept the invite and link to team
      if (inviteToken && inviteInfo) {
        await fetch(`${API_URL}/api/invites/${inviteToken}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), name: email.split('@')[0] })
        }).catch(() => {})
        // Store team info locally so the app knows their tier
        const authRaw = localStorage.getItem('boat_buddy_auth')
        if (authRaw) {
          const auth = JSON.parse(authRaw)
          auth.subscription = 'admiral' // inherits team tier
          auth.teamOwner = inviteInfo.ownerEmail
          auth.role = inviteInfo.role
          localStorage.setItem('boat_buddy_auth', JSON.stringify(auth))
        }
      }

      localStorage.setItem('boat_buddy_pending_email', email.trim().toLowerCase())
      setSignedUp(true)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    login(email.trim().toLowerCase(), password)
    // Re-apply team info after login
    if (inviteInfo) {
      const authRaw = localStorage.getItem('boat_buddy_auth')
      if (authRaw) {
        const auth = JSON.parse(authRaw)
        auth.subscription = 'admiral'
        auth.teamOwner = inviteInfo.ownerEmail
        auth.role = inviteInfo.role
        localStorage.setItem('boat_buddy_auth', JSON.stringify(auth))
      }
    }
    // New users go to setup wizard, invited users go straight to app
    router.push(inviteInfo ? '/' : '/setup')
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="mt-3 text-sm" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
            {inviteInfo ? `You've been invited to join a team` : `Create your captain's account`}
          </p>
        </div>

        {/* Invite banner */}
        {inviteInfo && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(198,139,58,0.12)', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif' }}>
            <p className="font-bold mb-1" style={{ color: '#C68B3A' }}>⚓ Team Invite</p>
            <p style={{ color: 'rgba(245,240,232,0.7)' }}>
              Join as <strong style={{ color: '#F5F0E8' }}>{inviteInfo.role}</strong>
            </p>
          </div>
        )}

        {inviteError && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(139,26,26,0.5)', color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            {inviteError}
          </div>
        )}

        {signedUp ? (
          <div className="panel p-6 text-center">
            <div className="text-5xl mb-4">{inviteInfo ? '⚓' : '📧'}</div>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
              {inviteInfo ? 'You\'re on the team!' : 'Account Created'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>
              {inviteInfo
                ? `You've joined the team as a ${inviteInfo.role}. Welcome aboard.`
                : `Account ready. Tap below to get started.`}
            </p>
            <button className="btn-primary w-full" onClick={handleContinue}>
              ✅ Continue to App
            </button>
          </div>
        ) : (
          <div className="panel p-6">
            <h1 className="text-xl font-bold text-center mb-6" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
              Create Account
            </h1>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
                style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(139,26,26,0.6)', color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Email</label>
                <input type="email" className="input-field" placeholder="captain@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Password</label>
                <input type="password" className="input-field" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>Confirm Password</label>
                <input type="password" className="input-field" placeholder="Repeat password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Creating account...' : inviteInfo ? '⚓ Join Team' : '⚓ Create Account'}
              </button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#C68B3A' }} className="font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
          By creating an account you agree to our{' '}
          <Link href="/terms" style={{ color: 'rgba(198,139,58,0.6)' }} className="underline">Terms &amp; Conditions</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="bg-wood min-h-screen" />}>
      <SignupContent />
    </Suspense>
  )
}
