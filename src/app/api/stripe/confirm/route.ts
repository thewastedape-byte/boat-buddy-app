export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'

const TIER_LABELS: Record<string, string> = {
  first_mate: 'First Mate',
  captain: 'Captain',
  admiral: 'Admiral',
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!secretKey || !serviceKey) return NextResponse.json({ error: 'not configured' }, { status: 500 })

  try {
    const { session_id, tier } = await req.json()
    if (!session_id || !tier) return NextResponse.json({ error: 'missing params' }, { status: 400 })

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any })

    // Verify the Stripe session is actually paid
    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'not paid' }, { status: 400 })
    }

    const email = (session.customer_email || (session.customer_details as any)?.email || '').toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'no email on session' }, { status: 400 })

    // Update Supabase
    const supabase = createClient(SUPABASE_URL, serviceKey)
    const { error } = await supabase
      .from('users')
      .update({ subscription: tier })
      .eq('email', email)

    if (error) {
      console.error('[confirm] supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[confirm] upgraded ${email} → ${tier}`)
    return NextResponse.json({ ok: true, email, subscription: tier, label: TIER_LABELS[tier] || tier })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}