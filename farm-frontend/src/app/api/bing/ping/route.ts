import { NextRequest, NextResponse } from 'next/server'

// Bing Sitemap Ping endpoint
// This notifies Bing when the sitemap has been updated
export async function POST(request: NextRequest) {
  try {
    const { SITE_URL } = await import('@/lib/site')
    const sitemapUrl = `${SITE_URL}/sitemap.xml`
    
    // Ping Bing about sitemap update
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FarmCompanion/1.0'
      }
    })

    if (response.ok) {
      return NextResponse.json({ 
        message: 'Sitemap pinged to Bing successfully',
        sitemapUrl: sitemapUrl,
        status: response.status
      })
    } else {
      console.error('Bing ping failed:', response.status, response.statusText)
      return NextResponse.json({ 
        error: 'Failed to ping Bing',
        sitemapUrl: sitemapUrl,
        status: response.status
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Bing ping error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET endpoint for manual testing
export async function GET() {
  const { SITE_URL } = await import('@/lib/site')
  const sitemapUrl = `${SITE_URL}/sitemap.xml`
  
  return NextResponse.json({ 
    message: 'Bing sitemap ping endpoint',
    sitemapUrl: sitemapUrl,
    pingUrl: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    documentation: 'POST to this endpoint to ping Bing about sitemap updates'
  })
}
