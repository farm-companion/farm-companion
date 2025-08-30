import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import redis, { ensureConnection } from '@/lib/redis'
import { buildObjectKey, createUploadUrl } from '@/lib/blob'
import { validateAndSanitize, ValidationSchemas, ValidationError } from '@/lib/input-validation'

export async function POST(req: NextRequest) {
  try {
    console.log('upload-url route called')
    
    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({
        error: 'invalid-json',
        message: 'Invalid JSON in request body'
      }, { status: 400 })
    }

    // Validate and sanitize input
    const validatedData = await validateAndSanitize(
      ValidationSchemas.photoUpload,
      body,
      { sanitize: true, strict: true }
    )

    const { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId } = validatedData

    console.log('Request body:', { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId })

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
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json({
        error: 'validation-error',
        message: error.message,
        field: error.field
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'internal-server-error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 })
  }
}
