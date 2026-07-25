'use client'
import { acceptTerms, logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface TCModalProps {
  onAccept: () => void
}

export default function TCModal({ onAccept }: TCModalProps) {
  const router = useRouter()

  const handleAccept = () => {
    acceptTerms()
    onAccept()
  }

  const handleDecline = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">⚓</div>
          <h2 className="text-xl font-bold text-cream" style={{ fontFamily: 'Georgia, serif' }}>
            Terms & Conditions
          </h2>
          <p className="text-sm mt-1" style={{ color: '#C68B3A' }}>Please read and accept before continuing</p>
        </div>

        <div className="rounded-lg p-4 mb-6 text-sm leading-relaxed overflow-y-auto max-h-48"
          style={{ background: 'rgba(245,240,232,0.05)', color: 'rgba(245,240,232,0.8)', border: '1px solid rgba(198,139,58,0.2)', fontFamily: 'Georgia, serif' }}>
          <p className="mb-3">
            <strong>Boat Buddy</strong> is an AI-powered marine diagnostic assistant for informational purposes only.
          </p>
          <p className="mb-3">
            <strong>1. Not Professional Advice.</strong> Responses are AI-generated and should not replace professional marine mechanic inspections or certified repairs.
          </p>
          <p className="mb-3">
            <strong>2. Safety First.</strong> Always prioritize your safety and that of your passengers. In emergencies, contact Coast Guard immediately (VHF Channel 16 or 911).
          </p>
          <p className="mb-3">
            <strong>3. No Liability.</strong> WastedApe and Boat Buddy are not liable for any damages, injuries, or losses arising from the use of this app.
          </p>
          <p className="mb-3">
            <strong>4. Data.</strong> Conversations may be used to improve the service. No personal data is sold to third parties.
          </p>
          <p>
            <strong>5. Acceptance.</strong> By accepting, you acknowledge you have read and agree to these terms.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full" onClick={handleAccept}>
            ✓ Accept & Continue
          </button>
          <button className="btn-danger w-full" onClick={handleDecline}>
            ✗ Decline & Log Out
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(245,240,232,0.4)', fontFamily: 'Georgia, serif' }}>
          <a href="/terms" target="_blank" className="underline hover:text-amber-400" style={{ color: 'rgba(198,139,58,0.7)' }}>
            Read full terms
          </a>
        </p>
      </div>
    </div>
  )
}
