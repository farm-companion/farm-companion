import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getCurrentUser } from '@/lib/auth'
import { trackContentChange, createFarmChangeEvent } from '@/lib/content-change-tracker'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

interface Farm {
  id: string
  name: string
  slug: string
  location: {
    lat?: number
    lng?: number
    address: string
    county: string
    postcode: string
  }
  contact: {
    email?: string
    phone?: string
  }
  hours?: unknown[]
  offerings?: unknown[]
  story: string
  images?: unknown[]
  seasonal?: unknown[]
  status: string
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string
}

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/farms/approve-to-live', request)

  try {
    logger.info('Processing farm approve-to-live request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized farm approve-to-live attempt')
      throw errors.authorization('Unauthorized')
    }

    const { farmId } = await request.json()

    if (!farmId) {
      logger.warn('Missing farmId in request')
      throw errors.validation('farmId is required')
    }

    logger.info('Reading approved farm submission', { farmId })

    // Read the approved farm submission
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    const farmFile = path.join(farmsDir, `${farmId}.json`)

    let farm: Farm
    try {
      const content = await fs.readFile(farmFile, 'utf-8')
      farm = JSON.parse(content)
    } catch {
      logger.warn('Farm submission not found', { farmId, farmFile })
      throw errors.notFound('Farm submission')
    }

    // Verify farm is approved
    if (farm.status !== 'approved') {
      logger.warn('Farm not in approved status', {
        farmId,
        currentStatus: farm.status
      })
      throw errors.validation('Farm must be approved before moving to live directory')
    }

    // Transform farm data to match live directory format
    const liveFarm = {
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      status: 'active' as const,
      location: {
        lat: farm.location.lat || 54.5, // UK fallback
        lng: farm.location.lng || -2.5,
        address: farm.location.address,
        county: farm.location.county,
        postcode: farm.location.postcode
      },
      contact: farm.contact,
      hours: farm.hours || [],
      offerings: farm.offerings || [],
      story: farm.story,
      images: farm.images || [],
      verified: true,
      verification: {
        method: 'admin_approval',
        timestamp: farm.approvedAt || new Date().toISOString()
      },
      seasonal: farm.seasonal || [],
      updatedAt: farm.approvedAt || new Date().toISOString(),
      // Add metadata from submission
      submittedAt: farm.submittedAt,
      approvedAt: farm.approvedAt,
      approvedBy: farm.approvedBy
    }

    // Ensure live farms directory exists
    const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
    await fs.mkdir(liveFarmsDir, { recursive: true })

    // Save to live directory
    const liveFarmFile = path.join(liveFarmsDir, `${farm.id}.json`)
    await fs.writeFile(liveFarmFile, JSON.stringify(liveFarm, null, 2))

    // Update submission status to 'live'
    const updatedSubmission = {
      ...farm,
      status: 'live',
      movedToLiveAt: new Date().toISOString(),
      movedToLiveBy: user.email
    }
    await fs.writeFile(farmFile, JSON.stringify(updatedSubmission, null, 2))

    logger.info('Farm moved to live directory successfully', {
      farmId: farm.id,
      farmName: farm.name,
      farmSlug: liveFarm.slug
    })

    // Send notification to farm contact
    await sendLiveNotification(liveFarm, logger)

    // Track content change and notify Bing IndexNow (fire-and-forget)
    ;(async () => {
      try {
        const changeEvent = createFarmChangeEvent(
          'publish',
          liveFarm.slug,
          undefined,
          liveFarm.location.county
        )

        const result = await trackContentChange(changeEvent)
        if (result.success) {
          logger.info('Content change tracked for farm publish', {
            farmId: farm.id,
            notificationsSent: result.notificationsSent
          })
        } else {
          logger.warn('Content change tracking failed', {
            farmId: farm.id,
            errors: result.errors
          })
        }
      } catch (error) {
        logger.error('Error tracking content change', { farmId: farm.id }, error as Error)
        // Don't fail the main operation if content change tracking fails
      }
    })()

    return NextResponse.json({
      success: true,
      message: `Farm ${farm.name} moved to live directory successfully`,
      farmId: farm.id
    })

  } catch (error) {
    return handleApiError(error, 'api/admin/farms/approve-to-live')
  }
}

async function sendLiveNotification(farm: Farm, logger: ReturnType<typeof createRouteLogger>) {
  if (farm.contact.email) {
    logger.info('Farm live notification prepared', {
      farmId: farm.id,
      farmName: farm.name,
      farmSlug: farm.slug,
      contactEmail: farm.contact.email,
      farmUrl: `https://www.farmcompanion.co.uk/shop/${farm.slug}`
    })
    // TODO: Implement actual email sending when email service is configured
  }
}
