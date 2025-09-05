import { NextRequest, NextResponse } from 'next/server'

/**
 * Bot Activity Monitoring Endpoint
 * 
 * Tracks and reports on search engine bot activity.
 * This endpoint can be called by monitoring systems to check bot accessibility.
 */
export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const timestamp = new Date().toISOString()
    
    // Identify bot type
    let botType = 'unknown'
    if (userAgent.includes('bingbot')) {
      botType = 'bingbot'
    } else if (userAgent.includes('msnbot')) {
      botType = 'msnbot'
    } else if (userAgent.includes('googlebot')) {
      botType = 'googlebot'
    } else if (userAgent.includes('crawler') || userAgent.includes('spider')) {
      botType = 'other-crawler'
    }

    // Log bot activity (in production, this would go to a proper logging system)
    console.log(`🤖 Bot Activity: ${botType} from ${ip} at ${timestamp}`, {
      userAgent,
      ip,
      timestamp,
      botType,
      path: request.nextUrl.pathname,
    })

    // Return bot-friendly response
    const response = {
      status: 'accessible',
      timestamp,
      botType,
      message: 'Site is accessible to search engine bots',
      recommendations: [
        'Ensure robots.txt allows crawling',
        'Verify sitemap is accessible',
        'Check for noindex directives on important pages',
        'Monitor indexing status in search console',
      ],
    }

    // Add specific recommendations based on bot type
    if (botType === 'bingbot' || botType === 'msnbot') {
      response.recommendations.push(
        'Check Bing Webmaster Tools for indexing status',
        'Verify IndexNow notifications are working',
        'Monitor sitemap submission in Bing'
      )
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in bot activity monitoring:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process bot activity',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
