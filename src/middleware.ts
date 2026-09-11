import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Allow Capacitor Android app (capacitor://localhost origin) to call API routes
// without CORS errors. Also covers future mobile/native clients.
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export const config = {
  matcher: '/api/:path*',
}
