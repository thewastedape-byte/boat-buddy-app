import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' })

  const PRICE_MAP: Record<string, string> = {
    first_mate: process.env.STRIPE_PRICE_ID_FIRST_MATE || '',
    captain: process.env.STRIPE_PRICE_ID_CAPTAIN || '',
    admiral: process.env.STRIPE_PRICE_ID_ADMIRAL || '',
    yard_addon: 'price_1TWjbhHfCuVeN1IrCs4vZyti',
    yard_standalone: 'price_1TWjcqHfCuVeN1IrBcfKr5SU',
    marina_addon: 'price_1TWjbhHfCuVeN1IrCs4vZyti',
  }

  try {
    const { email, tier } = await req.json()
    const priceId = PRICE_MAP[tier] || PRICE_MAP['first_mate']
    const isAddon = tier === 'yard_addon' || tier === 'yard_standalone' || tier === 'marina_addon'
    const cancelSlug = tier === 'marina_addon' ? 'marina' : tier === 'yard_addon' || tier === 'yard_standalone' ? 'yard' : 'upgrade'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(isAddon ? {} : { discounts: [{ coupon: 'LAUNCH2026' }] }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boatbuddy.thewastedape.com'}/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boatbuddy.thewastedape.com'}/${cancelSlug}`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
