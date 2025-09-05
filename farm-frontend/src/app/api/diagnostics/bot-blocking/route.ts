import { NextRequest, NextResponse } from 'next/server'

/**
 * Bot Blocking Diagnostic Tool
 * 
 * This endpoint detects and diagnoses bot blocking issues by:
 * 1. Testing bot accessibility with different user agents
 * 2. Checking for CDN/firewall challenges
 * 3. Verifying IP allowlists and user agent rules
 * 4. Providing resolution recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const { testUrl = 'https://www.farmcompanion.co.uk/' } = await request.json()
    
    const diagnostics = {
      testUrl,
      timestamp: new Date().toISOString(),
      tests: {
        bingbotAccess: await testBotAccess(testUrl, 'bingbot'),
        msnbotAccess: await testBotAccess(testUrl, 'msnbot'),
        googlebotAccess: await testBotAccess(testUrl, 'googlebot'),
        regularUserAccess: await testBotAccess(testUrl, 'regular'),
        challengeDetection: await detectChallenges(testUrl),
      },
      analysis: {
        blockingDetected: false,
        blockingType: null as string | null,
        affectedBots: [] as string[],
        recommendations: [] as string[],
      },
      status: 'unknown' as 'pass' | 'fail' | 'warning' | 'unknown',
    }

    // Analyze results and provide recommendations
    analyzeBotBlockingResults(diagnostics)

    return NextResponse.json(diagnostics)

  } catch (error) {
    console.error('Error in bot blocking diagnostics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform bot blocking diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Test bot access with specific user agent
 */
async function testBotAccess(url: string, botType: string) {
  const userAgents = {
    bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    msnbot: 'Mozilla/5.0 (compatible; msnbot/2.0b; +http://search.msn.com/msnbot.htm)',
    googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    regular: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  }

  const result = {
    botType,
    userAgent: userAgents[botType as keyof typeof userAgents] || userAgents.regular,
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      httpStatus: 0,
      accessible: false,
      responseTime: 0,
      challengeDetected: false,
      challengeType: null as string | null,
      error: null as string | null,
      headers: {} as Record<string, string>,
    }
  }

  try {
    const startTime = Date.now()
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': result.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    })

    result.details.responseTime = Date.now() - startTime
    result.details.httpStatus = response.status

    // Capture important headers
    const importantHeaders = [
      'cf-ray', 'cf-cache-status', 'cf-request-id', // Cloudflare
      'x-amz-cf-id', 'x-amz-cf-pop', // AWS CloudFront
      'server', 'x-powered-by', 'x-frame-options',
      'content-security-policy', 'x-content-type-options',
    ]

    for (const header of importantHeaders) {
      const value = response.headers.get(header)
      if (value) {
        result.details.headers[header] = value
      }
    }

    // Check for challenges
    if (response.status === 403) {
      result.details.challengeDetected = true
      result.details.challengeType = '403 Forbidden'
      result.status = 'fail'
    } else if (response.status === 429) {
      result.details.challengeDetected = true
      result.details.challengeType = '429 Rate Limited'
      result.status = 'fail'
    } else if (response.status === 503) {
      result.details.challengeDetected = true
      result.details.challengeType = '503 Service Unavailable'
      result.status = 'fail'
    } else if (response.status === 200) {
      result.details.accessible = true
      result.status = 'pass'
    } else {
      result.status = 'warning'
      result.details.error = `Unexpected status: ${response.status}`
    }

    // Check for challenge pages in content
    if (response.status === 200) {
      const content = await response.text()
      if (content.includes('challenge') || content.includes('captcha') || content.includes('verification')) {
        result.details.challengeDetected = true
        result.details.challengeType = 'Challenge page detected in content'
        result.status = 'fail'
      }
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Network error'
  }

  return result
}

/**
 * Detect specific types of challenges
 */
