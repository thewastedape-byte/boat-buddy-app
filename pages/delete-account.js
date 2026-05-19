import Head from 'next/head';
import { useState } from 'react';

export default function DeleteAccount() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Head>
        <title>Delete Account - Boat Buddy AI</title>
      </Head>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#222' }}>
        <h1>Delete Your Account</h1>
        <p>We are sorry to see you go. To permanently delete your Boat Buddy AI account and all associated data, please send an email to:</p>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
          <a href="mailto:thewastedape@gmail.com?subject=Delete My Account">thewastedape@gmail.com</a>
        </p>
        <p>Use the subject line: <strong>"Delete My Account"</strong></p>
        <p>Include the email address associated with your account. We will process your request within 7 days and confirm deletion via email.</p>
        <hr style={{ margin: '30px 0' }} />
        <p style={{ color: '#666', fontSize: '14px' }}>Note: Deleting your account is permanent and cannot be undone. All your data, vessels, and job history will be permanently removed.</p>
      </div>
    </>
  );
}