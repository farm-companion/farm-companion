import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createRouteLogger('api/farms/status/[id]', request)

  try {
    const { id: farmId } = await params

    logger.info('Fetching farm status', { farmId })

    // Check in submissions directory
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    const farmFile = path.join(farmsDir, `${farmId}.json`)

    let farm
    try {
      const content = await fs.readFile(farmFile, 'utf-8')
      farm = JSON.parse(content)
      logger.info('Farm found in submissions directory', { farmId })
    } catch {
      // Check in live farms directory
      const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
      const liveFarmFile = path.join(liveFarmsDir, `${farmId}.json`)

      try {
        const liveContent = await fs.readFile(liveFarmFile, 'utf-8')
        farm = JSON.parse(liveContent)
        farm.status = 'live' // Override status for live farms
        logger.info('Farm found in live farms directory', { farmId })
      } catch {
        logger.warn('Farm not found in any directory', { farmId })
        throw errors.notFound('Farm submission')
      }
    }

    // Return only public information
    const publicInfo = {
      id: farm.id,
      name: farm.name,
      status: farm.status,
      submittedAt: farm.submittedAt,
      reviewedAt: farm.reviewedAt,
      approvedAt: farm.approvedAt,
      movedToLiveAt: farm.movedToLiveAt,
      reviewNotes: farm.reviewNotes,
      farmUrl: farm.status === 'live' ? `https://www.farmcompanion.co.uk/shop/${farm.slug}` : null
    }

    logger.info('Farm status retrieved successfully', {
      farmId,
      status: farm.status
    })

    return NextResponse.json(publicInfo)

  } catch (error) {
    return handleApiError(error, 'api/farms/status/[id]')
  }
}
