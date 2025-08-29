import { NextRequest, NextResponse } from 'next/server'
import redis, { ensureConnection } from '@/lib/redis'
import { headBlob, getBlobInfo } from '@/lib/blob'
import { sendPhotoSubmissionReceipt } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { leaseId, objectKey, caption, authorName, authorEmail } = body

    if (!leaseId || !objectKey) {
      return NextResponse.json({
        error: 'missing-required-fields',
        message: 'Missing required fields: leaseId, objectKey'
      }, { status: 400 })
    }

    const client = await ensureConnection()

    // Get and validate lease
    const leaseData = await client.get(`lease:${leaseId}`)
    if (!leaseData) {
      return NextResponse.json({
        error: 'lease-not-found',
        message: 'Upload lease not found or expired'
      }, { status: 404 })
    }

    const lease = JSON.parse(String(leaseData))
    if (lease.objectKey !== objectKey) {
      return NextResponse.json({
        error: 'lease-mismatch',
        message: 'Lease object key mismatch'
      }, { status: 400 })
    }

    // Verify blob exists and get the correct URL
    const blobInfo = await getBlobInfo(objectKey)
    if (!blobInfo) {
      return NextResponse.json({
        error: 'blob-not-found',
        message: 'Uploaded file not found'
      }, { status: 404 })
    }

    // Create photo object with the correct blob URL
    const photo = {
      id: lease.id,
      farmSlug: lease.farmSlug,
      url: blobInfo.url, // Use the actual blob URL instead of hardcoded domain
      caption: caption || '',
      authorName: authorName || '',
      authorEmail: authorEmail || '',
      createdAt: Date.now(),
      status: 'pending'
    }

    // Store photo and update indexes in a transaction
    const pipeline = client.multi()
    
    // Store photo metadata as individual hash fields
    pipeline.hSet(`photo:${photo.id}`, {
      id: photo.id,
      farmSlug: photo.farmSlug,
      url: photo.url,
      caption: photo.caption,
      authorName: photo.authorName,
      authorEmail: photo.authorEmail,
      createdAt: photo.createdAt.toString(),
      status: photo.status
    })
    
    // Add to farm's pending photos
    pipeline.sAdd(`farm:${photo.farmSlug}:photos:pending`, photo.id)
    
    // Add to moderation queue
    pipeline.lPush('moderation:queue', photo.id)
    
    // Remove lease
    pipeline.del(`lease:${leaseId}`)

    await pipeline.exec()

    // 🔔 Fire-and-forget email (don't fail the API if email fails)
    ;(async () => {
      try {
        if (photo.authorEmail) {
          let farmName = photo.farmSlug
          try {
            const farmData = await client.get(`farm:${photo.farmSlug}`)
            if (farmData) {
              const farm = JSON.parse(String(farmData))
              farmName = farm.name || farm.title || photo.farmSlug
            }
          } catch (err) {
            console.warn('Could not fetch farm name for email', { farmSlug: photo.farmSlug, error: err })
          }

          await sendPhotoSubmissionReceipt({
            to: photo.authorEmail,
            farmName: farmName,
            farmSlug: photo.farmSlug,
            caption: photo.caption,
            authorName: photo.authorName,
            authorEmail: photo.authorEmail,
            photoUrl: photo.url,
          })
        }
      } catch (err) {
        console.error('Email send failed (non-fatal):', {
          error: err instanceof Error ? err.message : 'Unknown error',
          photoId: photo.id,
          farmSlug: photo.farmSlug,
          authorEmail: photo.authorEmail
        })
      }
    })()

    return NextResponse.json({ 
      ok: true, 
      status: photo.status, 
      photoId: photo.id, 
      previewUrl: photo.url 
    })

  } catch (error) {
    console.error('Error in finalize route:', error)
    return NextResponse.json({
      error: 'internal-server-error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
