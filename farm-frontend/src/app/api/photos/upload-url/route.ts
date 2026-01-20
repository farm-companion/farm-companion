import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { ensureConnection } from '@/lib/redis'
import { buildObjectKey, createUploadUrl } from '@/lib/blob'
import { validateAndSanitize, ValidationSchemas, ValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/photos/upload-url', req)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  try {
    logger.info('Processing photo upload URL request', { ip })

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw errors.validation('Invalid JSON in request body')
    }

    // Validate and sanitize input
    const validatedData = await validateAndSanitize(
      ValidationSchemas.photoUpload,
      body,
      { sanitize: true, strict: true }
    )

    const { farmSlug, fileName, contentType, fileSize, mode, replacePhotoId } = validatedData

    logger.info('Request validated', {
      ip,
      farmSlug,
      fileName,
      contentType,
      fileSize,
      mode,
      replacePhotoId
    })

    // Rate limiting
    const rlKey = `ratelimit:photos:reserve:${ip}`

    try {
      const client = await ensureConnection()
      logger.info('Redis connected, checking rate limit', { ip })

      const hits = await client.incr(rlKey)
      if (hits === 1) await client.expire(rlKey, 60)
      if (Number(hits) > 5) {
        throw errors.rateLimit('Too many photo upload requests')
      }

      logger.info('Rate limit check passed, checking quota', { ip, farmSlug })

      // Simple quota: 5 approved photos per farm unless replacing
      const quotaKey = `quota:farm:${farmSlug}:photos`
      const currentCount = await client.get(quotaKey) || '0'
      const quota = mode === 'replace' ? 5 : 5 // same quota for now

      if (Number(currentCount) >= quota && mode !== 'replace') {
        throw errors.validation('Photo quota exceeded for this farm', {
          currentCount: Number(currentCount),
          quota,
          farmSlug
        })
      }

      logger.info('Quota check passed, generating photo ID', {
        ip,
        farmSlug,
        currentCount: Number(currentCount),
        quota
      })

      // Generate photo ID
      const photoId = replacePhotoId || uuidv4()
      const objectKey = buildObjectKey(farmSlug, photoId, contentType)

      logger.info('Creating upload URL', { ip, photoId, objectKey })

      // Create upload URL
      const { uploadUrl } = await createUploadUrl({
        pathname: objectKey,
        contentType,
        contentLength: fileSize
      })

      logger.info('Upload URL created, creating lease', { ip, photoId })

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

      logger.info('Lease stored successfully', {
        ip,
        photoId,
        farmSlug,
        expiresIn: '10 minutes'
      })

      return NextResponse.json({
        ok: true,
        leaseId: photoId,
        uploadUrl,
        objectKey
      })
    } catch (redisError) {
      logger.error('Redis operation failed', { ip, farmSlug }, redisError as Error)
      throw errors.database('Redis operation failed', {
        operation: 'photo upload URL generation'
      })
    }

  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      logger.warn('Validation error', {
        ip,
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    return handleApiError(error, 'api/photos/upload-url', { ip })
  }
}
