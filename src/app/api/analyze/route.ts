import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'
const SUPABASE_URL = 'https://yruuzkxpnbgruwuivchy.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${API_URL}/api/analyze`, {
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
          user_email: body.email || 'anonymous',
          session_id: body.session_id || null,
          question: body.question,
          answer: data.answer,
          engine_found: data.engineFound || null,
          ip,
          language: body.language || 'en',
        })
      } catch (logErr) {
        console.error('Question logging failed (analyze):', logErr)
      }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Analyze API error:', err)
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 })
  }
}
