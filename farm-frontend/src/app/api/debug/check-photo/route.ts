import { NextRequest, NextResponse } from 'next/server'
import { headBlob } from '@/lib/blob'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/debug/check-photo', request)

  try {
    logger.info('Processing photo URL check request')

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      logger.warn('Missing URL parameter in photo check request')
      throw errors.validation('URL parameter is required')
    }

    // Extract the object key from the URL
    const blobUrl = 'https://blob.vercel-storage.com/'
    if (!url.startsWith(blobUrl)) {
      logger.warn('Invalid URL format in photo check request', { url })
      throw errors.validation('URL must be a Vercel Blob URL')
    }

    const objectKey = url.replace(blobUrl, '')

    logger.info('Checking photo URL existence', { url, objectKey })

    // Check if the blob exists
    const exists = await headBlob(objectKey)

    // Try different extensions if the original doesn't exist
    const extensions = ['webp', 'jpg', 'png', 'jpeg']
    const results: Record<string, boolean> = {}

    if (!exists && objectKey.includes('/main') && !objectKey.includes('.')) {
      logger.info('Testing alternative extensions for photo', { objectKey })
      for (const ext of extensions) {
        const testKey = objectKey.replace('/main', `/main.${ext}`)
        results[ext] = await headBlob(testKey)
      }
    }

    const suggestions = exists ? [] : Object.entries(results)
      .filter(([, exists]) => exists)
      .map(([ext]) => `${blobUrl}${objectKey.replace('/main', `/main.${ext}`)}`)

    logger.info('Photo URL check completed', {
      url,
      exists,
      suggestionsCount: suggestions.length
    })

    return NextResponse.json({
      url,
      objectKey,
      exists,
      extensionTests: results,
      suggestions
    })

  } catch (error) {
    return handleApiError(error, 'api/debug/check-photo')
  }
}
