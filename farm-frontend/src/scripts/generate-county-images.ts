#!/usr/bin/env tsx

/**
 * Generate AI images for UK county directory cards
 *
 * Usage:
 *   pnpm run generate:county-images [--county=slug] [--upload] [--force] [--limit=N]
 *
 * Examples:
 *   pnpm run generate:county-images --county=yorkshire --upload
 *   pnpm run generate:county-images --limit=10 --upload
 *   pnpm run generate:county-images --upload --force
 *
 * Requirements:
 *   - RUNWARE_API_KEY environment variable (or falls back to Pollinations)
 *   - BLOB_READ_WRITE_TOKEN for --upload mode
 */

import { config } from 'dotenv'
import { resolve, join } from 'path'

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { CountyImageGenerator } from '../lib/county-image-generator'
import { uploadCountyImage, countyImageExists } from '../lib/county-blob'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const prisma = new PrismaClient()
const PUBLIC_DIR = join(process.cwd(), 'public', 'images', 'counties')

interface Options {
  county?: string
  limit?: number
  force?: boolean
  upload?: boolean
  season?: string
}

interface GeneratedResult {
  slug: string
  name: string
  url?: string
  success: boolean
  error?: string
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = { upload: false }

  for (const arg of args) {
    if (arg.startsWith('--county=')) {
      options.county = arg.split('=')[1]
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--season=')) {
      options.season = arg.split('=')[1]
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--upload') {
      options.upload = true
    }
  }

  return options
}

/**
 * Slugify county name (matching the query utility)
 */
function slugifyCounty(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateCountyImages() {
  const options = parseArgs()
  const generator = new CountyImageGenerator()

  console.log('County Card Image Generator')
  console.log('Using Runware Flux.2 [dev] with Pollinations fallback')
  console.log('='.repeat(60))

  try {
    // Get all unique counties from database
    const countyData = await prisma.farm.groupBy({
      by: ['county'],
      where: {
        status: 'active'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Transform to array with slugs
    let counties = countyData.map(c => ({
      name: c.county,
      slug: slugifyCounty(c.county),
      farmCount: c._count.id
    }))

    // Filter by specific county if requested
    if (options.county) {
      counties = counties.filter(c => c.slug === options.county)
      if (counties.length === 0) {
        console.log(`No county found with slug: ${options.county}`)
        console.log('\nAvailable counties:')
        countyData.slice(0, 20).forEach(c => {
          console.log(`  - ${slugifyCounty(c.county)} (${c.county})`)
        })
        return
      }
    }

    // Apply limit
    if (options.limit) {
      counties = counties.slice(0, options.limit)
    }

    if (counties.length === 0) {
      console.log('No counties found in database')
      return
    }

    const mode = options.upload ? 'Upload to Vercel Blob' : 'Local dry-run'
    console.log(`Mode: ${mode}`)
    console.log(`Processing ${counties.length} counties`)
    if (options.season) {
      console.log(`Season: ${options.season}`)
    }
    if (!options.upload) {
      console.log('Add --upload flag to upload to Vercel Blob')
    }
    console.log('')

    const results: GeneratedResult[] = []

    for (let i = 0; i < counties.length; i++) {
      const county = counties[i]
      console.log(`\n[${i + 1}/${counties.length}] Processing: ${county.name}`)
      console.log(`   Slug: ${county.slug}`)
      console.log(`   Farms: ${county.farmCount}`)
      console.log('-'.repeat(60))

      try {
        // Check if image already exists (for upload mode)
        if (options.upload && !options.force) {
          const exists = await countyImageExists(county.slug)
          if (exists) {
            console.log(`   Skipping - image already exists in blob storage`)
            console.log(`   Use --force to regenerate`)
            results.push({ slug: county.slug, name: county.name, success: true })
            continue
          }
        }

        // Generate image
        console.log(`   Generating image...`)
        const buffer = await generator.generateCountyImage(county.name, county.slug, {
          safeZone: true,
          season: options.season
        })

        if (!buffer) {
          console.warn(`   Warning: No image generated for ${county.name}`)
          results.push({ slug: county.slug, name: county.name, success: false, error: 'Generation failed' })
          continue
        }

        console.log(`   Generated image buffer (${Math.round(buffer.length / 1024)}KB)`)

        // Upload or save
        if (options.upload) {
          console.log(`   Uploading to Vercel Blob...`)
          const { url } = await uploadCountyImage(buffer, county.slug, {
            countyName: county.name,
            generatedAt: new Date().toISOString(),
            allowOverwrite: options.force
          })

          console.log(`   Uploaded successfully`)
          console.log(`   URL: ${url}`)
          results.push({ slug: county.slug, name: county.name, url, success: true })
        } else {
          // Dry-run: save locally
          if (!existsSync(PUBLIC_DIR)) {
            await mkdir(PUBLIC_DIR, { recursive: true })
          }
          const filepath = join(PUBLIC_DIR, `${county.slug}.webp`)
          await writeFile(filepath, buffer)
          console.log(`   Saved locally: ${filepath}`)
          results.push({ slug: county.slug, name: county.name, success: true })
        }

        // Rate limit between generations
        if (i < counties.length - 1) {
          console.log(`   Waiting 1.5s before next generation...`)
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`   Error: ${message}`)
        results.push({ slug: county.slug, name: county.name, success: false, error: message })
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`Success: ${successCount} counties`)
    console.log(`Errors: ${errorCount} counties`)

    if (errorCount > 0) {
      console.log('\nFailed counties:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.name} (${r.slug}): ${r.error}`)
      })
    }

    if (options.upload && successCount > 0) {
      console.log('\nUploaded URLs:')
      results.filter(r => r.success && r.url).forEach(r => {
        console.log(`   ${r.slug}: ${r.url}`)
      })
    }

    // Cost estimate
    const estimatedCost = successCount * 0.0096 // Runware pricing
    console.log(`\nEstimated Runware cost: $${estimatedCost.toFixed(4)}`)

    // Next steps
    console.log('\nNEXT STEPS:')
    if (options.upload) {
      console.log('   1. Images are now available via Vercel Blob CDN')
      console.log('   2. Update county pages to use the generated images')
      console.log('   3. Consider adding image URLs to county data/cache')
    } else {
      console.log('   1. Review generated images in public/images/counties/')
      console.log('   2. Run with --upload flag to upload to Vercel Blob')
    }

  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
generateCountyImages().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
