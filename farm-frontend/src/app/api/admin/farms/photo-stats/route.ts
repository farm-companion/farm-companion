import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'
import type { RedisClientType } from '@redis/client'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/admin/farms/photo-stats', request)

  try {
    logger.info('Processing farm photo stats request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized farm photo stats request')
      throw errors.authorization('Unauthorized')
    }

    const { searchParams } = new URL(request.url)
    const farmSlug = searchParams.get('farmSlug')

    const client = await ensureConnection()

    if (farmSlug) {
      logger.info('Fetching photo stats for specific farm', { farmSlug })
      return await getFarmPhotoStats(client, farmSlug, logger)
    } else {
      logger.info('Fetching photo stats for all farms')
      return await getAllFarmsPhotoStats(client, logger)
    }
  } catch (error) {
    return handleApiError(error, 'api/admin/farms/photo-stats')
  }
}

async function getFarmPhotoStats(client: RedisClientType, farmSlug: string, logger: ReturnType<typeof createRouteLogger>) {
  try {
    // Get photo counts for different statuses
    const pendingCount = await client.sCard(`farm:${farmSlug}:photos:pending`)
    const approvedCount = await client.sCard(`farm:${farmSlug}:photos:approved`)
    const rejectedCount = await client.sCard(`farm:${farmSlug}:photos:rejected`)

    logger.info('Retrieved photo counts for farm', {
      farmSlug,
      pendingCount,
      approvedCount,
      rejectedCount
    })

    // Get all approved photo IDs for this farm
    const approvedPhotoIds = await client.sMembers(`farm:${farmSlug}:photos:approved`)

    // Get detailed info for approved photos
    const approvedPhotos = await Promise.all(
      approvedPhotoIds.map(async (id: string) => {
        try {
          const photoData = await client.hGetAll(`photo:${id}`)
          if (photoData && Object.keys(photoData).length > 0) {
            return {
              id,
              caption: photoData.caption,
              authorName: photoData.authorName,
              authorEmail: photoData.authorEmail,
              createdAt: parseInt(photoData.createdAt || '0'),
              approvedAt: parseInt(photoData.approvedAt || '0'),
              url: photoData.url
            }
          }
          return null
        } catch (error) {
          logger.error('Error fetching photo data', { photoId: id, farmSlug }, error as Error)
          return null
        }
      })
    )

    const validPhotos = approvedPhotos.filter(Boolean).sort((a, b) => b!.approvedAt - a!.approvedAt)

    // Calculate upload frequency
    const now = Date.now()
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    const recentUploads = validPhotos.filter(photo => photo!.approvedAt > thirtyDaysAgo).length

    // Get upload history (last 10 uploads)
    const uploadHistory = validPhotos.slice(0, 10).map(photo => ({
      id: photo!.id,
      caption: photo!.caption,
      authorName: photo!.authorName,
      approvedAt: photo!.approvedAt,
      date: new Date(photo!.approvedAt).toISOString()
    }))

    logger.info('Farm photo stats compiled successfully', {
      farmSlug,
      totalPhotos: validPhotos.length,
      recentUploads
    })

    return NextResponse.json({
      farmSlug,
      stats: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        total: (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
        quota: {
          current: approvedCount || 0,
          max: 5,
          remaining: Math.max(0, 5 - (approvedCount || 0))
        },
        recentUploads,
        uploadHistory
      },
      photos: validPhotos
    })
  } catch (error) {
    logger.error('Error getting stats for farm', { farmSlug }, error as Error)
    throw errors.notFound('Farm')
  }
}

interface FarmStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

async function getAllFarmsPhotoStats(client: RedisClientType, logger: ReturnType<typeof createRouteLogger>) {
  try {
    // Get all farm keys
    const farmKeys = await client.keys('farm:*:photos:*')

    logger.info('Retrieved farm keys for stats aggregation', {
      farmKeysCount: farmKeys.length
    })

    const farmStats: Record<string, FarmStats> = {}
    const farmSlugs = new Set<string>()

    // Process each farm
    for (const key of farmKeys) {
      const parts = key.split(':')
      if (parts.length >= 3) {
        const farmSlug = parts[1]
        const photoType = parts[3] as 'approved' | 'pending' | 'rejected'

        farmSlugs.add(farmSlug)

        if (!farmStats[farmSlug]) {
          farmStats[farmSlug] = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0
          }
        }

        const count = await client.sCard(key)
        farmStats[farmSlug][photoType] = count || 0
        farmStats[farmSlug].total += count || 0
      }
    }

    // Calculate summary statistics
    const summary = {
      totalFarms: farmSlugs.size,
      totalPhotos: 0,
      totalPending: 0,
      totalApproved: 0,
      totalRejected: 0,
      farmsAtQuota: 0,
      farmsWithPending: 0,
      averagePhotosPerFarm: 0
    }

    Object.values(farmStats).forEach((stats) => {
      summary.totalPhotos += stats.total
      summary.totalPending += stats.pending
      summary.totalApproved += stats.approved
      summary.totalRejected += stats.rejected

      if (stats.approved >= 5) {
        summary.farmsAtQuota++
      }

      if (stats.pending > 0) {
        summary.farmsWithPending++
      }
    })

    summary.averagePhotosPerFarm = summary.totalFarms > 0 ? summary.totalPhotos / summary.totalFarms : 0

    logger.info('All farms photo stats compiled successfully', {
      totalFarms: summary.totalFarms,
      totalPhotos: summary.totalPhotos,
      farmsAtQuota: summary.farmsAtQuota,
      farmsWithPending: summary.farmsWithPending
    })

    // Get top farms by photo count
    const topFarms = Object.entries(farmStats)
      .map(([slug, stats]) => ({
        slug,
        ...stats,
        quota: {
          current: stats.approved,
          max: 5,
          remaining: Math.max(0, 5 - stats.approved)
        }
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return NextResponse.json({
      summary,
      topFarms,
      allFarms: Object.entries(farmStats).map(([slug, stats]) => ({
        slug,
        ...stats,
        quota: {
          current: stats.approved,
          max: 5,
          remaining: Math.max(0, 5 - stats.approved)
        }
      }))
    })
  } catch (error) {
    logger.error('Error getting all farms stats', {}, error as Error)
    throw errors.database('Failed to retrieve farm stats')
  }
}
