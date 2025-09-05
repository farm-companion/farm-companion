import { NextRequest, NextResponse } from 'next/server'
import { notifyBingOfSitemap } from '@/lib/bing-notifications'

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
  try {
    // Verify this is a legitimate Vercel cron request
    const cronSecret = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET
    
    if (!expectedSecret || cronSecret !== `Bearer ${expectedSecret}`) {
      console.error('Unauthorized cron request - missing or invalid CRON_SECRET')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Starting nightly Bing sitemap ping...')
    
    // Notify Bing about sitemap changes
    const result = await notifyBingOfSitemap()
    
    if (result.success) {
      console.log('✅ Nightly Bing sitemap ping completed successfully')
      return NextResponse.json({ 
        success: true, 
        message: 'Bing sitemap ping completed successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ Nightly Bing sitemap ping failed:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in nightly Bing sitemap ping:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
