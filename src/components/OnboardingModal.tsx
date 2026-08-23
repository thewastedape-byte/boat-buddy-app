'use client'
import { useState, useEffect } from 'react'

const ONBOARDING_KEY = 'bb_onboarding_complete'

const steps = [
  {
    icon: '💬',
    title: 'AI Marine Diagnostics',
    body: 'Describe any symptom in plain English. Boat Buddy responds like an experienced marine mechanic — right from your phone.',
  },
  {
    icon: '📷',
    title: 'Photo Analysis',
    body: 'Send a photo of your engine, wiring, or bilge. Our AI identifies parts and diagnoses issues from the image.',
  },
  {
    icon: '📖',
    title: 'Service Manuals',
    body: 'Get exact torque specs, part numbers, and valve clearances — pulled from real manufacturer PDF manuals.',
  },
  {
    icon: '📄',
    title: 'Work Orders & Invoices',
    body: 'Save diagnoses, track repairs, and generate professional invoices for your customers — all in one place.',
  },
  {
    icon: '⚓',
    title: "You're Ready to Go!",
    body: 'Ask your first question in the chat, or explore Vessel, Yard, and Log from the bottom menu. Welcome aboard!',
  },
]

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setVisible(false)
  }

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col"
        style={{
          background: 'rgba(20,8,2,0.97)',
          border: '2px solid rgba(198,139,58,0.5)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: i === step ? '#C68B3A' : 'rgba(198,139,58,0.25)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
          <button
            onClick={dismiss}
            style={{ color: 'rgba(245,240,232,0.4)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Skip
          </button>
        </div>

        {/* Icon */}
        <div className="text-center mb-4">
          <span style={{ fontSize: '52px', lineHeight: 1 }}>{current.icon}</span>
        </div>

        {/* Content */}
        <h2
          className="text-lg font-bold text-center mb-3"
          style={{ color: '#F5F0E8' }}
        >
          {current.title}
        </h2>
        <p
          className="text-sm text-center leading-relaxed mb-6"
          style={{ color: 'rgba(245,240,232,0.7)' }}
        >
          {current.body}
        </p>

        {/* CTA */}
        <button
          onClick={next}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{
            background: '#C68B3A',
            color: '#3D1C02',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          {isLast ? '⚓ Get Started' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
