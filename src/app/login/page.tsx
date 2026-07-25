'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login, isLoggedIn, updateAuthSubscription } from '@/lib/auth'

const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''

async function fetchSubscription(email: string): Promise<string> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=subscription`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
    const data = await res.json()
    return data?.[0]?.subscription || 'stow_away'
  } catch { return 'stow_away' }
}
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const result = login(email.trim().toLowerCase(), password)
      if (result.success) {
        // Fetch fresh subscription from Supabase and store it
        const sub = await fetchSubscription(email.trim().toLowerCase())
        updateAuthSubscription(sub)
        router.push('/')
      } else {
        setError(result.error || 'Login failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="mt-3 text-sm" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
            Marine AI Diagnostic Assistant
          </p>
        </div>

        {/* Card */}
        <div className="panel p-6">
          <h1 className="text-xl font-bold text-center mb-6" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            Sign In
          </h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
              style={{ background: 'rgba(139,26,26,0.3)', border: '1px solid rgba(139,26,26,0.6)', color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="captain@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="text-right">
              <Link href="/login/forgot" className="text-xs" style={{ color: 'rgba(198,139,58,0.8)', fontFamily: 'Georgia, serif' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : '⚓ Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(245,240,232,0.6)', fontFamily: 'Georgia, serif' }}>
            New here?{' '}
            <Link href="/signup" style={{ color: '#C68B3A' }} className="font-bold hover:underline">
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
          By signing in you agree to our{' '}
          <Link href="/terms" style={{ color: 'rgba(198,139,58,0.6)' }} className="underline">
            Terms &amp; Conditions
          </Link>
        </p>
      </div>
    </div>
  )
}
