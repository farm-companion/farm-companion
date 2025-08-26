import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'

// Enhanced validation schema with anti-spam measures
const claimSchema = z.object({
  shopId: z.string().min(1, 'Shop ID is required'),
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(200, 'Shop name too long'),
  shopSlug: z.string().min(1, 'Shop slug is required'),
  shopUrl: z.string().url('Invalid shop URL'),
  shopAddress: z.string().min(5, 'Shop address must be at least 5 characters').max(500, 'Shop address too long'),
  claimantName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  claimantRole: z.string().min(2, 'Role must be at least 2 characters').max(100, 'Role too long'),
  claimantEmail: z.string().email('Invalid email address'),
  claimantPhone: z.string().min(10, 'Phone must be at least 10 characters').max(20, 'Phone too long'),
  claimType: z.enum(['ownership', 'management', 'correction', 'removal']),
  corrections: z.string().max(2000, 'Corrections too long'),
  additionalInfo: z.string().max(2000, 'Additional info too long'),
  verificationMethod: z.enum(['email', 'phone', 'document']),
  verificationDetails: z.string().max(1000, 'Verification details too long'),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
  hp: z.string().optional(), // honeypot field
  t: z.number() // submission timestamp
})

type ClaimData = z.infer<typeof claimSchema>

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

    // Validate input
    const validation = claimSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const claimData = validation.data

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
