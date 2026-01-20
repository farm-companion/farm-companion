import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import { checkCsrf, trackIPReputation, isIPBlocked } from '@/lib/security'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Use edge runtime for lightweight consent operations
export const runtime = 'edge'

const ConsentSchema = z.object({
  ads: z.boolean(),
  analytics: z.boolean(),
})

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/consent', req)
  const ip = getClientIP(req)

  try {
    logger.info('Processing consent update', { ip })

    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      logger.warn('IP blocked for consent update', { ip })
      await trackIPReputation(ip, 'failure')
      throw errors.authorization('Access denied')
    }

    // Apply rate limiting
    const rateLimit = await rateLimiters.api.consume(ip)
    if (!rateLimit) {
      logger.warn('Rate limit exceeded for consent update', { ip })
      await trackIPReputation(ip, 'failure')
      throw errors.rateLimit('Too many requests')
    }

    // CSRF protection
    if (!checkCsrf(req)) {
      logger.warn('CSRF check failed for consent update', { ip })
      await trackIPReputation(ip, 'failure')
      throw errors.authorization('Invalid request origin')
    }

    const body = await req.json().catch(() => ({}))

    // Validate input with Zod
    const parse = ConsentSchema.safeParse(body)
    if (!parse.success) {
      logger.warn('Invalid consent data', { ip, errors: parse.error.errors })
      await trackIPReputation(ip, 'failure')
      throw errors.validation('Invalid consent data')
    }
    
    const { ads, analytics } = parse.data

    // Create consent cookie
    const consentData = { ads, analytics }
    const consentJson = JSON.stringify(consentData)

    logger.info('Setting consent cookie', { ip, ads, analytics })

    // Set cookie with appropriate settings
    const response = NextResponse.json({
      success: true,
      message: 'Consent preferences updated'
    })

    response.cookies.set('fc_consent', consentJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    // Track successful consent update
    await trackIPReputation(ip, 'success')

    logger.info('Consent preferences updated successfully', { ip, ads, analytics })

    return response

  } catch (error) {
    await trackIPReputation(ip, 'failure')
    return handleApiError(error, 'api/consent', { ip })
  }
}

export async function GET(req: NextRequest) {
  const logger = createRouteLogger('api/consent', req)
  const ip = getClientIP(req)

  try {
    logger.info('Retrieving consent preferences', { ip })

    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      logger.warn('IP blocked for consent retrieval', { ip })
      throw errors.authorization('Access denied')
    }

    // Get consent from cookie
    const consentCookie = req.cookies.get('fc_consent')?.value

    if (!consentCookie) {
      logger.info('No consent cookie found, returning default', { ip })
      const response = NextResponse.json({
        consent: { ads: false, analytics: false },
        hasConsent: false
      })

      // Add cache control headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')

      return response
    }

    try {
      const consent = JSON.parse(consentCookie)
      logger.info('Consent preferences retrieved', { ip, consent })
      const response = NextResponse.json({
        consent,
        hasConsent: true
      })

      // Add cache control headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')

      return response
    } catch {
      logger.warn('Failed to parse consent cookie, returning default', { ip })
      const response = NextResponse.json({
        consent: { ads: false, analytics: false },
        hasConsent: false
      })

      // Add cache control headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')

      return response
    }

  } catch (error) {
    return handleApiError(error, 'api/consent', { ip })
  }
}
