import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const farmSlug = searchParams.get('farmSlug')

    const client = await ensureConnection()

    if (farmSlug) {
      // Get stats for specific farm
      return await getFarmPhotoStats(client, farmSlug)
    } else {
      // Get stats for all farms
      return await getAllFarmsPhotoStats(client)
    }
  } catch (error) {
    console.error('Error getting farm photo stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getFarmPhotoStats(client: any, farmSlug: string) {
  try {
    // Get photo counts for different statuses
    const pendingCount = await client.sCard(`farm:${farmSlug}:photos:pending`)
    const approvedCount = await client.sCard(`farm:${farmSlug}:photos:approved`)
    const rejectedCount = await client.sCard(`farm:${farmSlug}:photos:rejected`)
    
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
          console.error(`Error fetching photo ${id} data:`, error)
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
    console.error(`Error getting stats for farm ${farmSlug}:`, error)
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
  }
}

async function getAllFarmsPhotoStats(client: any) {
  try {
    // Get all farm keys
    const farmKeys = await client.keys('farm:*:photos:*')
    
    const farmStats: Record<string, any> = {}
    const farmSlugs = new Set()
    
    // Process each farm
    for (const key of farmKeys) {
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
    
    summary.averagePhotosPerFarm = summary.totalFarms > 0 ? summary.totalPhotos / summary.totalFarms : 0
    
    // Get top farms by photo count
    const topFarms = Object.entries(farmStats)
      .map(([slug, stats]: [string, any]) => ({
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
      allFarms: Object.entries(farmStats).map(([slug, stats]: [string, any]) => ({
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
    console.error('Error getting all farms stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
