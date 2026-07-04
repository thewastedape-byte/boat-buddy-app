'use client'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="bg-wood min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
            Privacy Policy
          </h1>
          <p className="text-sm mt-1" style={{ color: '#C68B3A', fontFamily: 'Georgia, serif' }}>
            Boat Buddy by WastedApe
          </p>
        </div>

        <div className="panel p-6" style={{ fontFamily: 'Georgia, serif', color: 'rgba(245,240,232,0.85)', lineHeight: '1.7' }}>
          <p className="text-xs mb-6" style={{ color: 'rgba(245,240,232,0.5)' }}>
            Last updated: July 4, 2026
          </p>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>1. Information We Collect</h2>
            <p className="text-sm mb-3">When you use Boat Buddy, we collect the following:</p>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li>Email address (account creation and login)</li>
              <li>Questions and messages submitted to the AI chat</li>
              <li>Images uploaded for photo diagnosis</li>
              <li>Vessel and engine information you provide</li>
              <li>Repair logs, work orders, and service records you create</li>
              <li>IP address and basic usage data for security and analytics</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>2. How We Use Your Information</h2>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li>To provide AI-powered marine diagnostic responses</li>
              <li>To manage your account and subscription</li>
              <li>To store and display your repair history and vessel data</li>
              <li>To improve the accuracy and quality of AI responses</li>
              <li>To send service-related communications</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>3. Third-Party Services</h2>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li><strong>OpenAI</strong> - Powers AI diagnostic responses per their privacy policy</li>
              <li><strong>Supabase</strong> - Stores account data, vessel records, and repair logs securely</li>
              <li><strong>Stripe</strong> - Processes subscription payments; we do not store card details</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>4. Data Sharing</h2>
            <p className="text-sm">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>5. Data Retention</h2>
            <p className="text-sm">We retain your data for as long as your account is active. If you delete your account, personal data will be removed within 30 days.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>6. Security</h2>
            <p className="text-sm">We use encrypted data storage and secure HTTPS connections. Do not submit sensitive personal information through the chat interface.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>7. Children</h2>
            <p className="text-sm">Boat Buddy is not intended for users under 18. We do not knowingly collect information from children.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>8. Your Rights</h2>
            <p className="text-sm">You may request access, correction, or deletion of your personal data by contacting us. We will respond within 30 days.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: '#C68B3A' }}>9. Contact</h2>
            <p className="text-sm">For privacy questions: <strong>thewastedape@gmail.com</strong></p>
          </section>

          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(198,139,58,0.3)' }}>
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
              2026 WastedApe. All rights reserved.
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="btn-primary inline-block">
            Back to App
          </Link>
        </div>
      </div>
    </div>
  )
}
