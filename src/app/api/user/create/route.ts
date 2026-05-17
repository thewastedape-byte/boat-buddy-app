import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'server config error' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Upsert user — if already exists, leave subscription alone
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          name: name || email.split('@')[0],
          subscription: 'stow_away',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (error) {
      console.error('[user/create] Supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[user/create] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}