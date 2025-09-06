import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'


export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!checkCsrf(request)) {
      return NextResponse.json({ error: 'CSRF protection failed' }, { status: 400 })
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'claims', limit: 3, windowSec: 3600 })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'
    if (!await rl.consume(ip)) {
      return NextResponse.json({ error: 'Too many claim submissions. Please wait before submitting again.' }, { status: 429 })
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
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
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            message: error.message,
            field: error.field
          }, 
          { status: 422 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid input data' }, 
        { status: 400 }
      )
    }

    // Anti-spam checks
    if (claimData.hp) {
      return NextResponse.json({ ok: true }) // honeypot triggered
    }
    
    if (Date.now() - claimData.t < 1500) {
      return NextResponse.json({ ok: true }) // too fast submission
    }

    // Add metadata
    const claim = {
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

    // Send notification email (if configured)
    await sendNotificationEmail(claim)

    // Send confirmation email to claimant
    await sendConfirmationEmail(claim)

    return NextResponse.json({ 
      success: true, 
      claimId: claim.id,
      message: 'Claim submitted successfully' 
    })

  } catch (error) {
    console.error('Error processing claim:', error)
    return NextResponse.json(
      'Internal server error',
      { status: 500 }
    )
  }
}

async function sendNotificationEmail(claim: any) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, we'll just log it
  console.log('📧 CLAIM NOTIFICATION:', {
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

async function sendConfirmationEmail(claim: any) {
  // This would send a confirmation email to the claimant
  console.log('📧 CLAIM CONFIRMATION:', {
    to: claim.claimantEmail,
    from: 'hello@farmcompanion.co.uk',
    subject: `Claim Submitted: ${claim.shopName}`,
    claimId: claim.id,
    message: `Thank you for claiming ${claim.shopName}. We'll review your submission and contact you within 2-3 business days.`
  })
}
