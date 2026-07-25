'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import NavBar from '@/components/NavBar'

export default function CancelPage() {
  const router = useRouter()

  return (
    <div className="bg-wood min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'rgba(20, 8, 2, 0.95)', borderBottom: '1px solid rgba(198,139,58,0.3)' }}>
        <Logo size="sm" />
        <Link href="/settings" className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(198,139,58,0.2)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.4)', fontFamily: 'Georgia, serif', textDecoration: 'none' }}>
          ← Settings
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="max-w-sm mx-auto">
          <h1 className="text-xl font-bold mb-2" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            Cancel Subscription
          </h1>
          <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>
            We&apos;re sorry to see you go.
          </p>

          {/* What you lose */}
          <div className="panel p-4 mb-4">
            <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#8B1A1A', fontFamily: 'Georgia, serif' }}>
              What you&apos;ll lose
            </h2>
            {['Unlimited AI diagnostic questions', 'Photo analysis — send engine photos for diagnosis', 'Full repair log history', 'Work order generation', 'Service reminders'].map(item => (
              <div key={item} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(198,139,58,0.1)' }}>
                <span style={{ color: '#8B1A1A' }}>✕</span>
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.7)', fontFamily: 'Georgia, serif' }}>{item}</p>
              </div>
            ))}
            <p className="text-xs mt-3" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
              You&apos;ll keep access until the end of your current billing period, then drop to 1 free question every 6 hours.
            </p>
          </div>

          {/* How to cancel */}
          <div className="panel p-4 mb-6">
            <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
              How to cancel
            </h2>
            <p className="text-sm mb-4" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif', lineHeight: '1.6' }}>
              Email us and we&apos;ll cancel within 24 hours:
            </p>
            <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(198,139,58,0.1)', border: '1px solid rgba(198,139,58,0.3)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Send to:</p>
              <p className="text-sm font-bold" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>thewastedape@gmail.com</p>
              <p className="text-xs mt-2" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Subject: Cancel Subscription</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.5)', fontFamily: 'Georgia, serif' }}>Include your account email address.</p>
            </div>
            <a href="mailto:thewastedape@gmail.com?subject=Cancel%20Subscription&body=Please%20cancel%20my%20Boat%20Buddy%20subscription.%20My%20account%20email%20is%3A%20"
              className="btn-primary w-full text-center block"
              style={{ textDecoration: 'none', fontSize: '14px', padding: '12px' }}>
              ✉️ Email to Cancel
            </a>
          </div>

          <button onClick={() => router.push('/settings')}
            className="w-full py-3 rounded-lg text-sm"
            style={{ background: 'rgba(198,139,58,0.15)', color: '#C68B3A', border: '1px solid rgba(198,139,58,0.3)', fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
            Never mind — keep my subscription
          </button>
        </div>
      </main>
      <NavBar />
    </div>
  )
}
