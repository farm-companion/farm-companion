import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Bing Indexing Status Dashboard
 * 
 * Provides comprehensive status information about the Bing indexing system:
 * - Recent indexing activity
 * - Sitemap statistics
 * - System health metrics
 * - Configuration status
 */
export async function GET() {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      system: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        region: process.env.VERCEL_REGION || 'local',
      },
      configuration: {
        indexNowToken: !!process.env.INDEXNOW_INTERNAL_TOKEN,
        bingApiKey: !!process.env.BING_INDEXNOW_KEY,
        cronSecret: !!process.env.CRON_SECRET,
        siteUrl: process.env.SITE_URL || 'https://www.farmcompanion.co.uk',
      },
      sitemap: {
        mainSitemap: 'https://www.farmcompanion.co.uk/sitemap.xml',
        chunks: [] as Array<{ name: string; url: string; status: string }>,
        totalUrls: 0,
        lastGenerated: null as string | null,
      },
      indexing: {
        endpoints: {
          submit: 'https://www.farmcompanion.co.uk/api/bing/submit',
          ping: 'https://www.farmcompanion.co.uk/api/bing/ping',
          cron: 'https://www.farmcompanion.co.uk/api/cron/bing-sitemap-ping',
        },
        automation: {
          contentChanges: true,
          dailyPing: true,
          cronSchedule: '0 2 * * * (daily at 02:00 UTC)',
        },
      },
      statistics: {
        farms: 0,
        counties: 0,
        producePages: 0,
        corePages: 10,
      },
    }

    // Load farm statistics
    try {
      const farmsFile = path.join(process.cwd(), 'data', 'farms.json')
      const farmsData = await fs.readFile(farmsFile, 'utf-8')
      const farms = JSON.parse(farmsData)
      
      status.statistics.farms = farms.length
      
      // Count unique counties
      const counties = new Set<string>()
      farms.forEach((farm: any) => {
        if (farm?.location?.county) {
          counties.add(farm.location.county)
        }
      })
      status.statistics.counties = counties.size
    } catch (error) {
      console.warn('Could not load farm statistics:', error)
    }

    // Load produce statistics
    try {
      const { PRODUCE } = await import('@/data/produce')
      status.statistics.producePages = PRODUCE.length
    } catch (error) {
      console.warn('Could not load produce statistics:', error)
    }

    // Check sitemap chunks
    const chunkNames = ['core-pages.xml', 'farms-1.xml', 'produce-pages.xml', 'counties-1.xml']
    
    for (const chunkName of chunkNames) {
      try {
        const chunkUrl = `https://www.farmcompanion.co.uk/sitemaps/${chunkName}`
        const response = await fetch(chunkUrl, { method: 'HEAD' })
        
        status.sitemap.chunks.push({
          name: chunkName,
          url: chunkUrl,
          status: response.ok ? 'accessible' : `error-${response.status}`,
        })
      } catch {
        status.sitemap.chunks.push({
          name: chunkName,
          url: `https://www.farmcompanion.co.uk/sitemaps/${chunkName}`,
          status: 'error',
        })
      }
    }

    // Calculate total URLs
    status.sitemap.totalUrls = 
      status.statistics.corePages + 
      status.statistics.farms + 
      status.statistics.counties + 
      status.statistics.producePages

    // Check main sitemap
    try {
      const sitemapResponse = await fetch(status.sitemap.mainSitemap, { method: 'HEAD' })
      if (sitemapResponse.ok) {
        const lastModified = sitemapResponse.headers.get('last-modified')
        status.sitemap.lastGenerated = lastModified
      }
    } catch (error) {
      console.warn('Could not check main sitemap:', error)
    }

    // Add health check link
    const healthCheckUrl = 'https://www.farmcompanion.co.uk/api/health/bing-indexnow'
    
    return NextResponse.json({
      ...status,
      links: {
        healthCheck: healthCheckUrl,
        webmasterTools: 'https://www.bing.com/webmasters',
        indexNowDocs: 'https://www.bing.com/indexnow',
        monitoring: 'https://github.com/farm-companion/farm-frontend/actions',
      },
      recommendations: [
        'Monitor Bing Webmaster Tools for indexing status',
        'Check health endpoint weekly for system status',
        'Verify new farm pages appear in search results within 24-48 hours',
        'Review server logs for bingbot and msnbot crawl activity',
      ],
    })

  } catch (error) {
    console.error('Error generating Bing status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate status',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