async function detectChallenges(url: string) {
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      cloudflareChallenge: false,
      wafBlocking: false,
      geoblocking: false,
      rateLimiting: false,
      challengeTypes: [] as string[],
      recommendations: [] as string[],
    }
  }

  try {
    // Test with a simple request to detect challenges
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      },
    })

    // Check for Cloudflare challenges
    if (response.headers.get('cf-ray') || response.headers.get('cf-cache-status')) {
      if (response.status === 403 || response.status === 503) {
        result.details.cloudflareChallenge = true
        result.details.challengeTypes.push('Cloudflare Challenge')
        result.details.recommendations.push('Disable Bot Fight Mode in Cloudflare')
        result.details.recommendations.push('Add bingbot and msnbot to IP allowlist')
      }
    }

    // Check for WAF blocking
    if (response.status === 403 && !result.details.cloudflareChallenge) {
      result.details.wafBlocking = true
      result.details.challengeTypes.push('WAF Blocking')
      result.details.recommendations.push('Review WAF rules for bot blocking')
      result.details.recommendations.push('Add bot user agents to allowlist')
    }

    // Check for rate limiting
    if (response.status === 429) {
      result.details.rateLimiting = true
      result.details.challengeTypes.push('Rate Limiting')
      result.details.recommendations.push('Adjust rate limiting rules for search engines')
      result.details.recommendations.push('Whitelist search engine IPs')
    }

    // Check for geoblocking
    const content = await response.text()
    if (content.includes('not available in your country') || content.includes('geoblocked')) {
      result.details.geoblocking = true
      result.details.challengeTypes.push('Geoblocking')
      result.details.recommendations.push('Disable geoblocking for search engine bots')
    }

    if (result.details.challengeTypes.length > 0) {
      result.status = 'fail'
    } else {
      result.status = 'pass'
    }

  } catch (error) {
    result.status = 'fail'
    result.details.recommendations.push('Check network connectivity and server status')
  }

  return result
}

/**
 * Analyze bot blocking results and provide recommendations
 */
function analyzeBotBlockingResults(diagnostics: any) {
  const { tests, analysis } = diagnostics
  const recommendations: string[] = []

  // Check which bots are affected
  const botTests = [tests.bingbotAccess, tests.msnbotAccess, tests.googlebotAccess]
  const affectedBots = botTests.filter(test => test.status === 'fail').map(test => test.botType)
  
  analysis.affectedBots = affectedBots
  analysis.blockingDetected = affectedBots.length > 0

  // Determine blocking type
  if (tests.challengeDetection.details.cloudflareChallenge) {
    analysis.blockingType = 'Cloudflare Challenge'
  } else if (tests.challengeDetection.details.wafBlocking) {
    analysis.blockingType = 'WAF Blocking'
  } else if (tests.challengeDetection.details.rateLimiting) {
    analysis.blockingType = 'Rate Limiting'
  } else if (tests.challengeDetection.details.geoblocking) {
    analysis.blockingType = 'Geoblocking'
  } else if (affectedBots.length > 0) {
    analysis.blockingType = 'General Bot Blocking'
  }

  // Generate specific recommendations
  if (analysis.blockingDetected) {
    recommendations.push(`❌ Bot blocking detected for: ${affectedBots.join(', ')}`)
    
    if (analysis.blockingType === 'Cloudflare Challenge') {
      recommendations.push('🔧 Cloudflare Configuration:')
      recommendations.push('  - Disable Bot Fight Mode')
      recommendations.push('  - Add bingbot and msnbot to IP allowlist')
      recommendations.push('  - Configure Browser Integrity Check appropriately')
    } else if (analysis.blockingType === 'WAF Blocking') {
      recommendations.push('🔧 WAF Configuration:')
      recommendations.push('  - Review WAF rules for bot blocking')
      recommendations.push('  - Add bot user agents to allowlist')
      recommendations.push('  - Whitelist search engine IP ranges')
    } else if (analysis.blockingType === 'Rate Limiting') {
      recommendations.push('🔧 Rate Limiting Configuration:')
      recommendations.push('  - Adjust rate limits for search engines')
      recommendations.push('  - Whitelist search engine IPs')
      recommendations.push('  - Increase limits for bot user agents')
    } else if (analysis.blockingType === 'Geoblocking') {
      recommendations.push('🔧 Geoblocking Configuration:')
      recommendations.push('  - Disable geoblocking for search engines')
      recommendations.push('  - Allow search engine bots from all regions')
    }

    // Add general recommendations
    recommendations.push('📋 General Bot Access Configuration:')
    recommendations.push('  - Ensure robots.txt allows crawling')
    recommendations.push('  - Verify no server-level bot blocking')
    recommendations.push('  - Check firewall rules for search engines')
    recommendations.push('  - Monitor server logs for bot access patterns')

    diagnostics.status = 'fail'
  } else {
    recommendations.push('✅ No bot blocking detected')
    recommendations.push('📊 Monitor server logs for bot crawl activity')
    recommendations.push('🔍 Verify bots can access all important pages')
    diagnostics.status = 'pass'
  }

  // Add monitoring recommendations
  recommendations.push('📈 Monitoring Recommendations:')
  recommendations.push('  - Set up alerts for bot access failures')
  recommendations.push('  - Monitor search engine crawl reports')
  recommendations.push('  - Track indexing status in search consoles')
  recommendations.push('  - Regular bot accessibility testing')

  analysis.recommendations = recommendations
}
