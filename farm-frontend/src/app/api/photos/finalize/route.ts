// app/api/photos/finalize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import redis from '../../../../lib/redis'
import { headBlob } from '../../../../lib/blob'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { leaseId, objectKey, caption, authorName, authorEmail } = body

  const leaseData = await redis.get(`lease:${leaseId}`)
  if (!leaseData) {
    return NextResponse.json({ error: 'invalid-lease' }, { status: 400 })
  }
  
  const lease = JSON.parse(String(leaseData))
  if (lease.status !== 'reserved' || lease.objectKey !== objectKey) {
    return NextResponse.json({ error: 'invalid-lease' }, { status: 400 })
  }

  const exists = await headBlob(objectKey)
  if (!exists) return NextResponse.json({ error: 'missing-blob' }, { status: 400 })

  const photo = {
    id: lease.photoId,
    farmSlug: lease.farmSlug,
    objectKey: lease.objectKey,
    url: `https://blob.vercel-storage.com/${lease.objectKey}`, // Blob public path
    caption: (caption || '').slice(0, 500),
    authorName: (authorName || '').slice(0, 120),
    authorEmail: (authorEmail || '').slice(0, 200),
    status: 'pending', // change to 'approved' if you want instant publish
    createdAt: Date.now(),
    replaceOf: lease.replacePhotoId || ''
  }

  // Use Redis pipeline for atomic operations
  const pipeline = redis.multi()
  
  // Store photo metadata
  pipeline.hSet(`photo:${photo.id}`, photo as any)
  
  // Add to farm's photo list
  pipeline.lPush(`farm:${photo.farmSlug}:photos`, photo.id)
  
  // Handle approval status
  if (photo.status === 'approved') {
    pipeline.sAdd(`farm:${photo.farmSlug}:photos:approved`, photo.id)
  } else {
    pipeline.lPush('moderation:queue', photo.id)
  }
  
  // Handle photo replacement
  if (lease.replacePhotoId) {
    pipeline.hSet(`photo:${lease.replacePhotoId}`, { status: 'archived', archivedAt: Date.now() } as any)
    pipeline.sRem(`farm:${photo.farmSlug}:photos:approved`, lease.replacePhotoId)
  }
  
  // Update lease status
  pipeline.setEx(`lease:${leaseId}`, 60 * 60, JSON.stringify({ ...lease, status: 'finalized' }))
  
  await pipeline.exec()

  return NextResponse.json({ ok: true, status: photo.status, photoId: photo.id, previewUrl: photo.url })
  } catch (error) {
    console.error('Error in finalize route:', error)
    return NextResponse.json({ 
      error: 'internal-server-error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
