/**
 * Content Change Tracker
 * 
 * This module handles all content changes that should trigger Bing IndexNow notifications.
 * Implements the operational policy: any publish, unpublish, slug change, or canonical
 * change triggers /api/bing/submit for changed URLs and their parent category pages.
 */

import { notifyBingOfUrl, notifyBingOfUrls } from './bing-notifications'

export type ContentChangeType = 
  | 'publish'
  | 'unpublish' 
  | 'slug_change'
  | 'canonical_change'
  | 'content_update'
  | 'photo_approval'
  | 'photo_rejection'

export type ContentChangeEvent = {
  type: ContentChangeType
  url: string
  oldUrl?: string // For slug changes
  parentUrls?: string[] // Parent category pages
  metadata?: {
    farmId?: string
    farmSlug?: string
    county?: string
    timestamp: string
  }
}

/**
 * Track content changes and trigger appropriate Bing notifications
 * This is the main entry point for all content change tracking
 */
export async function trackContentChange(event: ContentChangeEvent): Promise<{
  success: boolean
  notificationsSent: number
  errors: string[]
}> {
  const errors: string[] = []
  let notificationsSent = 0

  try {
    // Runtime check to prevent client-side usage
    if (typeof window !== 'undefined') {
      throw new Error('Content change tracking is server-side only and cannot be called from the browser')
    }

    console.log(`📝 Tracking content change: ${event.type} for ${event.url}`)

    // Determine which URLs need to be notified
    const urlsToNotify = await determineUrlsToNotify(event)
    
    if (urlsToNotify.length === 0) {
      console.log('⚠️ No URLs to notify for this content change')
      return { success: true, notificationsSent: 0, errors: [] }
    }

    // Send notifications to Bing
    const result = await notifyBingOfUrls(urlsToNotify)
    
    if (result.success) {
      notificationsSent = result.results.filter(r => r.success).length
      const failedResults = result.results.filter(r => !r.success)
      
      if (failedResults.length > 0) {
        errors.push(...failedResults.map(r => `${r.url}: ${r.error}`))
      }
      
      console.log(`✅ Content change tracking completed: ${notificationsSent} notifications sent`)
    } else {
      errors.push('Failed to send notifications to Bing')
      console.error('❌ Content change tracking failed:', result)
    }

    return { success: result.success, notificationsSent, errors }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    errors.push(errorMessage)
    console.error('❌ Error in content change tracking:', error)
    return { success: false, notificationsSent, errors }
  }
}

/**
 * Determine which URLs need to be notified based on the content change type
 */
async function determineUrlsToNotify(event: ContentChangeEvent): Promise<string[]> {
  const urls: string[] = []

  switch (event.type) {
    case 'publish':
      // New content published - notify the new URL and parent pages
      urls.push(event.url)
      if (event.parentUrls) {
        urls.push(...event.parentUrls)
      }
      break

    case 'unpublish':
      // Content unpublished - notify the URL (Bing will handle removal)
      urls.push(event.url)
      break

    case 'slug_change':
      // Slug changed - notify both old and new URLs
      if (event.oldUrl) {
        urls.push(event.oldUrl) // Old URL for removal
      }
      urls.push(event.url) // New URL for indexing
      if (event.parentUrls) {
        urls.push(...event.parentUrls)
      }
      break

    case 'canonical_change':
      // Canonical URL changed - notify both URLs
      if (event.oldUrl) {
        urls.push(event.oldUrl)
      }
      urls.push(event.url)
      break

    case 'content_update':
      // Content updated - notify the URL
      urls.push(event.url)
      break

    case 'photo_approval':
    case 'photo_rejection':
      // Photo changes - notify the farm page
      urls.push(event.url)
      break

    default:
      console.warn(`Unknown content change type: ${event.type}`)
      urls.push(event.url)
  }

  // Remove duplicates and filter out invalid URLs
  const uniqueUrls = [...new Set(urls)].filter(url => isValidUrl(url))
  
  console.log(`📋 URLs to notify: ${uniqueUrls.join(', ')}`)
  return uniqueUrls
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.host === 'www.farmcompanion.co.uk' && 
           (parsed.protocol === 'https:' || parsed.protocol === 'http:')
  } catch {
    return false
  }
}

/**
 * Helper function to create content change events for farms
 */
export function createFarmChangeEvent(
  type: ContentChangeType,
  farmSlug: string,
  oldSlug?: string,
  county?: string
): ContentChangeEvent {
  const baseUrl = 'https://www.farmcompanion.co.uk'
  const url = `${baseUrl}/shop/${farmSlug}`
  const oldUrl = oldSlug ? `${baseUrl}/shop/${oldSlug}` : undefined
  
  // Determine parent URLs
  const parentUrls: string[] = []
  if (county) {
    const countySlug = county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    parentUrls.push(`${baseUrl}/counties/${countySlug}`)
  }
  parentUrls.push(`${baseUrl}/shop`) // Main shop page

  return {
    type,
    url,
    oldUrl,
    parentUrls,
    metadata: {
      farmSlug,
      county,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Helper function to create content change events for produce pages
 */
export function createProduceChangeEvent(
  type: ContentChangeType,
  produceSlug: string
): ContentChangeEvent {
  const baseUrl = 'https://www.farmcompanion.co.uk'
  const url = `${baseUrl}/seasonal/${produceSlug}`
  
  return {
    type,
    url,
    parentUrls: [`${baseUrl}/seasonal`], // Main seasonal page
    metadata: {
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Helper function to create content change events for county pages
 */
export function createCountyChangeEvent(
  type: ContentChangeType,
  countySlug: string
): ContentChangeEvent {
  const baseUrl = 'https://www.farmcompanion.co.uk'
  const url = `${baseUrl}/counties/${countySlug}`
  
  return {
    type,
    url,
    parentUrls: [`${baseUrl}/counties`], // Main counties page
    metadata: {
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Helper function to create content change events for core pages
 */
export function createCorePageChangeEvent(
  type: ContentChangeType,
  pagePath: string
): ContentChangeEvent {
  const baseUrl = 'https://www.farmcompanion.co.uk'
  const url = `${baseUrl}${pagePath}`
  
  return {
    type,
    url,
    metadata: {
      timestamp: new Date().toISOString(),
    }
  }
}
