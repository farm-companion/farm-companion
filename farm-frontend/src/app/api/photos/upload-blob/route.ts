import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/photos/upload-blob', req)

  try {
    logger.info('Processing blob upload request')

    const formData = await req.formData()
    const file = formData.get('file') as File
    const pathname = formData.get('pathname') as string
    const contentType = formData.get('contentType') as string

    if (!file || !pathname || !contentType) {
      logger.warn('Missing required fields in blob upload', {
        hasFile: !!file,
        hasPathname: !!pathname,
        hasContentType: !!contentType
      })
      throw errors.validation('Missing required fields: file, pathname, contentType')
    }

    logger.info('Uploading blob to Vercel', {
      pathname,
      contentType,
      fileSize: file.size
    })

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false
    })

    logger.info('Blob uploaded successfully', {
      url: blob.url,
      pathname
    })

    return NextResponse.json({
      ok: true,
      url: blob.url
    })

  } catch (error) {
    return handleApiError(error, 'api/photos/upload-blob')
  }
}
