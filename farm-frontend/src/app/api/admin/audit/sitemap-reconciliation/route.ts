import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getCurrentUser } from '@/lib/auth'
import { trackContentChange, createFarmChangeEvent } from '@/lib/content-change-tracker'

/**
 * Quarterly Sitemap Reconciliation Audit
 * 
 * This endpoint performs a comprehensive audit of sitemap vs database URLs:
 * 1. Exports all farm URLs from database
 * 2. Compares against URLs in all sitemap chunks
 * 3. Identifies missing URLs and drift
 * 4. Submits missing URLs to IndexNow in batches
 */
export async function POST() {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Starting quarterly sitemap reconciliation audit...')

    const audit = {
      timestamp: new Date().toISOString(),
      performedBy: user.email,
      results: {
        databaseUrls: [] as string[],
        sitemapUrls: [] as string[],
        missingUrls: [] as string[],
        extraUrls: [] as string[],
        notificationsSent: 0,
        errors: [] as string[],
      },
      summary: {
        totalDatabaseUrls: 0,
        totalSitemapUrls: 0,
        missingCount: 0,
        extraCount: 0,
        driftDetected: false,
      }
    }

    // Step 1: Export all farm URLs from database
    console.log('📊 Step 1: Exporting farm URLs from database...')
    const databaseUrls = await exportFarmUrlsFromDatabase()
    audit.results.databaseUrls = databaseUrls
    audit.summary.totalDatabaseUrls = databaseUrls.length

    // Step 2: Extract URLs from all sitemap chunks
    console.log('🗺️ Step 2: Extracting URLs from sitemap chunks...')
    const sitemapUrls = await extractUrlsFromSitemaps()
    audit.results.sitemapUrls = sitemapUrls
    audit.summary.totalSitemapUrls = sitemapUrls.length

    // Step 3: Compare and identify drift
    console.log('🔍 Step 3: Comparing database vs sitemap URLs...')
    const comparison = compareUrlSets(databaseUrls, sitemapUrls)
    audit.results.missingUrls = comparison.missing
    audit.results.extraUrls = comparison.extra
    audit.summary.missingCount = comparison.missing.length
    audit.summary.extraCount = comparison.extra.length
    audit.summary.driftDetected = comparison.missing.length > 0 || comparison.extra.length > 0

    // Step 4: Submit missing URLs to IndexNow in batches
    if (comparison.missing.length > 0) {
      console.log(`📤 Step 4: Submitting ${comparison.missing.length} missing URLs to IndexNow...`)
      const submissionResult = await submitMissingUrlsToIndexNow(comparison.missing)
      audit.results.notificationsSent = submissionResult.notificationsSent
      audit.results.errors.push(...submissionResult.errors)
    } else {
      console.log('✅ Step 4: No missing URLs found - sitemap is up to date!')
    }

    // Generate summary
    const summary = generateAuditSummary(audit)
    console.log('📋 Audit Summary:', summary)

    return NextResponse.json({
      success: true,
      audit,
      summary,
      recommendations: generateRecommendations(audit)
    })

  } catch (error) {
    console.error('Error in sitemap reconciliation audit:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform sitemap reconciliation audit',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Export all farm URLs from the database
 */
async function exportFarmUrlsFromDatabase(): Promise<string[]> {
  const urls: string[] = []
  const baseUrl = 'https://www.farmcompanion.co.uk'

  try {
    // Read live farms directory
    const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
    
    try {
      const files = await fs.readdir(liveFarmsDir)
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(liveFarmsDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const farm = JSON.parse(content)
            
            if (farm.slug) {
              urls.push(`${baseUrl}/shop/${farm.slug}`)
            }
          } catch (error) {
            console.warn(`Error reading farm file ${file}:`, error)
          }
        }
      }
    } catch {
      console.warn('Live farms directory not found, checking main farms directory...')
      
      // Fallback to main farms directory
      const farmsDir = path.join(process.cwd(), 'data', 'farms')
      const files = await fs.readdir(farmsDir)
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(farmsDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const farm = JSON.parse(content)
            
            if (farm.slug && farm.status === 'live') {
              urls.push(`${baseUrl}/shop/${farm.slug}`)
            }
          } catch (error) {
            console.warn(`Error reading farm file ${file}:`, error)
          }
        }
      }
    }

    // Add core pages
    const corePages = [
      '/',
      '/map',
      '/seasonal',
      '/shop',
      '/counties',
      '/add',
      '/contact',
      '/about',
      '/privacy',
      '/terms'
    ]
    
    urls.push(...corePages.map(page => `${baseUrl}${page}`))

    // Add produce pages
    try {
      const { PRODUCE } = await import('@/data/produce')
      urls.push(...PRODUCE.map(produce => `${baseUrl}/seasonal/${produce.slug}`))
    } catch (error) {
      console.warn('Could not load produce data:', error)
    }

    // Add county pages (extract from farms)
    const counties = new Set<string>()
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    
    try {
      const files = await fs.readdir(farmsDir)
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(farmsDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const farm = JSON.parse(content)
            
            if (farm.location?.county) {
              const countySlug = farm.location.county
                .toLowerCase()
                .replace(/&/g, ' and ')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
              counties.add(countySlug)
            }
          } catch {
            // Continue processing other files
          }
        }
      }
    } catch (error) {
      console.warn('Could not process farms for county pages:', error)
    }

    urls.push(...Array.from(counties).map(county => `${baseUrl}/counties/${county}`))

  } catch (error) {
    console.error('Error exporting farm URLs from database:', error)
  }

  return [...new Set(urls)].sort() // Remove duplicates and sort
}

