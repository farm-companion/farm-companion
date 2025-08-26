import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()
    
    // Basic validation
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json({ error: 'Invalid error data' }, { status: 400 })
    }

    // Only log in production
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
      try {
        // Create a unique key for this error
        const errorKey = `error:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
        
        // Store error data (limited to prevent KV bloat)
        const sanitizedError = {
          message: errorData.message.substring(0, 500), // Limit message length
          url: errorData.url?.substring(0, 200),
          timestamp: errorData.timestamp,
          digest: errorData.digest,
          // Don't store full stack traces in KV to save space
        }

        await kv.set(errorKey, sanitizedError, { ex: 86400 }) // Expire after 24 hours
        
        // Increment error counter
        await kv.incr('error:count')
        
        // Log to console for immediate visibility
        console.error('Error logged:', sanitizedError)
      } catch (kvError) {
        console.error('Failed to log error to KV:', kvError)
        // Don't fail the request if KV logging fails
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error logging endpoint failed:', error)
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}
