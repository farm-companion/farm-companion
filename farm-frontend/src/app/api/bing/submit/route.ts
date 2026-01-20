import { NextRequest, NextResponse } from 'next/server'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

const HOST = 'www.farmcompanion.co.uk'

function isAllowedUrl(url: string) {
  try {
    const u = new URL(url)
    return u.host === HOST && (u.protocol === 'https:' || u.protocol === 'http:')
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/bing/submit', request)

  try {
    logger.info('Processing Bing URL submission request')

    const token = request.headers.get('x-internal-token')
    if (token !== process.env.INDEXNOW_INTERNAL_TOKEN) {
      logger.warn('Unauthorized Bing submit attempt - invalid internal token')
      throw errors.authorization('Unauthorized')
    }

    const { url, urls } = await request.json().catch(() => ({ url: undefined, urls: undefined }))
    const urlList: string[] =
      Array.isArray(urls) ? urls.filter(isAllowedUrl) :
      typeof url === 'string' && isAllowedUrl(url) ? [url] : []

    if (urlList.length === 0) {
      logger.warn('No valid URLs provided for Bing submission', {
        providedUrl: url,
        providedUrls: urls
      })
      throw errors.validation('No valid URLs provided for host')
    }

    const key = process.env.BING_INDEXNOW_KEY!
    const keyLocation = `https://${HOST}/${key}.txt`

    const payload = {
      host: HOST,
      key,
      keyLocation,
      urlList
    }

    logger.info('Submitting URLs to Bing IndexNow', {
      host: HOST,
      urlCount: urlList.length,
      urls: urlList
    })

    const r = await fetch('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const text = await r.text()
    const ok = r.ok

    logger.info('Bing IndexNow submission completed', {
      success: ok,
      status: r.status,
      urlCount: urlList.length,
      response: text
    })

    return NextResponse.json({ ok, status: r.status, body: text, submitted: urlList })

  } catch (error) {
    return handleApiError(error, 'api/bing/submit')
  }
}
