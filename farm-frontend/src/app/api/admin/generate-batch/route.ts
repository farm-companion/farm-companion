/**
 * Admin API: Comprehensive Batch Image Generation
 *
 * Generates images for produce (all seasons) and counties using Runware.
 * Requires ADMIN_API_KEY header for authorization.
 *
 * POST /api/admin/generate-batch
 *
 * Body:
 *   type: 'produce' | 'county' | 'all'
 *   limit?: number (default: 10)
 *   force?: boolean (regenerate existing)
 *   dryRun?: boolean (don't upload, just test)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProduceImageGenerator } from '@/lib/produce-image-generator'
import { CountyImageGenerator } from '@/lib/county-image-generator'
import { uploadProduceImage, produceImageExists } from '@/lib/produce-blob'
import { uploadCountyImage, countyImageExists } from '@/lib/county-blob'
import { PRODUCE } from '@/data/produce'
import { prisma } from '@/lib/prisma'
import { createRouteLogger } from '@/lib/logger'

const logger = createRouteLogger('admin/generate-batch')

// Auth check
function checkApiKey(request: NextRequest): boolean {
  const apiKey = process.env.ADMIN_API_KEY
  if (!apiKey) return true // No key configured = allow (dev mode)

  const providedKey = request.headers.get('x-api-key') ||
                      new URL(request.url).searchParams.get('apiKey')
  return providedKey === apiKey
}

// Slugify county name
function slugifyCounty(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type = 'all', limit = 10, force = false, dryRun = false } = body

    logger.info('Starting comprehensive batch generation', { type, limit, force, dryRun })

    const results: {
      produce: Array<{ slug: string; success: boolean; urls?: string[]; error?: string }>
      counties: Array<{ slug: string; success: boolean; url?: string; error?: string }>
    } = {
      produce: [],
      counties: []
    }

    // Generate produce images with seasonal variations
    if (type === 'produce' || type === 'all') {
      const produceGenerator = new ProduceImageGenerator()
      const produceItems = PRODUCE.slice(0, limit)

      logger.info(`Generating images for ${produceItems.length} produce items (4 seasonal variations each)`)

      for (const produce of produceItems) {
        try {
          // Check if images already exist
          if (!force) {
            const exists = await produceImageExists(produce.slug, 1)
            if (exists) {
              logger.debug(`Skipping ${produce.slug} - already exists`)
              results.produce.push({ slug: produce.slug, success: true })
              continue
            }
          }

          const urls: string[] = []

          // Generate 4 variations with different seasonal lighting
          // Month 1=winter, 4=spring, 7=summer, 10=autumn
          const seasonalMonths = [1, 4, 7, 10]

          for (let i = 0; i < 4; i++) {
            const month = seasonalMonths[i]
            const seed = hashString(produce.slug) + i * 1000

            logger.debug(`Generating ${produce.slug} variation ${i + 1} (month ${month})`)

            const buffer = await produceGenerator.generateProduceImage(
              produce.name,
              produce.slug,
              { month, seed }
            )

            if (buffer) {
              if (!dryRun) {
                const result = await uploadProduceImage(buffer, produce.slug, i + 1, {
                  produceName: produce.name,
                  generatedAt: new Date().toISOString(),
                  allowOverwrite: force
                })
                urls.push(result.url)
                logger.info(`Uploaded ${produce.slug}/${i + 1}`, { url: result.url })
              } else {
                urls.push(`[dry-run] ${produce.slug}/${i + 1}`)
              }
            }

            // Rate limit between generations
            await sleep(800)
          }

          results.produce.push({ slug: produce.slug, success: true, urls })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          logger.error(`Failed to generate ${produce.slug}`, { error: message })
          results.produce.push({ slug: produce.slug, success: false, error: message })
        }

        // Rate limit between produce items
        await sleep(500)
      }
    }

    // Generate county images
    if (type === 'county' || type === 'all') {
      const countyGenerator = new CountyImageGenerator()

      // Get counties from database
      const countyData = await prisma.farm.groupBy({
        by: ['county'],
        where: { status: 'active' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      })

      const counties = countyData.slice(0, limit).map((c: { county: string }) => ({
        name: c.county,
        slug: slugifyCounty(c.county)
      }))

      logger.info(`Generating images for ${counties.length} counties`)

      for (const county of counties) {
        try {
          // Check if exists
          if (!force) {
            const exists = await countyImageExists(county.slug)
            if (exists) {
              logger.debug(`Skipping ${county.slug} - already exists`)
              results.counties.push({ slug: county.slug, success: true })
              continue
            }
          }

          logger.debug(`Generating ${county.name} (${county.slug})`)

          const buffer = await countyGenerator.generateCountyImage(
            county.name,
            county.slug,
            { safeZone: true }
          )

          if (buffer) {
            if (!dryRun) {
              const result = await uploadCountyImage(buffer, county.slug, {
                countyName: county.name,
                generatedAt: new Date().toISOString(),
                allowOverwrite: force
              })
              logger.info(`Uploaded ${county.slug}`, { url: result.url })
              results.counties.push({ slug: county.slug, success: true, url: result.url })
            } else {
              results.counties.push({ slug: county.slug, success: true, url: '[dry-run]' })
            }
          } else {
            results.counties.push({ slug: county.slug, success: false, error: 'Generation failed' })
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          logger.error(`Failed to generate ${county.slug}`, { error: message })
          results.counties.push({ slug: county.slug, success: false, error: message })
        }

        // Rate limit
        await sleep(1200)
      }
    }

    // Calculate summary
    const produceSuccess = results.produce.filter(r => r.success).length
    const produceErrors = results.produce.filter(r => !r.success).length
    const countySuccess = results.counties.filter(r => r.success).length
    const countyErrors = results.counties.filter(r => !r.success).length

    // Cost estimate: $0.0096 per image via Runware
    const totalImages = (produceSuccess * 4) + countySuccess
    const estimatedCost = totalImages * 0.0096

    logger.info('Batch generation complete', {
      produceSuccess,
      produceErrors,
      countySuccess,
      countyErrors,
      totalImages,
      estimatedCost
    })

    return NextResponse.json({
      success: true,
      summary: {
        produce: {
          success: produceSuccess,
          errors: produceErrors,
          imagesGenerated: produceSuccess * 4
        },
        counties: {
          success: countySuccess,
          errors: countyErrors,
          imagesGenerated: countySuccess
        },
        total: {
          imagesGenerated: totalImages,
          estimatedCost: `$${estimatedCost.toFixed(4)}`
        }
      },
      results
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Batch generation failed', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/admin/generate-batch
 *
 * Get status of what needs to be generated.
 */
export async function GET(request: NextRequest) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  try {
    // Count produce
    const produceCount = PRODUCE.length

    // Get county count from database
    const countyData = await prisma.farm.groupBy({
      by: ['county'],
      where: { status: 'active' }
    })

    // Check which have images already
    let produceWithImages = 0
    for (const produce of PRODUCE.slice(0, 20)) {
      const exists = await produceImageExists(produce.slug, 1)
      if (exists) produceWithImages++
    }

    let countiesWithImages = 0
    for (const county of countyData.slice(0, 20)) {
      const slug = slugifyCounty(county.county)
      const exists = await countyImageExists(slug)
      if (exists) countiesWithImages++
    }

    return NextResponse.json({
      produce: {
        total: produceCount,
        needingImages: produceCount - produceWithImages,
        imagesNeeded: (produceCount - produceWithImages) * 4
      },
      counties: {
        total: countyData.length,
        needingImages: countyData.length - countiesWithImages
      },
      estimatedTotalImages: ((produceCount - produceWithImages) * 4) + (countyData.length - countiesWithImages),
      estimatedCost: `$${(((produceCount - produceWithImages) * 4) + (countyData.length - countiesWithImages)) * 0.0096}`
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Status check failed', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max
