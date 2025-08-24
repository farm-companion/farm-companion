import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
  'https://www.farmcompanion.co.uk',
  'https://farmcompanion.co.uk',
  'https://farm-frontend-eas82g2gv-abdur-rahman-morris-projects.vercel.app',
  'https://farm-frontend-ihl9j5kbq-abdur-rahman-morris-projects.vercel.app',
  'https://farm-frontend-p4a7w2pkt-abdur-rahman-morris-projects.vercel.app',
  'https://farm-frontend-info-10016922-abdur-rahman-morris-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
]

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const origin = request.headers.get('origin')
  const isAllowedOrigin = origin && allowedOrigins.some(allowed => origin.includes(allowed))

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Handle actual requests
  const response = NextResponse.next()
  
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0])
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}

export const config = {
  matcher: '/api/:path*',
}
