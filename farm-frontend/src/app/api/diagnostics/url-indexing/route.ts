import { NextRequest, NextResponse } from 'next/server'
import { notifyBingOfUrl } from '@/lib/bing-notifications'

/**
 * URL Indexing Diagnostic Tool
 * 
 * This endpoint performs comprehensive diagnostics for URL indexing issues.
 * Follows the three-step verification process:
 * 1. Check URL accessibility to Bingbot (200 status, no geoblocking)
 * 2. Verify URL appears in sitemap and sitemap is linked
 * 3. Submit URL via IndexNow and provide monitoring guidance
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      )
    }

    const diagnostics = {
      url,
      timestamp: new Date().toISOString(),
      steps: {
        step1: await checkUrlAccessibility(url),
        step2: await checkSitemapPresence(url),
        step3: await submitToIndexNow(url),
      },
      recommendations: [] as string[],
      status: 'unknown' as 'pass' | 'fail' | 'warning' | 'unknown',
    }

    // Analyze results and provide recommendations
    analyzeResults(diagnostics)

    return NextResponse.json(diagnostics)

  } catch (error) {
    console.error('Error in URL indexing diagnostics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Step 1: Check URL accessibility to Bingbot
 */
async function checkUrlAccessibility(url: string) {
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      httpStatus: 0,
      accessible: false,
      redirects: [] as string[],
      userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      responseTime: 0,
      error: null as string | null,
    }
  }

  try {
    const startTime = Date.now()
    
    // Test with Bingbot user agent
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': result.details.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual', // Don't follow redirects automatically
    })

    result.details.responseTime = Date.now() - startTime
    result.details.httpStatus = response.status

    // Check for redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (location) {
        result.details.redirects.push(location)
      }
    }

    // Determine accessibility
    if (response.status === 200) {
      result.status = 'pass'
      result.details.accessible = true
    } else if (response.status >= 300 && response.status < 400) {
      result.status = 'warning'
      result.details.error = `URL redirects (${response.status}) - may affect indexing`
    } else if (response.status >= 400) {
      result.status = 'fail'
      result.details.error = `URL returns error status: ${response.status}`
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Network error'
  }

  return result
}

/**
 * Step 2: Check if URL appears in sitemap
 */
async function checkSitemapPresence(url: string) {
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      inMainSitemap: false,
      inChildSitemap: false,
      sitemapUrl: null as string | null,
      sitemapAccessible: false,
      error: null as string | null,
    }
  }

  try {
    // Check main sitemap
    const mainSitemapUrl = 'https://www.farmcompanion.co.uk/sitemap.xml'
    const sitemapResponse = await fetch(mainSitemapUrl)
    
    if (!sitemapResponse.ok) {
      result.status = 'fail'
      result.details.error = `Main sitemap not accessible: ${sitemapResponse.status}`
      return result
    }

    result.details.sitemapAccessible = true
    const sitemapContent = await sitemapResponse.text()

    // Check if it's an index sitemap
    if (sitemapContent.includes('sitemapindex')) {
      // Extract child sitemap URLs
      const childSitemapMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g)
      
      if (childSitemapMatches) {
        for (const match of childSitemapMatches) {
          const childSitemapUrl = match.replace(/<\/?loc>/g, '')
          
          try {
            const childResponse = await fetch(childSitemapUrl)
            if (childResponse.ok) {
              const childContent = await childResponse.text()
              
              if (childContent.includes(url)) {
                result.details.inChildSitemap = true
                result.details.sitemapUrl = childSitemapUrl
                result.status = 'pass'
                break
              }
            }
          } catch (error) {
            // Continue checking other child sitemaps
          }
        }
      }
    } else {
      // Direct sitemap
      if (sitemapContent.includes(url)) {
        result.details.inMainSitemap = true
        result.details.sitemapUrl = mainSitemapUrl
        result.status = 'pass'
      }
    }

    if (!result.details.inMainSitemap && !result.details.inChildSitemap) {
      result.status = 'fail'
      result.details.error = 'URL not found in any sitemap'
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return result
}

/**
 * Step 3: Submit URL to IndexNow
 */
async function submitToIndexNow(url: string) {
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      submitted: false,
      response: null as any,
      error: null as string | null,
      monitoringGuidance: [] as string[],
    }
  }

  try {
    const submissionResult = await notifyBingOfUrl(url)
    result.details.response = submissionResult
    result.details.submitted = submissionResult.success

    if (submissionResult.success) {
      result.status = 'pass'
      result.details.monitoringGuidance = [
        'URL submitted successfully to Bing IndexNow',
        'Check Bing Webmaster Tools in 24-48 hours for indexing status',
        'Monitor crawl logs for bingbot activity',
        'Use URL Inspection tool to verify indexing progress',
      ]
    } else {
      result.status = 'fail'
      result.details.error = submissionResult.error || 'Unknown submission error'
      result.details.monitoringGuidance = [
        'IndexNow submission failed - check error details',
        'Verify IndexNow configuration and API key',
        'Check Bing IndexNow documentation for error codes',
        'Consider manual submission via Bing Webmaster Tools',
      ]
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Unknown error'
    result.details.monitoringGuidance = [
      'IndexNow submission encountered an error',
      'Check server logs for detailed error information',
      'Verify network connectivity to Bing IndexNow API',
      'Consider manual submission via Bing Webmaster Tools',
    ]
  }

  return result
}

/**
 * Analyze diagnostic results and provide recommendations
 */
function analyzeResults(diagnostics: any) {
  const { steps } = diagnostics
  const recommendations: string[] = []

  // Step 1 analysis
  if (steps.step1.status === 'fail') {
    recommendations.push('❌ URL accessibility issue: Fix HTTP status or redirects before indexing')
  } else if (steps.step1.status === 'warning') {
    recommendations.push('⚠️ URL has redirects: Consider using canonical URLs or fixing redirects')
  }

  // Step 2 analysis
  if (steps.step2.status === 'fail') {
    recommendations.push('❌ Sitemap issue: Add URL to sitemap or fix sitemap accessibility')
  }

  // Step 3 analysis
  if (steps.step3.status === 'fail') {
    recommendations.push('❌ IndexNow issue: Fix IndexNow configuration or submit manually')
  }

  // Overall status determination
  if (steps.step1.status === 'pass' && steps.step2.status === 'pass' && steps.step3.status === 'pass') {
    diagnostics.status = 'pass'
    recommendations.push('✅ All checks passed: URL should be indexed within 24-48 hours')
  } else if (steps.step1.status === 'fail' || steps.step2.status === 'fail' || steps.step3.status === 'fail') {
    diagnostics.status = 'fail'
    recommendations.push('❌ Critical issues found: Address all failures before expecting indexing')
  } else {
    diagnostics.status = 'warning'
    recommendations.push('⚠️ Some issues found: Monitor closely and address warnings')
  }

  // Additional recommendations
  recommendations.push('📊 Monitor Bing Webmaster Tools for indexing progress')
  recommendations.push('🔍 Use URL Inspection tool for detailed crawl information')
  recommendations.push('📝 Check server logs for bingbot crawl activity')

  diagnostics.recommendations = recommendations
}
