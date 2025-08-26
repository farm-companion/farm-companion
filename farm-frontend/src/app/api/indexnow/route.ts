import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'

export async function POST(req: Request) {
  try {
    const { urls } = await req.json() // string[]
    const key = process.env.INDEXNOW_KEY
    
    if (!key) {
      return NextResponse.json({ error: 'INDEXNOW_KEY not configured' }, { status: 500 })
    }
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 })
    }
    
    const body = { 
      host: new URL(SITE_URL).host, 
      key, 
      keyLocation: `${SITE_URL}/${key}.txt`, 
      urlList: urls 
    }
    
    const response = await fetch('https://api.indexnow.org/indexnow', { 
      method: 'POST', 
      headers: { 'content-type': 'application/json' }, 
      body: JSON.stringify(body) 
    })
    
    if (!response.ok) {
      console.error('IndexNow API error:', response.status, response.statusText)
      return NextResponse.json({ error: 'IndexNow API request failed' }, { status: response.status })
    }
    
    console.log(`IndexNow: Successfully pinged ${urls.length} URLs`)
    return NextResponse.json({ ok: true, urlsSubmitted: urls.length })
    
  } catch (error) {
    console.error('IndexNow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
