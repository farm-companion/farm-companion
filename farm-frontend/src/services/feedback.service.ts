/**
 * Feedback Service
 * Handles feedback submission business logic
 */

import { createRouteLogger } from '@/lib/logger'
import { sendFeedbackConfirmation, sendFeedbackNotification } from './email.service'

export interface FeedbackData {
  name: string
  email: string
  subject: string
  message: string
}

export interface FeedbackResult {
  success: boolean
  feedbackId: string
  timestamp: string
}

/**
 * Generate unique feedback ID
 */
function generateFeedbackId(): string {
  return `FB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

/**
 * Store feedback in database
 * TODO: Implement actual database storage
 */
async function storeFeedback(data: FeedbackData, feedbackId: string): Promise<void> {
  const logger = createRouteLogger('feedback.service/store')

  // Placeholder for database storage
  logger.info('Feedback stored (placeholder)', {
    id: feedbackId,
    email: data.email,
    subject: data.subject,
  })

  // TODO: Add Prisma model for feedback
  // await prisma.feedback.create({
  //   data: {
  //     id: feedbackId,
  //     name: data.name,
  //     email: data.email,
  //     subject: data.subject,
  //     message: data.message,
  //     status: 'pending',
  //   },
  // })
}

/**
 * Process feedback submission
 */
export async function processFeedback(data: FeedbackData): Promise<FeedbackResult> {
  const logger = createRouteLogger('feedback.service')
  const feedbackId = generateFeedbackId()
  const timestamp = new Date().toISOString()

  try {
    // Store feedback
    await storeFeedback(data, feedbackId)

    // Send confirmation email to user
    await sendFeedbackConfirmation({
      email: data.email,
      name: data.name,
      subject: data.subject,
      feedbackId,
    })

    // Send notification email to admin
    await sendFeedbackNotification({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      feedbackId,
    })

    logger.info('Feedback processed successfully', {
      feedbackId,
      email: data.email,
    })

    return {
      success: true,
      feedbackId,
      timestamp,
    }
  } catch (error) {
    logger.error('Feedback processing failed', { email: data.email }, error as Error)
    throw error
  }
}
