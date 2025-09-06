import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const { statusCode, url, method } = await request.json()
    
    // Basic validation
    if (!statusCode || !url) {
      return NextResponse.json({ error: 'Invalid error data' }, { status: 400 })
    }

    // Only track in production
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
      try {
        const now = Date.now()
        const hourKey = `http_errors:${Math.floor(now / (1000 * 60 * 60))}` // Hourly bucket
        
        // Increment error count by status code
        const statusKey = `${hourKey}:${statusCode}`
        await kv.incr(statusKey)
        await kv.expire(statusKey, 86400) // Expire after 24 hours
        
        // Track total errors
        await kv.incr(`${hourKey}:total`)
        await kv.expire(`${hourKey}:total`, 86400)
        
        // Track by endpoint (limited to prevent KV bloat)
        const endpoint = new URL(url).pathname
        if (endpoint.length < 100) { // Only track reasonable endpoint lengths
          const endpointKey = `${hourKey}:endpoint:${endpoint}`
          await kv.incr(endpointKey)
          await kv.expire(endpointKey, 86400)
        }
        
        // Log to console for immediate visibility
        console.error(`HTTP Error ${statusCode}: ${method} ${url}`)
      } catch (kvError) {
        console.error('Failed to log HTTP error to KV:', kvError)
        // Don't fail the request if KV logging fails
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('HTTP error logging endpoint failed:', error)
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}
