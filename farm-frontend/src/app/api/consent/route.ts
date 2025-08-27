import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import { checkCsrf, trackIPReputation, isIPBlocked } from '@/lib/security'

// Use edge runtime for lightweight consent operations
export const runtime = 'edge'

const ConsentSchema = z.object({
  ads: z.boolean(),
  analytics: z.boolean(),
})

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  
  try {
    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Apply rate limiting
    const rateLimit = await rateLimiters.api.consume(ip)
    if (!rateLimit) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // CSRF protection
    if (!checkCsrf(req)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    
    // Validate input with Zod
    const parse = ConsentSchema.safeParse(body)
    if (!parse.success) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid consent data' }, { status: 400 })
    }
    
    const { ads, analytics } = parse.data

    // Create consent cookie
    const consentData = { ads, analytics }
    const consentJson = JSON.stringify(consentData)
    
    // Set cookie with appropriate settings
    const response = NextResponse.json({ 
      success: true, 
      message: 'Consent preferences updated' 
    })
    
    response.cookies.set('fc_consent', consentJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    // Track successful consent update
    await trackIPReputation(ip, 'success')

    return response

  } catch (error) {
    console.error('Consent update error:', error)
    await trackIPReputation(ip, 'failure')
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIP(req)
  
  try {
    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get consent from cookie
    const consentCookie = req.cookies.get('fc_consent')?.value
    
    if (!consentCookie) {
      const response = NextResponse.json({ 
        consent: { ads: false, analytics: false },
        hasConsent: false 
      })
      
      // Add cache control headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
      
      return response
    }

    try {
      const consent = JSON.parse(consentCookie)
      const response = NextResponse.json({ 
        consent,
        hasConsent: true 
      })
      
      // Add cache control headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
      
      return response
    } catch {
      const response = NextResponse.json({ 
        consent: { ads: false, analytics: false },
        hasConsent: false 
      })
      
      // Add cache control headers for better performance
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
      
      return response
    }

  } catch (error) {
    console.error('Consent retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve consent preferences' },
      { status: 500 }
    )
  }
}
