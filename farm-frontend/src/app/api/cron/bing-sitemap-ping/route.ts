import { NextRequest, NextResponse } from 'next/server'
import { notifyBingOfSitemap } from '@/lib/bing-notifications'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

/**
 * Vercel Cron Job: Nightly Bing Sitemap Ping
 *
 * This endpoint is called by Vercel cron jobs to notify Bing
 * about sitemap changes on a daily basis.
 *
 * Cron schedule: 0 2 * * * (daily at 02:00 UTC, which is 02:00/03:00 London time)
 *
 * Security: This endpoint should only be called by Vercel cron jobs
 * and requires the Vercel-Cron header for authentication.
 */
export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/cron/bing-sitemap-ping', request)

  try {
    logger.info('Starting nightly Bing sitemap ping cron job')

    // Verify this is a legitimate Vercel cron request
    const cronSecret = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret || cronSecret !== `Bearer ${expectedSecret}`) {
      logger.error('Unauthorized cron request - missing or invalid CRON_SECRET')
      throw errors.authorization('Unauthorized cron request')
    }

    logger.info('Cron authentication successful, notifying Bing of sitemap changes')

    // Notify Bing about sitemap changes
    const result = await notifyBingOfSitemap()

    if (result.success) {
      logger.info('Nightly Bing sitemap ping completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Bing sitemap ping completed successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      logger.error('Nightly Bing sitemap ping failed', {
        error: result.error
      })
      throw errors.externalApi('Bing', { error: result.error })
    }

  } catch (error) {
    return handleApiError(error, 'api/cron/bing-sitemap-ping')
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
