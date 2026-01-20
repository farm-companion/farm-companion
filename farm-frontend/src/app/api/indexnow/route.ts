import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Use edge runtime for lightweight IndexNow operations
export const runtime = 'edge'

export async function POST(req: Request) {
  const logger = createRouteLogger('api/indexnow')

  try {
    logger.info('Processing IndexNow submission request')

    const { urls } = await req.json() // string[]
    const key = process.env.INDEXNOW_KEY

    if (!key) {
      logger.error('INDEXNOW_KEY not configured')
      throw errors.configuration('INDEXNOW_KEY not configured')
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      logger.warn('Invalid URLs array in IndexNow request', {
        hasUrls: !!urls,
        isArray: Array.isArray(urls),
        urlsLength: Array.isArray(urls) ? urls.length : 0
      })
      throw errors.validation('URLs array is required')
    }

    logger.info('Submitting URLs to IndexNow API', {
      urlsCount: urls.length
    })
    
    const body = { 
      host: new URL(SITE_URL).host, 
      key, 
      keyLocation: `${SITE_URL}/${key}.txt`, 
      urlList: urls 
    }
    
    const apiResponse = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!apiResponse.ok) {
      logger.error('IndexNow API error', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        urlsCount: urls.length
      })
      throw errors.externalApi('IndexNow', {
        message: 'IndexNow API request failed',
        statusCode: apiResponse.status
      })
    }

    logger.info('IndexNow submission successful', {
      urlsSubmitted: urls.length
    })

    const response = NextResponse.json({ ok: true, urlsSubmitted: urls.length })

    // Add cache control headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')

    return response

  } catch (error) {
    return handleApiError(error, 'api/indexnow')
  }
}
