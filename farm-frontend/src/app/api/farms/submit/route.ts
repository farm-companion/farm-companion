import { NextRequest, NextResponse } from 'next/server'
import { submitLimiter } from '@/lib/rate-limit'
import { createRecord, ValidationError, ConstraintViolationError } from '@/lib/database-constraints'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'
import { verifyEmail, friendlyMessage } from '@/lib/email-verification'

// Module logger for helper functions
const moduleLogger = createRouteLogger('api/farms/submit')

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/farms/submit', req)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'

  try {
    logger.info('Processing farm submission request', { ip })

    // Kill-switch check
    if (process.env.ADD_FORM_ENABLED !== 'true') {
      logger.warn('Farm submission form disabled via kill switch', { ip })
      throw errors.validation('Farm submission form is currently disabled')
    }

    // Rate limiting (fail-closed: any KV timeout or error → 429)
    let success: boolean
    let remaining: number
    let reset: number
    try {
      ;({ success, remaining, reset } = await submitLimiter.limit(`add:${ip}`))
    } catch (e) {
      logger.warn('Rate-limit check failed; denying request (fail-closed)', { ip }, e as Error)
      throw errors.rateLimit('Service busy. Please try again in a moment.')
    }

    if (!success) {
      logger.warn('Rate limit exceeded for farm submission', { ip, remaining, reset })
      throw errors.rateLimit('Too many submissions. Please wait before submitting again.')
    }

    // Parse request body
    let data: unknown
    try {
      data = await req.json()
    } catch {
      throw errors.validation('Invalid JSON in request body')
    }

    // Validate input using comprehensive validation
    let v
    try {
      v = await validateAndSanitize(ValidationSchemas.farmSubmission, data, {
        sanitize: true,
        strict: false
      })
    } catch (error) {
      if (error instanceof InputValidationError) {
        logger.warn('Validation failed for farm submission', {
          ip,
          field: error.field,
          message: error.message
        })
        throw errors.validation(error.message, { field: error.field })
      }
      throw errors.validation('Invalid input data')
    }

    logger.info('Farm submission data validated', {
      ip,
      name: v.name,
      county: v.county,
      postcode: v.postcode
    })

    // Third-party email verification (skip when contact email omitted; fail-open if MAILBOXLAYER_API_KEY unset)
    if (v.contactEmail) {
      const verdict = await verifyEmail(v.contactEmail)
      if (!verdict.isValid) {
        logger.warn('Email rejected by verification', {
          ip,
          email: verdict.email,
          reason: verdict.reason,
          source: verdict.source,
        })
        throw errors.validation(
          verdict.suggestion
            ? `Please check the contact email. Did you mean ${verdict.suggestion}?`
            : friendlyMessage(verdict.reason),
          { field: 'contactEmail' }
        )
      }
    }

    // Anti-spam checks
    if (v._hp) {
      logger.warn('Honeypot triggered in farm submission', { ip })
      throw errors.validation('Spam detected')
    }

    if ((v.ttf ?? 0) < 2000) {
      logger.warn('Farm submission filled too quickly (possible bot)', { ip, ttf: v.ttf })
      throw errors.validation('Form filled too quickly')
    }

    // Generate unique ID
    const id = crypto.randomUUID()
  
  // Prepare farm data
  const farmData = {
    id,
    name: v.name.trim(),
    address: v.address.trim(),
    city: v.city?.trim() || '',
    county: v.county.trim(),
    postcode: v.postcode.trim(),
    contactEmail: v.contactEmail?.trim() || '',
    website: v.website?.trim() || '',
    phone: v.phone?.trim() || '',
    lat: v.lat?.trim() || '',
    lng: v.lng?.trim() || '',
    offerings: v.offerings?.trim() || '',
    story: v.story?.trim() || '',
    hours: v.hours || [],
    status: 'pending' as const,
    createdAt: Date.now(),
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
    approvedAt: null,
    approvedBy: null
  }

    logger.info('Storing farm submission', { ip, id, name: v.name })

    // Use database constraints system for atomic operation
    await createRecord('submissions', farmData, id)

    logger.info('Farm submission stored successfully', {
      ip,
      id,
      name: v.name,
      county: v.county
    })

    // Send confirmation email if contact email provided (fire-and-forget)
    if (v.contactEmail) {
      ;(async () => {
        try {
          // Import email function if it exists
          const { sendSubmissionAckEmail } = await import('@/lib/email').catch(() => ({ sendSubmissionAckEmail: null }))
          if (sendSubmissionAckEmail) {
            await sendSubmissionAckEmail({
              to: v.contactEmail!,
              farmName: v.name
            })
            moduleLogger.info('Submission acknowledgement email sent', {
              ip,
              id,
              email: v.contactEmail
            })
          }
        } catch (e) {
          moduleLogger.error('Failed to send submission acknowledgement email', {
            ip,
            id,
            email: v.contactEmail
          }, e as Error)
          // Don't fail the request if email fails
        }
      })()
    }

    return NextResponse.json(
      {
        ok: true,
        id,
        message: 'Farm shop submitted successfully. We\'ll review and add it to our directory within 2-3 business days.'
      },
      { status: 201 }
    )

  } catch (error) {
    // Handle specific validation errors
    if (error instanceof ValidationError) {
      logger.warn('Database validation error for farm submission', {
        ip,
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    if (error instanceof ConstraintViolationError) {
      logger.warn('Database constraint violation for farm submission', {
        ip,
        constraint: error.constraint,
        message: error.message
      })
      throw errors.validation(error.message, { constraint: error.constraint })
    }

    return handleApiError(error, 'api/farms/submit', { ip })
  }
}
