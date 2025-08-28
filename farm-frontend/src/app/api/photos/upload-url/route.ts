// app/api/photos/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import redis from '../../../../lib/redis'
import { randomUUID } from 'crypto'
import { buildObjectKey, createUploadUrl } from '../../../../lib/blob'

export async function POST(req: NextRequest) {
  try {
    console.log('upload-url route called')
    const body = await req.json().catch(() => ({}))
    const { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId } = body

    console.log('Request body:', { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId })

    const MAX = Number(process.env.PHOTO_MAX_MB ?? 5) * 1024 * 1024
    const ALLOWED = (process.env.PHOTO_ALLOWED_TYPES ?? '').split(',').map(s => s.trim())
    
    console.log('Environment variables:', { MAX, ALLOWED, REDIS_URL: process.env.REDIS_URL ? 'set' : 'not set' })

  if (!farmSlug || !fileName || !contentType || typeof fileSize !== 'number') {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 })
  }
  if (!ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: 'unsupported-type' }, { status: 400 })
  }
  if (fileSize > MAX) {
    return NextResponse.json({ error: 'too-large', max: MAX }, { status: 400 })
  }

  // rate limit: 5 / minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rlKey = `ratelimit:photos:reserve:${ip}`
  const hits = await redis.incr(rlKey); if (hits === 1) await redis.expire(rlKey, 60)
  if (Number(hits) > 5) return NextResponse.json({ error: 'rate-limited' }, { status: 429 })

  // simple quota: 5 approved photos per farm unless replacing
  const approvedCount = Number(await redis.sCard(`farm:${farmSlug}:photos:approved`))
  if (approvedCount >= 5 && mode !== 'replace') {
    const ids = await redis.lRange(`farm:${farmSlug}:photos`, 0, -1)
    const metas = await Promise.all(ids.map(id => redis.hGetAll(`photo:${id}`)))
    const existingPhotos = metas.filter(Boolean).map(m => {
      if (m instanceof Map) {
        return { 
          id: String(m.get('id') || ''), 
          url: String(m.get('url') || ''), 
          caption: String(m.get('caption') || '') 
        }
      }
      return { id: '', url: '', caption: '' }
    })
    return NextResponse.json({ quotaFull: true, existingPhotos })
  }

  const leaseId = randomUUID()
  const photoId = randomUUID()
  const objectKey = buildObjectKey(farmSlug, photoId)

  const lease = {
    leaseId, farmSlug, photoId, objectKey,
    replacePhotoId: mode === 'replace' ? replacePhotoId : '',
    fileName, contentType, size: fileSize, status: 'reserved', createdAt: Date.now()
  }
  await redis.setEx(`lease:${leaseId}`, 60 * 15, JSON.stringify(lease)) // 15 minutes

  const { uploadUrl } = await createUploadUrl({
    pathname: objectKey,
    contentType,
    contentLength: fileSize
  })

  return NextResponse.json({
    leaseId,
    uploadUrl,
    objectKey,
    expiresAt: Date.now() + 15 * 60 * 1000,
    quotaFull: false
  })
  } catch (error) {
    console.error('Error in upload-url route:', error)
    return NextResponse.json({ 
      error: 'internal-server-error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
