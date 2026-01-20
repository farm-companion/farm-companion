import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

interface Submission {
  id: string
  submittedAt: string
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/admin/farms', request)

  try {
    logger.info('Processing farm submissions list request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized farm submissions list request')
      throw errors.authorization('Unauthorized')
    }

    // Get all farm submissions from Redis
    const submissions = await redis.hgetall('farm_submissions') || {}

    // Convert to array and sort by submission date (newest first)
    const submissionsArray = Object.entries(submissions).map(([id, submissionStr]) => {
      const submission = JSON.parse(submissionStr as string)
      return {
        ...submission,
        id,
        submittedAt: submission.submittedAt || new Date().toISOString()
      } as Submission
    })

    submissionsArray.sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    logger.info('Farm submissions retrieved successfully', {
      count: submissionsArray.length
    })

    return NextResponse.json({ submissions: submissionsArray })

  } catch (error) {
    return handleApiError(error, 'api/admin/farms')
  }
}
