import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/debug/test-upload', req)

  try {
    logger.info('Processing test upload request')

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      logger.warn('No file provided in test upload request')
      throw errors.validation('No file provided')
    }

    // Create a test pathname
    const pathname = `test-upload/${Date.now()}-${file.name}`

    logger.info('Starting test upload', {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      pathname
    })

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false
    })

    logger.info('Test upload successful', {
      url: blob.url,
      pathname,
      fileName: file.name
    })

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/test-upload')
  }
}
