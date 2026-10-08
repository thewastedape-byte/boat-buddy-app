import { NextRequest, NextResponse } from 'next/server'

const PRICE_MAP: Record<string, string> = {
  first_mate: process.env.STRIPE_PRICE_ID_FIRST_MATE || '',
  captain: process.env.STRIPE_PRICE_ID_CAPTAIN || '',
  admiral: process.env.STRIPE_PRICE_ID_ADMIRAL || '',
  yard_addon: 'price_1TWjbhHfCuVeN1IrCs4vZyti',
  yard_standalone: 'price_1TWjcqHfCuVeN1IrBcfKr5SU',
  marina_addon: 'price_1TWjbhHfCuVeN1IrCs4vZyti',
}

// Intro coupons: year-1 discounted pricing, auto-expires after 12 months
const INTRO_COUPON_MAP: Record<string, string> = {
  first_mate: 'INTRO_FIRST_MATE', // $9.99 → $4.99/mo
  captain:    'INTRO_CAPTAIN',    // $24.99 → $10.99/mo
  admiral:    'INTRO_ADMIRAL',    // $49.99 → $29.99/mo
}

const TRIAL_DAYS = 7

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as any })

    const { email, tier } = await req.json()
    const priceId = PRICE_MAP[tier] || PRICE_MAP['first_mate']
    if (!priceId) return NextResponse.json({ error: 'Price not configured for this tier' }, { status: 400 })

    const isAddon = ['yard_addon', 'yard_standalone', 'marina_addon'].includes(tier)
    const cancelSlug = tier === 'marina_addon' ? 'marina' : tier.includes('yard') ? 'yard' : 'upgrade'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://boatbuddy.thewastedape.com'

    const introCoupon = !isAddon ? INTRO_COUPON_MAP[tier] : null

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(isAddon ? {} : {
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
          metadata: { tier, email: email || '' },
        },
        ...(introCoupon ? { discounts: [{ coupon: introCoupon }] } : {}),
      }),
      metadata: { tier, email: email || '' },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${appUrl}/${cancelSlug}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}