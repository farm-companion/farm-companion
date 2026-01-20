import { NextRequest, NextResponse } from 'next/server'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { processFeedback } from '@/services/feedback.service'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/feedback', request)

  try {
    // CSRF protection
    if (!checkCsrf(request)) {
      return NextResponse.json({ error: 'CSRF protection failed' }, { status: 400 })
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'feedback', limit: 10, windowSec: 3600 })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'
    if (!(await rl.consume(ip))) {
      return NextResponse.json({ error: 'Too many submissions. Please wait before submitting again.' }, { status: 429 })
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Validate input using comprehensive validation
    let feedbackData
    try {
      feedbackData = await validateAndSanitize(ValidationSchemas.feedbackForm, body, {
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

    const { name, email, subject, message, hp, t } = feedbackData

    // Anti-spam checks
    if (hp) {
      return NextResponse.json({ ok: true }) // honeypot triggered
    }

    if (Date.now() - t < 1500) {
      return NextResponse.json({ ok: true }) // too fast submission
    }

    // Process feedback (send emails and store)
    const result = await processFeedback({
      name,
      email,
      subject,
      message,
    })

    logger.info('Feedback submitted successfully', { feedbackId: result.feedbackId })

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedbackId: result.feedbackId,
        timestamp: result.timestamp,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Feedback submission error', {}, error as Error)
    return NextResponse.json({ error: 'Internal server error. Please try again later.' }, { status: 500 })
  }
}
