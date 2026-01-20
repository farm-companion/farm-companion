import { NextRequest, NextResponse } from 'next/server'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

const HOST = 'www.farmcompanion.co.uk'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/bing/ping', request)

  try {
    logger.info('Processing Bing sitemap ping request')

    const token = request.headers.get('x-internal-token')
    if (token !== process.env.INDEXNOW_INTERNAL_TOKEN) {
      logger.warn('Unauthorized Bing ping attempt - invalid internal token')
      throw errors.authorization('Unauthorized')
    }

    const key = process.env.BING_INDEXNOW_KEY!
    const keyLocation = `https://${HOST}/${key}.txt`
    const sitemapUrl = `https://${HOST}/sitemap.xml`

    const payload = {
      host: HOST,
      key,
      keyLocation,
      urlList: [sitemapUrl]
    }

    logger.info('Submitting sitemap ping to Bing IndexNow', {
      host: HOST,
      sitemapUrl
    })

    const r = await fetch('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const text = await r.text()

    logger.info('Bing IndexNow ping completed', {
      success: r.ok,
      status: r.status,
      response: text
    })

    return NextResponse.json({ ok: r.ok, status: r.status, body: text, submitted: [sitemapUrl] })

  } catch (error) {
    return handleApiError(error, 'api/bing/ping')
  }
}
