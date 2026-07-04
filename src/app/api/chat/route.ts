import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'thewastedape@gmail.com,howirolloldschool@gmail.com').split(',')
const PAID_TIERS = ['first_mate', 'captain', 'admiral']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    // Gate all users - including pre-signup ghost users
    if (email && SUPABASE_SERVICE_KEY && !ADMIN_EMAILS.includes(email)) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      let { data: user } = await supabase
        .from('users')
        .select('subscription, last_free_question')
        .eq('email', email)
        .single()

      // Ghost user (localStorage only, not in Supabase) — register them now and gate immediately
      if (!user) {
        await supabase.from('users').upsert(
          { email: email.toLowerCase().trim(), subscription: 'stow_away', created_at: new Date().toISOString() },
          { onConflict: 'email', ignoreDuplicates: true }
        )
        const { data: newUser } = await supabase
          .from('users')
          .select('subscription, last_free_question')
          .eq('email', email)
          .single()
        user = newUser
      }

      if (user && !PAID_TIERS.includes(user.subscription)) {
        const lastQuestion = user.last_free_question ? new Date(user.last_free_question).getTime() : 0
        const now = Date.now()
        const elapsed = now - lastQuestion

        if (lastQuestion && elapsed < SIX_HOURS_MS) {
          const nextAvailableMs = lastQuestion + SIX_HOURS_MS
          const minutesLeft = Math.ceil((nextAvailableMs - now) / 60000)
          const hoursLeft = Math.floor(minutesLeft / 60)
          const minsLeft = minutesLeft % 60
          const waitMsg = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`
          return NextResponse.json(
            { error: 'free_limit', message: `Free question used. Next available in ${waitMsg}.`, nextAvailableMs },
            { status: 429 }
          )
        }

        // Stamp last_free_question
        await supabase
          .from('users')
          .update({ last_free_question: new Date().toISOString() })
          .eq('email', email)
      }
    }

    // Forward to backend
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    // Log question to Supabase questions table (fire and forget)
    if (res.ok && data.answer && body.question && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        await supabase.from('questions').insert({
          user_email: email || 'anonymous',
          session_id: body.session_id || null,
          question: body.question,
          answer: data.answer,
          engine_found: data.engineFound || null,
          ip,
          language: body.language || 'en',
        })
      } catch (logErr) {
        console.error('Question logging failed:', logErr)
      }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 })
  }
}