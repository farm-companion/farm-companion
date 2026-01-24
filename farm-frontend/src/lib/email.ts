// Email service for Farm Frontend
// PuredgeOS 3.0 Compliant Email Management

import { Resend } from 'resend'
import PhotoSubmissionReceiptEmail from '@/emails/PhotoSubmissionReceipt'
import { logger } from '@/lib/logger'

// Module-level logger for email operations
const emailLogger = logger.child({ route: 'lib/email' })
// import PhotoApprovedEmail from '@/emails/PhotoApproved'
// import PhotoRejectedEmail from '@/emails/PhotoRejected'

// Lazy initialization to avoid build-time errors when API key is unavailable
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return resend
}

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
    emailLogger.warn('Photo receipt email skipped - missing required fields', {
      hasTo: !!input.to,
      hasFrom: !!from,
      farmSlug: input.farmSlug
    })
    return { skipped: true, reason: 'missing_required_fields' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.to)) {
    emailLogger.warn('Photo receipt email skipped - invalid email format', { email: input.to })
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

    const result = await getResend().emails.send({
      from,
      to: input.to,
      ...(bcc ? { bcc } : {}),
      subject,
      react,
      // Add reply-to for better user experience
      replyTo: 'support@farmcompanion.co.uk',
    })

    emailLogger.info('Photo receipt email sent successfully', {
      to: input.to,
      farmSlug: input.farmSlug,
      messageId: result.data?.id
    })

    return result
  } catch (error) {
    emailLogger.error('Photo receipt email send failed', {
      to: input.to,
      farmSlug: input.farmSlug
    }, error as Error)
    
    // Return error details for monitoring
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Photo approval email sender - TODO: Implement when PhotoApproved template is created
/*
export async function sendPhotoApprovedEmail(opts: {
  to: string
  farmName: string
  farmSlug: string
  photoUrl?: string
  caption?: string
}) {
  const from = process.env.RESEND_FROM!
  const bcc = process.env.RESEND_BCC_ADMIN
  const siteUrl = process.env.SITE_URL || 'https://www.farmcompanion.co.uk'
  const logoPath = `${siteUrl}/brand/farm-companion-logo.svg`

  if (!opts.to || !from) {
    console.warn('Photo approved email skipped: missing required fields')
    return { skipped: true, reason: 'missing_required_fields' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(opts.to)) {
    console.warn('Photo approved email skipped: invalid email format', { email: opts.to })
    return { skipped: true, reason: 'invalid_email_format' }
  }

  const subject = `Your photo has been approved for ${opts.farmName}`

  try {
    const react = PhotoApprovedEmail({
      siteUrl,
      logoPath,
      farmName: opts.farmName,
      farmSlug: opts.farmSlug,
      photoUrl: opts.photoUrl,
      caption: opts.caption,
    })

    const result = await getResend().emails.send({
      from,
      to: opts.to,
      ...(bcc ? { bcc } : {}),
      subject,
      react,
      replyTo: 'support@farmcompanion.co.uk',
    })

    console.log('Photo approved email sent successfully', {
      to: opts.to,
      farmSlug: opts.farmSlug,
      messageId: result.data?.id
    })

    return result
  } catch (error) {
    console.error('Photo approved email send failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: opts.to,
      farmSlug: opts.farmSlug,
    })
    
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Photo rejection email sender - TODO: Implement when PhotoRejected template is created
export async function sendPhotoRejectedEmail(opts: {
  to: string
  farmName: string
  farmSlug: string
  rejectReason: string
  photoUrl?: string
  caption?: string
}) {
  const from = process.env.RESEND_FROM!
  const bcc = process.env.RESEND_BCC_ADMIN
  const siteUrl = process.env.SITE_URL || 'https://www.farmcompanion.co.uk'
  const logoPath = `${siteUrl}/brand/farm-companion-logo.svg`

  if (!opts.to || !from) {
    console.warn('Photo rejected email skipped: missing required fields')
    return { skipped: true, reason: 'missing_required_fields' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(opts.to)) {
    console.warn('Photo rejected email skipped: invalid email format', { email: opts.to })
    return { skipped: true, reason: 'invalid_email_format' }
  }

  const subject = `Your photo for ${opts.farmName} needs some changes`

  try {
    const react = PhotoRejectedEmail({
      siteUrl,
      logoPath,
      farmName: opts.farmName,
      farmSlug: opts.farmSlug,
      photoUrl: opts.photoUrl,
      caption: opts.caption,
      rejectReason: opts.rejectReason,
    })

    const result = await getResend().emails.send({
      from,
      to: opts.to,
      ...(bcc ? { bcc } : {}),
      subject,
      react,
      replyTo: 'support@farmcompanion.co.uk',
    })

    console.log('Photo rejected email sent successfully', {
      to: opts.to,
      farmSlug: opts.farmSlug,
      messageId: result.data?.id
    })

    return result
  } catch (error) {
    console.error('Photo rejected email send failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: opts.to,
      farmSlug: opts.farmSlug,
    })
    
    return { 
      error: true, 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}
*/

// Farm submission acknowledgment email sender
export async function sendSubmissionAckEmail(opts: {
  to: string
  farmName: string
}) {
  const from = process.env.RESEND_FROM!
  const bcc = process.env.RESEND_BCC_ADMIN
  const siteUrl = process.env.SITE_URL || 'https://www.farmcompanion.co.uk'
  const logoPath = `${siteUrl}/brand/farm-companion-logo.svg`

  if (!opts.to || !from) {
    emailLogger.warn('Farm submission ack email skipped - missing required fields', { farmName: opts.farmName })
    return { skipped: true, reason: 'missing_required_fields' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(opts.to)) {
    emailLogger.warn('Farm submission ack email skipped - invalid email format', { email: opts.to })
    return { skipped: true, reason: 'invalid_email_format' }
  }

  const subject = `Farm Shop Submission Confirmed: ${opts.farmName}`

  try {
    // Simple HTML email since we don't have a React template for this yet
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your farm shop submission!</h2>
        <p>We've received your submission for <strong>${opts.farmName}</strong> and will review it within 2-3 business days.</p>
        <p>You'll receive another email once your farm shop has been approved and added to our directory.</p>
        <p>If you have any questions, please reply to this email.</p>
        <br>
        <p>Best regards,<br>The Farm Companion Team</p>
      </div>
    `

    const result = await getResend().emails.send({
      from,
      to: opts.to,
      ...(bcc ? { bcc } : {}),
      subject,
      html,
      replyTo: 'support@farmcompanion.co.uk',
    })

    emailLogger.info('Farm submission ack email sent successfully', {
      to: opts.to,
      farmName: opts.farmName,
      messageId: result.data?.id
    })

    return result
  } catch (error) {
    emailLogger.error('Farm submission ack email send failed', {
      to: opts.to,
      farmName: opts.farmName
    }, error as Error)
    
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
    emailLogger.warn('Email configuration incomplete', { missing })
    return false
  }

  return true
}
