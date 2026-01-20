/**
 * Contact Service
 * Handles contact form business logic
 */

import { createRouteLogger } from '@/lib/logger'
import { sendContactConfirmation, sendContactNotification } from './email.service'

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export interface ContactFormResult {
  success: boolean
  timestamp: string
}

/**
 * Process contact form submission
 */
export async function processContactForm(data: ContactFormData): Promise<ContactFormResult> {
  const logger = createRouteLogger('contact.service')
  const timestamp = new Date().toISOString()

  try {
    // Send confirmation email to user
    await sendContactConfirmation({
      email: data.email,
      name: data.name,
      subject: data.subject,
      message: data.message,
      timestamp,
    })

    // Send notification email to admin
    await sendContactNotification({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      timestamp,
    })

    logger.info('Contact form processed successfully', {
      email: data.email,
      subject: data.subject,
    })

    return {
      success: true,
      timestamp,
    }
  } catch (error) {
    logger.error('Contact form processing failed', { email: data.email }, error as Error)
    throw error
  }
}
