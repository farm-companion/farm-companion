import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import redis, { ensureConnection } from '@/lib/redis'
import { buildObjectKey, createUploadUrl } from '@/lib/blob'

export async function POST(req: NextRequest) {
  try {
    console.log('upload-url route called')
    
    const body = await req.json().catch(() => ({}))
    const { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId } = body

    console.log('Request body:', { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId })

    // Validate required fields
    if (!farmSlug || !fileName || !contentType || !fileSize) {
      return NextResponse.json({
        error: 'missing-required-fields',
        message: 'Missing required fields: farmSlug, fileName, contentType, fileSize'
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (fileSize > MAX_SIZE) {
      return NextResponse.json({
        error: 'file-too-large',
        message: 'File size exceeds 5MB limit'
      }, { status: 400 })
    }

    // Validate content type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({
        error: 'invalid-content-type',
        message: 'Invalid content type. Allowed: JPEG, PNG, WebP, HEIC'
      }, { status: 400 })
    }

    console.log('Starting Redis operations...')
    
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rlKey = `ratelimit:photos:reserve:${ip}`
    
    try {
      const client = await ensureConnection()
      console.log('Redis connected, checking rate limit...')
      
      const hits = await client.incr(rlKey)
      if (hits === 1) await client.expire(rlKey, 60)
      if (Number(hits) > 5) return NextResponse.json({ error: 'rate-limited' }, { status: 429 })

      console.log('Rate limit check passed, checking quota...')

      // simple quota: 5 approved photos per farm unless replacing
      const quotaKey = `quota:farm:${farmSlug}:photos`
      const currentCount = await client.get(quotaKey) || '0'
      const quota = mode === 'replace' ? 5 : 5 // same quota for now

      if (Number(currentCount) >= quota && mode !== 'replace') {
        return NextResponse.json({
          error: 'quota-exceeded',
          message: 'Photo quota exceeded for this farm'
        }, { status: 429 })
      }

      console.log('Quota check passed, generating photo ID...')

      // Generate photo ID
      const photoId = replacePhotoId || uuidv4()
      const objectKey = buildObjectKey(farmSlug, photoId, contentType)

      console.log('Creating upload URL...')

      // Create upload URL
      const { uploadUrl } = await createUploadUrl({
        pathname: objectKey,
        contentType,
        contentLength: fileSize
      })

      console.log('Upload URL created, creating lease...')

      // Create lease record
      const lease = {
        id: photoId,
        farmSlug,
        objectKey,
        fileName,
        contentType,
        fileSize,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        mode
      }

      // Store lease in Redis
      await client.setEx(`lease:${photoId}`, 600, JSON.stringify(lease)) // 10 minutes TTL

      console.log('Lease stored, returning response...')

      return NextResponse.json({
        ok: true,
        leaseId: photoId,
        uploadUrl,
        objectKey
      })
    } catch (redisError) {
      console.error('Redis error:', redisError)
      throw new Error(`Redis operation failed: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`)
    }

  } catch (error) {
    console.error('Error in upload-url route:', error)
    return NextResponse.json({
      error: 'internal-server-error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}
