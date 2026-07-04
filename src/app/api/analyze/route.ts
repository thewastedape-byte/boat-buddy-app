import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gemini-marine-api.onrender.com'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    const res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Analyze API error:', err)
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 })
  }
}
