import { NextRequest, NextResponse } from 'next/server'
import { notifyBingOfSitemap } from '@/lib/bing-notifications'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

// Bing notification response type
interface BingNotificationResult {
  success: boolean
  error?: string
}

// Extended fetch options (Node.js supports timeout but TypeScript doesn't know)
interface FetchOptionsWithTimeout extends RequestInit {
  timeout?: number
}

/**
 * Health Check Endpoint for Bing IndexNow System
 * 
 * This endpoint performs comprehensive health checks on the Bing IndexNow system:
 * 1. Verifies environment variables are configured
 * 2. Tests IndexNow API connectivity
 * 3. Validates sitemap accessibility
 * 4. Checks internal API endpoints
 * 
 * Used by monitoring systems to ensure the Bing indexing system is working properly.
 */
export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/health/bing-indexnow', request)
  const startTime = Date.now()
  const healthChecks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {} as Record<string, any>,
    duration: 0,
  }

  try {
    logger.info('Starting Bing IndexNow health check')

    // Check 1: Environment Variables
    const envCheck = {
      status: 'pass',
      details: {
        INDEXNOW_INTERNAL_TOKEN: !!process.env.INDEXNOW_INTERNAL_TOKEN,
        BING_INDEXNOW_KEY: !!process.env.BING_INDEXNOW_KEY,
        SITE_URL: !!process.env.SITE_URL || !!process.env.VERCEL_URL,
      }
    }
    
    if (!envCheck.details.INDEXNOW_INTERNAL_TOKEN || !envCheck.details.BING_INDEXNOW_KEY) {
      envCheck.status = 'fail'
      healthChecks.status = 'unhealthy'
    }
    
    healthChecks.checks.environment = envCheck

    // Check 2: Sitemap Accessibility
    const sitemapCheck = {
      status: 'pass',
      details: {
        sitemapUrl: 'https://www.farmcompanion.co.uk/sitemap.xml',
        accessible: false,
        statusCode: 0,
        size: 0,
        error: null as string | null,
      }
    }

    try {
      const fetchOptions: FetchOptionsWithTimeout = {
        method: 'HEAD',
        timeout: 10000,
      }
      const sitemapResponse = await fetch('https://www.farmcompanion.co.uk/sitemap.xml', fetchOptions as RequestInit)
      
      sitemapCheck.details.statusCode = sitemapResponse.status
      sitemapCheck.details.accessible = sitemapResponse.ok
      
      if (!sitemapResponse.ok) {
        sitemapCheck.status = 'fail'
        healthChecks.status = 'unhealthy'
      }
    } catch (error) {
      sitemapCheck.status = 'fail'
      sitemapCheck.details.error = error instanceof Error ? error.message : 'Unknown error'
      healthChecks.status = 'unhealthy'
    }

    healthChecks.checks.sitemap = sitemapCheck

    // Check 3: IndexNow API Connectivity
    const indexNowCheck = {
      status: 'pass',
      details: {
        testUrl: 'https://www.farmcompanion.co.uk/',
        response: null as BingNotificationResult | null,
        error: null as string | null,
      }
    }

    try {
      const result = await notifyBingOfSitemap()
      indexNowCheck.details.response = result
      
      if (!result.success) {
        indexNowCheck.status = 'fail'
        indexNowCheck.details.error = result.error || 'Unknown error'
        healthChecks.status = 'unhealthy'
      }
    } catch (error) {
      indexNowCheck.status = 'fail'
      indexNowCheck.details.error = error instanceof Error ? error.message : 'Unknown error'
      healthChecks.status = 'unhealthy'
    }

    healthChecks.checks.indexnow = indexNowCheck

    // Check 4: Internal API Endpoints
    const apiCheck = {
      status: 'pass',
      details: {
        submitEndpoint: false,
        pingEndpoint: false,
        error: null as string | null,
      }
    }

    try {
      // Test submit endpoint (should return 401 without token)
      const submitResponse = await fetch('https://www.farmcompanion.co.uk/api/bing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.farmcompanion.co.uk/' }),
      })
      
      apiCheck.details.submitEndpoint = submitResponse.status === 401 // Expected without token
      
      // Test ping endpoint (should return 401 without token)
      const pingResponse = await fetch('https://www.farmcompanion.co.uk/api/bing/ping', {
        method: 'POST',
      })
      
      apiCheck.details.pingEndpoint = pingResponse.status === 401 // Expected without token
      
      if (!apiCheck.details.submitEndpoint || !apiCheck.details.pingEndpoint) {
        apiCheck.status = 'fail'
        healthChecks.status = 'unhealthy'
      }
    } catch (error) {
      apiCheck.status = 'fail'
      apiCheck.details.error = error instanceof Error ? error.message : 'Unknown error'
      healthChecks.status = 'unhealthy'
    }

    healthChecks.checks.apiEndpoints = apiCheck

    // Check 5: Sitemap Chunks Accessibility
    const chunksCheck = {
      status: 'pass',
      details: {
        corePages: false,
        farmsChunk: false,
        producePages: false,
        error: null as string | null,
      }
    }

    try {
      const chunkUrls = [
        'https://www.farmcompanion.co.uk/sitemaps/core-pages.xml',
        'https://www.farmcompanion.co.uk/sitemaps/farms-1.xml',
        'https://www.farmcompanion.co.uk/sitemaps/produce-pages.xml',
      ]

      for (const url of chunkUrls) {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          if (url.includes('core-pages')) chunksCheck.details.corePages = response.ok
          if (url.includes('farms-1')) chunksCheck.details.farmsChunk = response.ok
          if (url.includes('produce-pages')) chunksCheck.details.producePages = response.ok
        } catch {
          // Individual chunk failures are not critical
        }
      }

      // Only fail if all chunks are inaccessible
      if (!chunksCheck.details.corePages && !chunksCheck.details.farmsChunk && !chunksCheck.details.producePages) {
        chunksCheck.status = 'fail'
        healthChecks.status = 'unhealthy'
      }
    } catch (error) {
      chunksCheck.status = 'fail'
      chunksCheck.details.error = error instanceof Error ? error.message : 'Unknown error'
      healthChecks.status = 'unhealthy'
    }

    healthChecks.checks.sitemapChunks = chunksCheck

    healthChecks.duration = Date.now() - startTime

    logger.info('Bing IndexNow health check completed', { status: healthChecks.status, duration: healthChecks.duration })

    const statusCode = healthChecks.status === 'healthy' ? 200 : 503
    return NextResponse.json(healthChecks, { status: statusCode })

  } catch (error) {
    healthChecks.status = 'unhealthy'
    healthChecks.duration = Date.now() - startTime
    healthChecks.checks.error = {
      status: 'fail',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    return NextResponse.json(healthChecks, { status: 503 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
