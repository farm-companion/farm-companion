/**
 * Newsletter Service
 * Handles newsletter subscription business logic
 */

import { createRouteLogger } from '@/lib/logger'
import { sendNewsletterWelcome } from './email.service'

export interface SubscriptionData {
  email: string
  name: string
  source?: string
}

export interface SubscriptionResult {
  success: boolean
  emailSent: boolean
  timestamp: string
}

/**
 * Verify reCAPTCHA token
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const logger = createRouteLogger('newsletter.service/recaptcha')

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data = await response.json()
    return data.success && data.score > 0.5
  } catch (error) {
    logger.error('reCAPTCHA verification failed', {}, error as Error)
    return false
  }
}

/**
 * Check if email matches suspicious patterns
 */
export function isSuspiciousEmail(email: string): boolean {
  const suspiciousPatterns = [
    /^test@/i,
    /^admin@/i,
    /^info@/i,
    /^noreply@/i,
    /^mail@/i,
    /^webmaster@/i,
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(email))
}

/**
 * Store subscription in database
 * TODO: Implement actual database storage
 */
async function storeSubscription(data: SubscriptionData): Promise<void> {
  const logger = createRouteLogger('newsletter.service/store')

  // Placeholder for database storage
  logger.info('Subscription stored (placeholder)', {
    email: data.email,
    name: data.name,
    source: data.source,
  })

  // TODO: Add Prisma model for newsletter subscriptions
  // await prisma.newsletterSubscription.create({
  //   data: {
  //     email: data.email,
  //     name: data.name,
  //     source: data.source,
  //     status: 'active',
  //   },
  // })
}

/**
 * Process newsletter subscription
 */
export async function processSubscription(data: SubscriptionData): Promise<SubscriptionResult> {
  const logger = createRouteLogger('newsletter.service')
  const timestamp = new Date().toISOString()

  try {
    // Check for suspicious email patterns
    if (isSuspiciousEmail(data.email)) {
      logger.warn('Suspicious email pattern detected (monitoring only)', { email: data.email })
    }

    // Store subscription
    await storeSubscription(data)

    // Send welcome email
    let emailSent = false
    try {
      await sendNewsletterWelcome({
        email: data.email,
        name: data.name,
      })
      emailSent = true
    } catch (error) {
      logger.error('Failed to send welcome email (non-fatal)', { email: data.email }, error as Error)
    }

    logger.info('Newsletter subscription processed successfully', {
      email: data.email,
      emailSent,
    })

    return {
      success: true,
      emailSent,
      timestamp,
    }
  } catch (error) {
    logger.error('Newsletter subscription processing failed', { email: data.email }, error as Error)
    throw error
  }
}
