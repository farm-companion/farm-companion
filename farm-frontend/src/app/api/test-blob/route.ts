import { NextRequest, NextResponse } from 'next/server'
import { createUploadUrl } from '@/lib/blob'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/test-blob', request)

  try {
    logger.info('Processing Vercel Blob connection test')

    const { uploadUrl } = await createUploadUrl({
      pathname: 'test/test-image.jpg',
      contentType: 'image/jpeg',
      contentLength: 1000
    })

    logger.info('Vercel Blob connection test successful')

    return NextResponse.json({
      success: true,
      message: 'Vercel Blob is working',
      uploadUrl: uploadUrl ? 'URL generated' : 'No URL',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error, 'api/test-blob')
  }
}
