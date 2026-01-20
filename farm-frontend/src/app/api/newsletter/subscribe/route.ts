// Newsletter Subscription API
// PuredgeOS 3.0 Compliant with Bot Protection

import { NextRequest, NextResponse } from 'next/server'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { processSubscription, verifyRecaptcha } from '@/services/newsletter.service'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/newsletter/subscribe', request)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'

  try {
    logger.info('Processing newsletter subscription request', { ip })

    // CSRF protection
    if (!checkCsrf(request)) {
      logger.warn('CSRF protection failed', { ip })
      throw errors.authorization('CSRF protection failed')
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'newsletter', limit: 5, windowSec: 3600 })
    if (!(await rl.consume(ip))) {
      logger.warn('Rate limit exceeded for newsletter subscription', { ip })
      throw errors.rateLimit('Too many subscription attempts. Please try again later.')
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      throw errors.validation('Invalid JSON in request body')
    }

    // Validate input
    let subscriptionData
    try {
      subscriptionData = await validateAndSanitize(ValidationSchemas.newsletterForm, body, {
        sanitize: true,
        strict: false,
      })
    } catch (error) {
      if (error instanceof InputValidationError) {
        logger.warn('Validation failed for newsletter subscription', {
          ip,
          field: error.field,
          message: error.message
        })
        throw errors.validation(error.message, { field: error.field })
      }
      throw errors.validation('Invalid input data')
    }

    const { email, name, source, recaptchaToken, hp, t } = subscriptionData

    logger.info('Validating subscription request', { ip, email, source })

    // Anti-spam checks
    if (hp) {
      logger.warn('Honeypot triggered for newsletter subscription', { ip })
      return NextResponse.json({ ok: true })
    }

    if (Date.now() - t < 1500) {
      logger.warn('Submission too fast (possible bot)', { ip })
      return NextResponse.json({ ok: true })
    }

    // reCAPTCHA verification (if token provided)
    if (recaptchaToken && !(await verifyRecaptcha(recaptchaToken))) {
      logger.warn('reCAPTCHA verification failed', { ip, email })
      throw errors.validation('Security verification failed. Please try again.')
    }

    // Process subscription (send welcome email and store)
    const result = await processSubscription({
      email,
      name,
      source,
    })

    logger.info('Newsletter subscription completed successfully', {
      ip,
      email,
      name,
      source,
      emailSent: result.emailSent
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to Farm Companion newsletter!',
      emailSent: result.emailSent,
    })

  } catch (error) {
    return handleApiError(error, 'api/newsletter/subscribe', { ip })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Newsletter subscription endpoint',
    features: ['Email validation', 'Rate limiting', 'Bot protection', 'reCAPTCHA integration', 'Welcome emails', 'GDPR compliance'],
  })
}
