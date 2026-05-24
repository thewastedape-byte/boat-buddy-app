export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'

// Map tier keys to Supabase subscription values
const TIER_MAP: Record<string, string> = {
  first_mate: 'first_mate',
  captain: 'captain',
  admiral: 'admiral',
  yard_addon: 'admiral',
  yard_standalone: 'admiral',
  marina_addon: 'captain',
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!secretKey || !webhookSecret || !serviceKey) {
    console.error('[webhook] missing config')
    return NextResponse.json({ error: 'not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any })

    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'signature error'
      console.error('[webhook] signature failed:', message)
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const email = (session.customer_email || session.customer_details?.email || '').toLowerCase().trim()
      const tier = session.metadata?.tier

      if (!email || !tier) {
        console.warn('[webhook] missing email or tier', { email, tier })
        return NextResponse.json({ received: true })
      }

      const subscription = TIER_MAP[tier] || tier
      const supabase = createClient(SUPABASE_URL, serviceKey)
      const { error } = await supabase
        .from('users')
        .update({ subscription })
        .eq('email', email)

      if (error) {
        console.error('[webhook] supabase error:', error.message)
      } else {
        console.log(`[webhook] upgraded ${email} → ${subscription}`)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any
      // Downgrade on cancellation
      try {
        const Stripe2 = (await import('stripe')).default
        const stripe2 = new Stripe2(secretKey, { apiVersion: '2024-12-18.acacia' as any })
        const customer = await stripe2.customers.retrieve(sub.customer) as any
        const email = customer.email?.toLowerCase().trim()
        if (email) {
          const supabase = createClient(SUPABASE_URL, serviceKey)
          await supabase.from('users').update({ subscription: 'stow_away' }).eq('email', email)
          console.log(`[webhook] cancelled ${email} → stow_away`)
        }
      } catch (e) { console.error('[webhook] cancel downgrade error:', e) }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}