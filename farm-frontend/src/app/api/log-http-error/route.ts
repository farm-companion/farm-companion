import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/log-http-error', request)

  try {
    logger.info('Processing HTTP error log request')

    const { statusCode, url, method } = await request.json()

    // Basic validation
    if (!statusCode || !url) {
      logger.warn('Invalid HTTP error data received', {
        hasStatusCode: !!statusCode,
        hasUrl: !!url
      })
      throw errors.validation('Invalid error data')
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

        logger.info('HTTP error logged to KV', {
          statusCode,
          method,
          url,
          endpoint,
          hourKey
        })
      } catch (kvError) {
        logger.error('Failed to log HTTP error to KV', {}, kvError as Error)
        // Don't fail the request if KV logging fails
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'api/log-http-error')
  }
}
