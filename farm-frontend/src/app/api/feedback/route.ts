import { NextRequest, NextResponse } from 'next/server'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { processFeedback } from '@/services/feedback.service'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/feedback', request)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'

  try {
    logger.info('Processing feedback submission', { ip })

    // CSRF protection
    if (!checkCsrf(request)) {
      logger.warn('CSRF protection failed', { ip })
      throw errors.authorization('CSRF protection failed')
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'feedback', limit: 10, windowSec: 3600 })
    if (!(await rl.consume(ip))) {
      logger.warn('Rate limit exceeded for feedback', { ip })
      throw errors.rateLimit('Too many submissions. Please wait before submitting again.')
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      logger.warn('Invalid JSON in feedback request', { ip })
      throw errors.validation('Invalid JSON')
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
        throw errors.validation('Validation failed', {
          message: error.message,
          field: error.field,
        })
      }
      throw errors.validation('Invalid input data')
    }

    const { name, email, subject, message, hp, t } = feedbackData

    // Anti-spam checks (silent discard)
    if (hp) {
      return NextResponse.json({ ok: true })
    }

    if (Date.now() - t < 1500) {
      return NextResponse.json({ ok: true })
    }

    // Process feedback (send emails and store)
    const result = await processFeedback({
      name,
      email,
      subject,
      message,
    })

    logger.info('Feedback submitted successfully', {
      feedbackId: result.feedbackId,
      name,
      email,
      subject,
      ip
    })

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedbackId: result.feedbackId,
        timestamp: result.timestamp,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error, 'api/feedback', { ip })
  }
}
