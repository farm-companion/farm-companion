// Newsletter Subscription API
// PuredgeOS 3.0 Compliant with Bot Protection

import { NextRequest, NextResponse } from 'next/server'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { processSubscription, verifyRecaptcha } from '@/services/newsletter.service'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/newsletter/subscribe', request)

  try {
    // CSRF protection
    if (!checkCsrf(request)) {
      return NextResponse.json({ error: 'CSRF protection failed' }, { status: 400 })
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'newsletter', limit: 5, windowSec: 3600 })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'
    if (!(await rl.consume(ip))) {
      return NextResponse.json(
        { error: 'Too many subscription attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
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
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: error.message,
            field: error.field,
          },
          { status: 422 }
        )
      }
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    const { email, name, source, recaptchaToken, hp, t } = subscriptionData

    // Anti-spam checks
    if (hp) {
      return NextResponse.json({ ok: true }) // honeypot triggered
    }

    if (Date.now() - t < 1500) {
      return NextResponse.json({ ok: true }) // too fast submission
    }

    // reCAPTCHA verification (if token provided)
    if (recaptchaToken && !(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 })
    }

    // Process subscription (send welcome email and store)
    const result = await processSubscription({
      email,
      name,
      source,
    })

    logger.info('Newsletter subscription successful', { email, emailSent: result.emailSent })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to Farm Companion newsletter!',
      emailSent: result.emailSent,
    })
  } catch (error) {
    logger.error('Newsletter subscription error', {}, error as Error)
    return NextResponse.json({ error: 'Failed to process subscription. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Newsletter subscription endpoint',
    features: ['Email validation', 'Rate limiting', 'Bot protection', 'reCAPTCHA integration', 'Welcome emails', 'GDPR compliance'],
  })
}
