import Head from 'next/head';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Boat Buddy AI</title>
      </Head>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#222' }}>
        <h1>Privacy Policy</h1>
        <p><strong>Last updated: May 19, 2026</strong></p>

        <p>Boat Buddy AI ("we", "us", or "our") operates the Boat Buddy AI application. This page informs you of our policies regarding the collection, use, and disclosure of personal data.</p>

        <h2>Information We Collect</h2>
        <ul>
          <li><strong>Account Information:</strong> When you register, we collect your email address and name.</li>
          <li><strong>Usage Data:</strong> Questions and diagnostic requests you submit to the AI assistant.</li>
          <li><strong>Device Information:</strong> Basic device and browser information for app functionality.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain the Boat Buddy AI service</li>
          <li>To manage your account and subscription</li>
          <li>To process your AI diagnostic requests</li>
          <li>To communicate with you about your account</li>
        </ul>

        <h2>Data Sharing</h2>
        <p>We do not sell your personal data. Your diagnostic queries are processed through OpenAI's API under their privacy policy. We do not share your personal information with third parties except as necessary to operate the service.</p>

        <h2>Data Retention</h2>
        <p>We retain your account data for as long as your account is active. You may request deletion of your data at any time by contacting us.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:thewastedape@gmail.com">thewastedape@gmail.com</a>.</p>

        <h2>Account Deletion</h2>
        <p>To delete your account and all associated data, email us at <a href="mailto:thewastedape@gmail.com">thewastedape@gmail.com</a> with subject "Delete My Account".</p>

        <h2>Security</h2>
        <p>We use industry-standard security measures to protect your data. Your data is stored securely via Supabase with encrypted connections.</p>

        <h2>Children</h2>
        <p>Boat Buddy AI is not directed at children under 18. We do not knowingly collect data from children.</p>

        <h2>Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:thewastedape@gmail.com">thewastedape@gmail.com</a>.</p>
      </div>
    </>
  );
}