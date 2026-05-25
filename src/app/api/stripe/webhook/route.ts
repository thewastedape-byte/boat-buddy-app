export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'

// Map Stripe price IDs → subscription tier
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_ID_FIRST_MATE || 'price_1TXUtMHfCuVeN1Irte7XSeUr']: 'first_mate',
  [process.env.STRIPE_PRICE_ID_CAPTAIN || 'price_1TXUtNHfCuVeN1Ir9QLZGPYs']: 'captain',
  [process.env.STRIPE_PRICE_ID_ADMIRAL || 'price_1TXUtNHfCuVeN1Ira4d8LApS']: 'admiral',
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!webhookSecret || !stripeSecretKey || !supabaseServiceKey) {
    console.error('[webhook] Missing env vars')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: any
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any })
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] Signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, supabaseServiceKey)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = (session.customer_email || session.customer_details?.email || '').toLowerCase().trim()
      if (!email) {
        console.error('[webhook] No email on checkout session', session.id)
        return NextResponse.json({ ok: true })
      }

      // Get the price ID from line items
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any })
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 })
      const priceId = lineItems.data[0]?.price?.id || ''
      const tier = PRICE_TO_TIER[priceId] || 'first_mate'

      console.log(`[webhook] checkout.session.completed: ${email} → ${tier} (price: ${priceId})`)

      const { error } = await supabase
        .from('users')
        .update({ subscription: tier })
        .eq('email', email)

      if (error) {
        console.error('[webhook] Supabase update error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`[webhook] ✅ Updated ${email} to ${tier}`)
    }

    if (event.type === 'customer.subscription.deleted') {
      // Downgrade to free when subscription is cancelled
      const subscription = event.data.object
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any })
      const customer = await stripe.customers.retrieve(subscription.customer as string) as any
      const email = (customer.email || '').toLowerCase().trim()
      if (!email) return NextResponse.json({ ok: true })

      console.log(`[webhook] customer.subscription.deleted: downgrading ${email} to stow_away`)

      const { error } = await supabase
        .from('users')
        .update({ subscription: 'stow_away' })
        .eq('email', email)

      if (error) console.error('[webhook] Supabase downgrade error:', error.message)
    }

    if (event.type === 'customer.subscription.updated') {
      // Handle plan changes (upgrade/downgrade)
      const subscription = event.data.object
      const priceId = subscription.items?.data[0]?.price?.id || ''
      const tier = PRICE_TO_TIER[priceId]
      if (!tier) return NextResponse.json({ ok: true })

      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any })
      const customer = await stripe.customers.retrieve(subscription.customer as string) as any
      const email = (customer.email || '').toLowerCase().trim()
      if (!email) return NextResponse.json({ ok: true })

      console.log(`[webhook] customer.subscription.updated: ${email} → ${tier}`)

      const { error } = await supabase
        .from('users')
        .update({ subscription: tier })
        .eq('email', email)

      if (error) console.error('[webhook] Supabase update error:', error.message)
    }

  } catch (err) {
    console.error('[webhook] Handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
