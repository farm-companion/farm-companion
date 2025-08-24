import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Get the origin from the request
    const origin = request.headers.get('origin')
    
    // Allow specific origins
    const allowedOrigins = [
      'https://www.farmcompanion.co.uk',
      'https://farmcompanion.co.uk',
      'https://farm-frontend-ha4i5s4wg-abdur-rahman-morris-projects.vercel.app',
      'https://farm-frontend-3py6z1qaa-abdur-rahman-morris-projects.vercel.app',
      'https://farm-frontend-mcy72cer8-abdur-rahman-morris-projects.vercel.app',
      'http://localhost:3000'
    ]
    
    // Set CORS headers - prioritize your custom domain
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (origin && origin.includes('farmcompanion.co.uk')) {
      // Allow any subdomain of farmcompanion.co.uk
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
