import { NextRequest, NextResponse } from 'next/server'

// Bing URL Submission API endpoint
// This allows programmatic submission of URLs to Bing for faster indexing
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Submit to Bing IndexNow API
    const bingApiKey = process.env.BING_API_KEY
    if (!bingApiKey) {
      console.warn('BING_API_KEY not configured - skipping Bing submission')
      return NextResponse.json({ 
        message: 'Bing API key not configured',
        url: url 
      })
    }

    const bingResponse = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: 'www.farmcompanion.co.uk',
        key: bingApiKey,
        keyLocation: `https://www.farmcompanion.co.uk/${bingApiKey}.txt`,
        urlList: [url]
      })
    })

    if (bingResponse.ok) {
      return NextResponse.json({ 
        message: 'URL submitted to Bing successfully',
        url: url,
        status: bingResponse.status
      })
    } else {
      console.error('Bing submission failed:', bingResponse.status, bingResponse.statusText)
      return NextResponse.json({ 
        error: 'Failed to submit to Bing',
        url: url,
        status: bingResponse.status
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Bing submission error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    message: 'Bing URL submission endpoint is active',
    documentation: 'POST with { "url": "https://example.com/page" } to submit URLs to Bing'
  })
}
