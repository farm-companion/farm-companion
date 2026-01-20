import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const logger = createRouteLogger('admin/farms/photo-stats', req)

  try {
    const { searchParams } = new URL(req.url)
    const farmSlug = searchParams.get('farmSlug')

    const client = await ensureConnection()

    if (farmSlug) {
      // Get stats for specific farm
      return await getFarmPhotoStats(client, farmSlug, logger)
    } else {
      // Get stats for all farms
      return await getAllFarmsPhotoStats(client, logger)
    }
  } catch (error) {
    logger.error('Error getting farm photo stats', {}, error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getFarmPhotoStats(client: any, farmSlug: string, logger: any) {
  try {
    // Batch fetch photo counts using pipeline
    const statsPipeline = client.pipeline()
    statsPipeline.sCard(`farm:${farmSlug}:photos:pending`)
    statsPipeline.sCard(`farm:${farmSlug}:photos:approved`)
    statsPipeline.sCard(`farm:${farmSlug}:photos:rejected`)
    statsPipeline.sMembers(`farm:${farmSlug}:photos:approved`)

    const [pendingResult, approvedResult, rejectedResult, approvedIdsResult] = await statsPipeline.exec()

    const pendingCount = pendingResult?.[1] || 0
    const approvedCount = approvedResult?.[1] || 0
    const rejectedCount = rejectedResult?.[1] || 0
    const approvedPhotoIds = (approvedIdsResult?.[1] as string[]) || []

    // Batch fetch photo metadata using pipeline
    const photoPipeline = client.pipeline()
    for (const id of approvedPhotoIds) {
      photoPipeline.hGetAll(`photo:${id}`)
    }
    const photoResults = await photoPipeline.exec()

    // Process photo data
    const approvedPhotos = photoResults
      .map((result, index) => {
        const [err, photoData] = result
        if (err || !photoData || typeof photoData !== 'object' || Object.keys(photoData).length === 0) {
          return null
        }

        return {
          id: approvedPhotoIds[index],
          caption: photoData.caption,
          authorName: photoData.authorName,
          authorEmail: photoData.authorEmail,
          createdAt: parseInt(photoData.createdAt || '0'),
          approvedAt: parseInt(photoData.approvedAt || '0'),
          url: photoData.url,
        }
      })
      .filter(Boolean)

    const validPhotos = approvedPhotos.sort((a, b) => b!.approvedAt - a!.approvedAt)

    // Calculate upload frequency
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const recentUploads = validPhotos.filter((photo) => photo!.approvedAt > thirtyDaysAgo).length

    // Get upload history (last 10 uploads)
    const uploadHistory = validPhotos.slice(0, 10).map((photo) => ({
      id: photo!.id,
      caption: photo!.caption,
      authorName: photo!.authorName,
      approvedAt: photo!.approvedAt,
      date: new Date(photo!.approvedAt).toISOString(),
    }))

    logger.info('Farm photo stats retrieved', { farmSlug, photoCount: validPhotos.length })

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
          remaining: Math.max(0, 5 - (approvedCount || 0)),
        },
        recentUploads,
        uploadHistory,
      },
      photos: validPhotos,
    })
  } catch (error) {
    logger.error('Error getting farm stats', { farmSlug }, error as Error)
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
  }
}

async function getAllFarmsPhotoStats(client: any, logger: any) {
  try {
    // Get all farm keys
    const farmKeys = await client.keys('farm:*:photos:*')

    logger.info('Fetching stats for all farms', { keyCount: farmKeys.length })

    // Batch fetch all counts using pipeline
    const pipeline = client.pipeline()
    for (const key of farmKeys) {
      pipeline.sCard(key)
    }
    const results = await pipeline.exec()

    // Process results and build farm stats
    const farmStats: Record<string, any> = {}
    const farmSlugs = new Set()

    for (let i = 0; i < farmKeys.length; i++) {
      const key = farmKeys[i]
      const [err, count] = results[i]

      if (err) continue

      const parts = key.split(':')
      if (parts.length >= 3) {
        const farmSlug = parts[1]
        const photoType = parts[3] // approved, pending, rejected

        farmSlugs.add(farmSlug)

        if (!farmStats[farmSlug]) {
          farmStats[farmSlug] = {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
          }
        }

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
      averagePhotosPerFarm: 0,
    }

    Object.values(farmStats).forEach((stats: any) => {
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

    if (farmSlugs.size > 0) {
      summary.averagePhotosPerFarm = Math.round((summary.totalPhotos / farmSlugs.size) * 10) / 10
    }

    logger.info('All farms stats retrieved', {
      farmCount: farmSlugs.size,
      totalPhotos: summary.totalPhotos,
    })

    return NextResponse.json({
      summary,
      farms: Object.entries(farmStats).map(([slug, stats]) => ({
        farmSlug: slug,
        ...stats,
        quota: {
          current: stats.approved,
          max: 5,
          remaining: Math.max(0, 5 - stats.approved),
        },
      })),
    })
  } catch (error) {
    logger.error('Error getting all farms stats', {}, error as Error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
