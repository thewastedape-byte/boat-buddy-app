import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
const SALT = 'bb_auth_2026'

function hashPwd(pw: string): string {
  return createHash('sha256').update(pw + SALT).digest('hex')
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400, headers: CORS })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const hash = hashPwd(password)
    const userName = name || email.split('@')[0]

    const { data: existing } = await supabase
      .from('users')
      .select('email, subscription')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      // Returning user on a new device - update password + name only, preserve subscription
      await supabase.from('users')
        .update({ password_hash: hash, name: userName })
        .eq('email', email.toLowerCase().trim())
      return NextResponse.json({ success: true, name: userName, subscription: existing.subscription || 'stow_away' }, { headers: CORS })
    }

    const { error } = await supabase.from('users').insert({
      email: email.toLowerCase().trim(),
      name: userName,
      password_hash: hash,
      subscription: 'stow_away',
      created_at: new Date().toISOString(),
    })

    if (error) return NextResponse.json({ error: 'Signup failed.' }, { status: 500, headers: CORS })
    return NextResponse.json({ success: true, name: userName, subscription: 'stow_away' }, { headers: CORS })
  } catch (err) {
    console.error('Signup API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: CORS })
  }
}