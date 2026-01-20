import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { buildObjectKey } from '@/lib/blob'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/debug/test-new-upload', req)

  try {
    logger.info('Processing test new upload request')

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      logger.warn('No file provided in test new upload request')
      throw errors.validation('No file provided')
    }

    // Test the new buildObjectKey function
    const testFarmSlug = 'test-farm'
    const testPhotoId = 'test-photo-123'
    const objectKey = buildObjectKey(testFarmSlug, testPhotoId, file.type)

    logger.info('Starting test new upload with buildObjectKey', {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      objectKey
    })

    // Upload to Vercel Blob
    const blob = await put(objectKey, file, {
      access: 'public',
      addRandomSuffix: false
    })

    logger.info('Test new upload successful', {
      url: blob.url,
      objectKey,
      contentType: file.type
    })

    return NextResponse.json({
      ok: true,
      url: blob.url,
      objectKey,
      contentType: file.type
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/test-new-upload')
  }
}
