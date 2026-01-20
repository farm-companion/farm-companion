import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { getBlobInfo } from '@/lib/blob'
import { sendPhotoSubmissionReceipt } from '@/lib/email'
import { createRecord, ValidationError as DBValidationError, ConstraintViolationError } from '@/lib/database-constraints'
import { validateAndSanitize, ValidationSchemas, ValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Module logger for helper functions
const moduleLogger = createRouteLogger('api/photos/finalize')

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/photos/finalize', req)

  try {
    logger.info('Processing photo finalization request')

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      logger.warn('Invalid JSON in request body')
      throw errors.validation('Invalid JSON in request body')
    }

    // Validate and sanitize input
    const validatedData = await validateAndSanitize(
      ValidationSchemas.photoFinalization,
      body,
      { sanitize: true, strict: true }
    )

    const { leaseId, objectKey, caption, authorName, authorEmail } = validatedData

    const client = await ensureConnection()

    // Get and validate lease
    const leaseData = await client.get(`lease:${leaseId}`)
    if (!leaseData) {
      logger.warn('Upload lease not found or expired', { leaseId })
      throw errors.notFound('Upload lease')
    }

    const lease = JSON.parse(String(leaseData))
    if (lease.objectKey !== objectKey) {
      logger.warn('Lease object key mismatch', { leaseId, objectKey })
      throw errors.validation('Lease object key mismatch')
    }

    // Verify blob exists and get the correct URL
    const blobInfo = await getBlobInfo(objectKey)
    if (!blobInfo) {
      logger.warn('Uploaded file not found', { objectKey })
      throw errors.notFound('Uploaded file')
    }

    logger.info('Photo validated', { photoId: lease.id, farmSlug: lease.farmSlug })

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

    logger.info('Creating photo record', { photoId: photo.id, farmSlug: photo.farmSlug })

    // Use database constraints system for atomic operation
    await createRecord('photos', {
      id: photo.id,
      farmSlug: photo.farmSlug,
      url: photo.url,
      caption: photo.caption,
      authorName: photo.authorName,
      authorEmail: photo.authorEmail,
      createdAt: photo.createdAt.toString(),
      status: photo.status
    }, photo.id)

    // Add to farm's pending photos
    await client.sAdd(`farm:${photo.farmSlug}:photos:pending`, photo.id)

    // Add to moderation queue
    await client.lPush('moderation:queue', photo.id)

    // Remove lease
    await client.del(`lease:${leaseId}`)

    logger.info('Photo finalized successfully', {
      photoId: photo.id,
      farmSlug: photo.farmSlug,
      status: photo.status
    })

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
            moduleLogger.error('Could not fetch farm name for email', {
              farmSlug: photo.farmSlug
            }, err as Error)
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
          moduleLogger.info('Photo submission receipt sent', {
            photoId: photo.id,
            authorEmail: photo.authorEmail
          })
        }
      } catch (err) {
        moduleLogger.error('Email send failed (non-fatal)', {
          photoId: photo.id,
          farmSlug: photo.farmSlug,
          authorEmail: photo.authorEmail
        }, err as Error)
      }
    })()

    return NextResponse.json({
      ok: true,
      status: photo.status,
      photoId: photo.id,
      previewUrl: photo.url
    })

  } catch (error) {
    // Handle input validation errors
    if (error instanceof ValidationError) {
      logger.warn('Input validation error', {
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    // Handle database validation errors
    if (error instanceof DBValidationError) {
      logger.warn('Database validation error', {
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    if (error instanceof ConstraintViolationError) {
      logger.warn('Constraint violation error', {
        constraint: error.constraint,
        message: error.message
      })
      throw errors.conflict(error.message)
    }

    return handleApiError(error, 'api/photos/finalize')
  }
}
