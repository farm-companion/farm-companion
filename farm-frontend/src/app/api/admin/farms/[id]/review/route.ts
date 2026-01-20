import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Module logger for helper functions
const moduleLogger = createRouteLogger('api/admin/farms/review')

interface ReviewAction {
  action: 'approve' | 'reject' | 'request_changes'
  notes?: string
  reviewedBy: string
}

interface FarmSubmission {
  id: string
  name: string
  contact: {
    email?: string
  }
  status?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string | null
  approvedAt?: string
  approvedBy?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createRouteLogger('api/admin/farms/review', request)

  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized access attempt to farm review')
      throw errors.authorization('Unauthorized')
    }

    const { action, notes, reviewedBy }: ReviewAction = await request.json()
    const { id: farmId } = await params

    logger.info('Processing farm review', {
      farmId,
      action,
      reviewedBy,
      hasNotes: !!notes
    })

    // Validate action
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      logger.warn('Invalid review action provided', { action })
      throw errors.validation('Invalid action')
    }

    // Get the farm submission from Redis
    const farmStr = await redis.hget('farm_submissions', farmId)

    if (!farmStr) {
      logger.warn('Farm submission not found in Redis', { farmId })
      throw errors.notFound('Farm submission')
    }

    const farm: FarmSubmission = JSON.parse(String(farmStr))

    // Update farm status
    const now = new Date().toISOString()
    const updatedFarm: FarmSubmission = {
      ...farm,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested',
      reviewedAt: now,
      reviewedBy,
      reviewNotes: notes || null,
      ...(action === 'approve' && {
        approvedAt: now,
        approvedBy: reviewedBy
      })
    }

    logger.info('Updating farm status in Redis', {
      farmId,
      farmName: farm.name,
      newStatus: updatedFarm.status
    })

    // Save updated farm back to Redis
    await redis.hset('farm_submissions', farmId, JSON.stringify(updatedFarm))

    // Send appropriate email notifications
    await sendReviewNotification(updatedFarm, action, notes)

    logger.info('Farm review completed successfully', {
      farmId,
      farmName: farm.name,
      action,
      reviewedBy
    })

    return NextResponse.json({
      success: true,
      message: `Farm ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested'} successfully`
    })

  } catch (error) {
    return handleApiError(error, 'api/admin/farms/review')
  }
}

async function sendReviewNotification(farm: FarmSubmission, action: string, notes?: string) {
  const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested'

  // Send notification to farm contact if email provided
  if (farm.contact.email) {
    moduleLogger.info('Farm review notification prepared', {
      to: farm.contact.email,
      from: 'hello@farmcompanion.co.uk',
      subject: `Farm Shop Review Update: ${farm.name}`,
      farmId: farm.id,
      farmName: farm.name,
      action: actionText,
      notes: notes || 'No additional notes provided',
      message: `Your farm shop submission "${farm.name}" has been ${actionText}. ${
        action === 'approve'
          ? 'Your farm is now live on our directory!'
          : action === 'reject'
          ? 'Unfortunately, we cannot add your farm to our directory at this time.'
          : 'Please review the requested changes and resubmit.'
      }`
    })
  }

  // Send admin notification
  moduleLogger.info('Admin review notification prepared', {
    to: 'hello@farmcompanion.co.uk',
    subject: `Farm Review Completed: ${farm.name}`,
    farmId: farm.id,
    farmName: farm.name,
    action: actionText,
    reviewedBy: farm.reviewedBy,
    reviewNotes: notes || 'No notes provided'
  })
}
