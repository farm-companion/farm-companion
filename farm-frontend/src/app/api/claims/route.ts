import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Module logger for helper functions
const moduleLogger = createRouteLogger('api/claims')

// Type for claim data
interface ClaimData {
  id: string
  shopName: string
  claimantName: string
  claimantEmail: string
  claimantPhone?: string
  claimType: string
  shopAddress: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/claims', request)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'

  try {
    logger.info('Processing claim submission', { ip })

    // CSRF protection
    if (!checkCsrf(request)) {
      logger.warn('CSRF protection failed', { ip })
      throw errors.authorization('CSRF protection failed')
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'claims', limit: 3, windowSec: 3600 })
    if (!await rl.consume(ip)) {
      logger.warn('Rate limit exceeded for claim submission', { ip })
      throw errors.rateLimit('Too many claim submissions. Please wait before submitting again.')
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      throw errors.validation('Invalid JSON in request body')
    }

    // Validate input using comprehensive validation
    let claimData
    try {
      claimData = await validateAndSanitize(ValidationSchemas.claimSubmission, body, {
        sanitize: true,
        strict: false
      })
    } catch (error) {
      if (error instanceof InputValidationError) {
        logger.warn('Validation failed for claim submission', {
          ip,
          field: error.field,
          message: error.message
        })
        throw errors.validation(error.message, { field: error.field })
      }
      throw errors.validation('Invalid input data')
    }

    logger.info('Claim data validated', {
      ip,
      shopName: claimData.shopName,
      claimType: claimData.claimType
    })

    // Anti-spam checks
    if (claimData.hp) {
      logger.warn('Honeypot triggered in claim submission', { ip })
      return NextResponse.json({ ok: true }) // honeypot triggered
    }

    if (Date.now() - claimData.t < 1500) {
      logger.warn('Claim submission filled too quickly (possible bot)', { ip })
      return NextResponse.json({ ok: true }) // too fast submission
    }

    // Add metadata
    const claim: ClaimData = {
      ...claimData,
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending' as const,
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null
    }

    // Ensure claims directory exists
    const claimsDir = path.join(process.cwd(), 'data', 'claims')
    await fs.mkdir(claimsDir, { recursive: true })

    // Save claim to file
    const claimFile = path.join(claimsDir, `${claim.id}.json`)
    await fs.writeFile(claimFile, JSON.stringify(claim, null, 2))

    logger.info('Claim saved to file', {
      ip,
      claimId: claim.id,
      shopName: claim.shopName,
      claimFile
    })

    // Send notification email (if configured)
    await sendNotificationEmail(claim)

    // Send confirmation email to claimant
    await sendConfirmationEmail(claim)

    logger.info('Claim submission completed successfully', {
      ip,
      claimId: claim.id,
      shopName: claim.shopName,
      claimType: claim.claimType
    })

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      message: 'Claim submitted successfully'
    })

  } catch (error) {
    return handleApiError(error, 'api/claims', { ip })
  }
}

async function sendNotificationEmail(claim: ClaimData) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, we'll just log it
  moduleLogger.info('Claim notification email queued', {
    to: 'claims@farmcompanion.co.uk',
    subject: `New Claim: ${claim.shopName}`,
    claimId: claim.id,
    claimant: claim.claimantName,
    claimType: claim.claimType,
    shopAddress: claim.shopAddress,
    claimantEmail: claim.claimantEmail,
    claimantPhone: claim.claimantPhone
  })
}

async function sendConfirmationEmail(claim: ClaimData) {
  // This would send a confirmation email to the claimant
  moduleLogger.info('Claim confirmation email queued', {
    to: claim.claimantEmail,
    from: 'hello@farmcompanion.co.uk',
    subject: `Claim Submitted: ${claim.shopName}`,
    claimId: claim.id,
    message: `Thank you for claiming ${claim.shopName}. We'll review your submission and contact you within 2-3 business days.`
  })
}
