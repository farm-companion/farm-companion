import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/log-error', request)

  try {
    logger.info('Processing error log request')

    const errorData = await request.json()

    // Basic validation
    if (!errorData.message || !errorData.timestamp) {
      logger.warn('Invalid error data received', {
        hasMessage: !!errorData.message,
        hasTimestamp: !!errorData.timestamp
      })
      throw errors.validation('Invalid error data')
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

        logger.info('Error logged to KV', {
          errorKey,
          message: sanitizedError.message,
          url: sanitizedError.url,
          timestamp: sanitizedError.timestamp
        })
      } catch (kvError) {
        logger.error('Failed to log error to KV', {}, kvError as Error)
        // Don't fail the request if KV logging fails
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'api/log-error')
  }
}
