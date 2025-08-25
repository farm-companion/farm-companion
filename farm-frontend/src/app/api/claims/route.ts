import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface ClaimData {
  shopId: string
  shopName: string
  shopSlug: string
  shopUrl: string
  shopAddress: string
  claimantName: string
  claimantRole: string
  claimantEmail: string
  claimantPhone: string
  claimType: 'ownership' | 'management' | 'correction' | 'removal'
  corrections: string
  additionalInfo: string
  verificationMethod: 'email' | 'phone' | 'document'
  verificationDetails: string
  consent: boolean
}

export async function POST(request: NextRequest) {
  try {
    const claimData: ClaimData = await request.json()

    // Validate required fields
    if (!claimData.claimantName || !claimData.claimantEmail || !claimData.consent) {
      return NextResponse.json(
        'Missing required fields: name, email, and consent are required',
        { status: 400 }
      )
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
