/**
 * Bing IndexNow notification utilities
 *
 * SERVER-SIDE ONLY - NEVER CALL FROM CLIENT COMPONENTS
 *
 * These functions contain sensitive tokens and should only be called from:
 * - API routes
 * - Server components
 * - Vercel cron jobs
 * - Server-side functions
 *
 * Never import or call these functions from:
 * - Client components (marked with 'use client')
 * - Browser-side JavaScript
 * - Frontend React components
 */

import { logger } from '@/lib/logger'

const bingLogger = logger.child({ route: 'lib/bing-notifications' })
const HOST = 'www.farmcompanion.co.uk'

/**
 * Notify Bing IndexNow about a URL change
 * This function is server-side only and should never be called from client components
 */
export async function notifyBingOfUrl(url: string): Promise<{ success: boolean; error?: string }> {
  // Runtime check to prevent client-side usage
  if (typeof window !== 'undefined') {
    throw new Error('Bing notification functions are server-side only and cannot be called from the browser')
  }

  try {
    // Validate URL format and host
    if (!url || typeof url !== 'string') {
      return { success: false, error: 'Invalid URL provided' }
    }

    // Ensure URL is from our domain
    if (!url.includes(HOST)) {
      return { success: false, error: 'URL must be from farmcompanion.co.uk' }
    }

    // Ensure URL is absolute
    const fullUrl = url.startsWith('http') ? url : `https://${HOST}${url}`

    const internalToken = process.env.INDEXNOW_INTERNAL_TOKEN
    if (!internalToken) {
      bingLogger.warn('INDEXNOW_INTERNAL_TOKEN not configured - skipping Bing notification')
      return { success: false, error: 'IndexNow token not configured' }
    }

    const response = await fetch(`https://${HOST}/api/bing/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({ url: fullUrl }),
    })

    const result = await response.json()

    if (result.ok) {
      bingLogger.info('Bing notified of URL', { url: fullUrl })
      return { success: true }
    } else {
      bingLogger.error('Bing notification failed', { url: fullUrl, result })
      return { success: false, error: result.error || 'Unknown error' }
    }
  } catch (error) {
    bingLogger.error('Error notifying Bing', { url }, error as Error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Notify Bing IndexNow about multiple URLs
 * This function is server-side only and should never be called from client components
 */
export async function notifyBingOfUrls(urls: string[]): Promise<{ success: boolean; results: Array<{ url: string; success: boolean; error?: string }> }> {
  // Runtime check to prevent client-side usage
  if (typeof window !== 'undefined') {
    throw new Error('Bing notification functions are server-side only and cannot be called from the browser')
  }

  const results = await Promise.allSettled(
    urls.map(url => notifyBingOfUrl(url))
  )

  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        url: urls[index],
        success: result.value.success,
        error: result.value.error,
      }
    } else {
      return {
        url: urls[index],
        success: false,
        error: result.reason?.message || 'Unknown error',
      }
    }
  })

  const allSuccessful = processedResults.every(r => r.success)
  
  return {
    success: allSuccessful,
    results: processedResults,
  }
}

/**
 * Notify Bing IndexNow about sitemap changes
 * This function is server-side only and should never be called from client components
 */
export async function notifyBingOfSitemap(): Promise<{ success: boolean; error?: string }> {
  // Runtime check to prevent client-side usage
  if (typeof window !== 'undefined') {
    throw new Error('Bing notification functions are server-side only and cannot be called from the browser')
  }

  try {
    const internalToken = process.env.INDEXNOW_INTERNAL_TOKEN
    if (!internalToken) {
      bingLogger.warn('INDEXNOW_INTERNAL_TOKEN not configured - skipping Bing sitemap notification')
      return { success: false, error: 'IndexNow token not configured' }
    }

    const response = await fetch(`https://${HOST}/api/bing/ping`, {
      method: 'POST',
      headers: {
        'x-internal-token': internalToken,
      },
    })

    const result = await response.json()

    if (result.ok) {
      bingLogger.info('Bing notified of sitemap changes')
      return { success: true }
    } else {
      bingLogger.error('Bing sitemap notification failed', { result })
      return { success: false, error: result.error || 'Unknown error' }
    }
  } catch (error) {
    bingLogger.error('Error notifying Bing of sitemap', {}, error as Error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Generate farm page URL from farm data
 */
export function getFarmPageUrl(farm: { slug: string }): string {
  return `https://${HOST}/shop/${farm.slug}`
}

/**
 * Generate claim page URL from farm data
 */
export function getClaimPageUrl(farm: { slug: string }): string {
  return `https://${HOST}/claim/${farm.slug}`
}
