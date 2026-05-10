'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

function QBCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Connecting to QuickBooks...')

  useEffect(() => {
    const code = searchParams.get('code')
    const realmId = searchParams.get('realmId')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      setStatus('QuickBooks authorization was cancelled.')
      window.opener?.postMessage('qb_cancelled', '*')
      setTimeout(() => window.close(), 2000)
      return
    }

    if (!code) {
      setStatus('No authorization code received.')
      setTimeout(() => window.close(), 2000)
      return
    }

    // Exchange code for tokens via our backend
    fetch(`${API_URL}/api/qb/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, realmId, state })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStatus('✓ QuickBooks connected! Closing...')
          window.opener?.postMessage('qb_connected', '*')
          setTimeout(() => window.close(), 1500)
        } else {
          setStatus('Connection failed: ' + (d.error || 'Unknown error'))
        }
      })
      .catch(() => setStatus('Connection failed. Please try again.'))
  }, [searchParams])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0500', fontFamily: 'Georgia, serif', padding: '24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📒</div>
      <p style={{ color: '#F5F0E8', fontSize: '16px', textAlign: 'center' }}>{status}</p>
    </div>
  )
}

export default function QBCallback() {
  return (
    <Suspense fallback={<div style={{ background: '#0d0500', minHeight: '100vh' }} />}>
      <QBCallbackContent />
    </Suspense>
  )
}
