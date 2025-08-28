// Email service for Farm Frontend
// PuredgeOS 3.0 Compliant Email Management

import { Resend } from 'resend'
import PhotoSubmissionReceiptEmail from '@/emails/PhotoSubmissionReceipt'

const resend = new Resend(process.env.RESEND_API_KEY!)

export type ReceiptInput = {
  to: string
  farmName: string
  farmSlug: string
  caption?: string
  authorName?: string
  authorEmail?: string
  photoUrl?: string
}

export async function sendPhotoSubmissionReceipt(input: ReceiptInput) {
  const from = process.env.RESEND_FROM!
  const bcc = process.env.RESEND_BCC_ADMIN
  const siteUrl = process.env.SITE_URL || 'https://www.farmcompanion.co.uk'
  const logoPath = `${siteUrl}/brand/farm-companion-logo.svg`

  // Enhanced validation with detailed logging
  if (!input.to || !from) {
    console.warn('Email send skipped: missing required fields', {
      hasTo: !!input.to,
      hasFrom: !!from,
      farmSlug: input.farmSlug
    })
    return { skipped: true, reason: 'missing_required_fields' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.to)) {
    console.warn('Email send skipped: invalid email format', { email: input.to })
    return { skipped: true, reason: 'invalid_email_format' }
  }

  const subject = `Thanks — we received your photo for ${input.farmName}`

  try {
    const react = PhotoSubmissionReceiptEmail({
      siteUrl,
      logoPath,
      farmName: input.farmName,
      farmSlug: input.farmSlug,
      photoUrl: input.photoUrl,
      caption: input.caption,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
    })

    const result = await resend.emails.send({
      from,
      to: input.to,
      ...(bcc ? { bcc } : {}),
      subject,
      react,
      // Add reply-to for better user experience
      replyTo: 'support@farmcompanion.co.uk',
    })

    console.log('Email sent successfully', {
      to: input.to,
      farmSlug: input.farmSlug,
      messageId: result.data?.id
    })

    return result
  } catch (error) {
    console.error('Email send failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: input.to,
      farmSlug: input.farmSlug,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return error details for monitoring
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Utility function to validate email configuration
export function validateEmailConfig() {
  const required = ['RESEND_API_KEY', 'RESEND_FROM', 'SITE_URL']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn('Email configuration incomplete', { missing })
    return false
  }
  
  return true
}
