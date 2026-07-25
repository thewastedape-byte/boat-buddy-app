'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { generateResetCode, resetPassword } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Enter your email address.'); return }
    setLoading(true)
    try {
      const resetCode = generateResetCode(email.trim().toLowerCase())
      if (!resetCode) {
        setError('No account found with that email address.')
        setLoading(false)
        return
      }
      // Send via backend
      const res = await fetch(`${API_URL}/api/send-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: resetCode })
      })
      if (!res.ok) throw new Error('Failed to send email')
      setStep('code')
    } catch {
      setError('Could not send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!code || code.length !== 6) { setError('Enter the 6-digit code from your email.'); return }
    if (!newPassword) { setError('Enter a new password.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    const result = resetPassword(email.trim().toLowerCase(), code.trim(), newPassword)
    if (!result.success) { setError(result.error || 'Reset failed.'); return }
    setStep('done')
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="bg-wood min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size="md" />
        </div>

        <div className="panel p-6">
          {step === 'email' && (
            <>
              <h1 className="text-lg font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                Forgot Password
              </h1>
              <p className="text-xs mb-5" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
                Enter your email and we&apos;ll send a 6-digit reset code.
              </p>
              <form onSubmit={handleSendCode}>
                <div className="mb-4">
                  <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input-field" placeholder="captain@example.com" autoComplete="email" />
                </div>
                {error && <p className="text-xs mb-3" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{error}</p>}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Sending...' : '📧 Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <h1 className="text-lg font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                Check Your Email
              </h1>
              <p className="text-xs mb-5" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
                Sent a 6-digit code to <span style={{ color: '#C68B3A' }}>{email}</span>. Expires in 15 minutes.
              </p>
              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>Reset Code</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)}
                    className="input-field" placeholder="123456" maxLength={6} inputMode="numeric" />
                </div>
                <div className="mb-3">
                  <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="input-field" placeholder="New password" />
                </div>
                <div className="mb-4">
                  <label className="block text-xs mb-1" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="input-field" placeholder="Confirm new password" />
                </div>
                {error && <p className="text-xs mb-3" style={{ color: '#e87070', fontFamily: 'Georgia, serif' }}>{error}</p>}
                <button type="submit" className="btn-primary w-full">
                  🔐 Reset Password
                </button>
                <button type="button" onClick={() => setStep('email')}
                  className="w-full mt-2 text-xs py-2" style={{ color: 'rgba(245,240,232,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  ← Resend code
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">✅</p>
              <p className="text-lg font-bold mb-1" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>Password Reset!</p>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Redirecting to sign in...</p>
            </div>
          )}
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
          <Link href="/login" style={{ color: '#C68B3A', textDecoration: 'none' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