/**
 * Extract URLs from all sitemap chunks
 */
async function extractUrlsFromSitemaps(): Promise<string[]> {
  const urls: string[] = []
  const baseUrl = 'https://www.farmcompanion.co.uk'

  try {
    // Get main sitemap to find chunk URLs
    const mainSitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
    if (!mainSitemapResponse.ok) {
      throw new Error(`Main sitemap not accessible: ${mainSitemapResponse.status}`)
    }

    const mainSitemapContent = await mainSitemapResponse.text()
    
    // Extract chunk URLs
    const chunkMatches = mainSitemapContent.match(/<loc>(.*?)<\/loc>/g)
    if (!chunkMatches) {
      throw new Error('No sitemap chunks found in main sitemap')
    }

    // Process each chunk
    for (const match of chunkMatches) {
      const chunkUrl = match.replace(/<\/?loc>/g, '')
      
      try {
        const chunkResponse = await fetch(chunkUrl)
        if (chunkResponse.ok) {
          const chunkContent = await chunkResponse.text()
          
          // Extract URLs from chunk
          const urlMatches = chunkContent.match(/<loc>(.*?)<\/loc>/g)
          if (urlMatches) {
            urls.push(...urlMatches.map(m => m.replace(/<\/?loc>/g, '')))
          }
        } else {
          console.warn(`Could not access sitemap chunk: ${chunkUrl}`)
        }
      } catch (error) {
        console.warn(`Error processing sitemap chunk ${chunkUrl}:`, error)
      }
    }

  } catch (error) {
    console.error('Error extracting URLs from sitemaps:', error)
  }

  return [...new Set(urls)].sort() // Remove duplicates and sort
}

/**
 * Compare two URL sets and identify differences
 */
function compareUrlSets(databaseUrls: string[], sitemapUrls: string[]) {
  const databaseSet = new Set(databaseUrls)
  const sitemapSet = new Set(sitemapUrls)

  const missing = databaseUrls.filter(url => !sitemapSet.has(url))
  const extra = sitemapUrls.filter(url => !databaseSet.has(url))

  return { missing, extra }
}

/**
 * Submit missing URLs to IndexNow in batches
 */
async function submitMissingUrlsToIndexNow(missingUrls: string[]): Promise<{
  notificationsSent: number
  errors: string[]
}> {
  const errors: string[] = []
  let notificationsSent = 0

  // Process in batches of 200 (Bing's limit)
  const batchSize = 200
  const batches = []
  
  for (let i = 0; i < missingUrls.length; i += batchSize) {
    batches.push(missingUrls.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    try {
      // Create content change events for each URL
      const changeEvents = batch.map(url => {
        // Determine change type based on URL pattern
        if (url.includes('/shop/')) {
          const slug = url.split('/shop/')[1]
          return createFarmChangeEvent('content_update', slug)
        } else if (url.includes('/seasonal/')) {
          return {
            type: 'content_update' as const,
            url,
            metadata: { timestamp: new Date().toISOString() }
          }
        } else if (url.includes('/counties/')) {
          return {
            type: 'content_update' as const,
            url,
            metadata: { timestamp: new Date().toISOString() }
          }
        } else {
          return {
            type: 'content_update' as const,
            url,
            metadata: { timestamp: new Date().toISOString() }
          }
        }
      })

      // Submit each URL individually (more reliable than batch submission)
      for (const event of changeEvents) {
        try {
          const result = await trackContentChange(event)
          if (result.success) {
            notificationsSent += result.notificationsSent
          } else {
            errors.push(...result.errors)
          }
        } catch (error) {
          errors.push(`Failed to submit ${event.url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      errors.push(`Batch submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { notificationsSent, errors }
}

/**
 * Generate audit summary
 */
function generateAuditSummary(audit: any): string {
  const { summary } = audit
  
  if (!summary.driftDetected) {
    return `✅ Sitemap reconciliation complete: No drift detected. Database (${summary.totalDatabaseUrls}) and sitemap (${summary.totalSitemapUrls}) URLs match perfectly.`
  } else {
    return `⚠️ Sitemap reconciliation complete: Drift detected. Database: ${summary.totalDatabaseUrls}, Sitemap: ${summary.totalSitemapUrls}, Missing: ${summary.missingCount}, Extra: ${summary.extraCount}. ${audit.results.notificationsSent} notifications sent.`
  }
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(audit: any): string[] {
  const recommendations: string[] = []
  const { summary, results } = audit

  if (summary.driftDetected) {
    if (summary.missingCount > 0) {
      recommendations.push(`🔧 Fix sitemap generation: ${summary.missingCount} URLs missing from sitemap`)
      recommendations.push('📊 Review sitemap generation logic to ensure all database URLs are included')
    }

    if (summary.extraCount > 0) {
      recommendations.push(`🧹 Clean up sitemap: ${summary.extraCount} URLs in sitemap but not in database`)
      recommendations.push('🗑️ Remove or update sitemap generation to exclude deleted content')
    }

    recommendations.push('📈 Monitor IndexNow submissions to ensure missing URLs are indexed')
    recommendations.push('🔄 Schedule more frequent audits if drift continues')
  } else {
    recommendations.push('✅ Sitemap is perfectly synchronized with database')
    recommendations.push('📅 Continue quarterly audits to maintain synchronization')
  }

  if (results.errors.length > 0) {
    recommendations.push(`⚠️ Review ${results.errors.length} errors in IndexNow submissions`)
    recommendations.push('🔍 Check IndexNow configuration and API limits')
  }

  return recommendations
}
