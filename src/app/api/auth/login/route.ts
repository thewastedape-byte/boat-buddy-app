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
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400, headers: CORS })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const hash = hashPwd(password)

    const { data: user } = await supabase
      .from('users')
      .select('email, subscription, password_hash, name')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 401, headers: CORS })
    }

    if (!user.password_hash) {
      // Legacy user - accept any password, lock it in now so all devices can log in
      await supabase.from('users').update({ password_hash: hash }).eq('email', email.toLowerCase().trim())
      return NextResponse.json({ success: true, name: user.name || email.split('@')[0], subscription: user.subscription || 'stow_away' }, { headers: CORS })
    }

    if (user.password_hash !== hash) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401, headers: CORS })
    }

    return NextResponse.json({ success: true, name: user.name || email.split('@')[0], subscription: user.subscription || 'stow_away' }, { headers: CORS })
  } catch (err) {
    console.error('Login API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: CORS })
  }
}