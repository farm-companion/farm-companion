#!/usr/bin/env tsx

/**
 * Generate AI images for farm shops without photos
 * Usage:
 *   pnpm run generate:farm-images [--limit=10] [--slug=farm-slug] [--upload] [--force]
 *
 * Examples:
 *   pnpm run generate:farm-images --limit=5 --upload
 *   pnpm run generate:farm-images --slug=darts-farm --upload
 *   pnpm run generate:farm-images --limit=20 --upload --force
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { getRunwareClient, buildHarvestPrompt, HARVEST_STYLE } from '../lib/runware-client'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const prisma = new PrismaClient()
const PUBLIC_DIR = join(process.cwd(), 'public', 'images', 'farms')

interface Options {
  limit?: number
  slug?: string
  force?: boolean
  upload?: boolean
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
  const options: Options = { limit: 10, upload: false }

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--slug=')) {
      options.slug = arg.split('=')[1]
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--upload') {
      options.upload = true
    }
  }

  return options
}

// Hash string to number for deterministic seed
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Regional styles for prompts
const REGIONAL_STYLES: Record<string, string> = {
  cornwall: 'Cornish granite and slate, coastal charm',
  devon: 'Devon cob walls and thatch, red sandstone',
  somerset: 'golden Ham stone, traditional orchards',
  kent: 'traditional oast houses, white weatherboard',
  yorkshire: 'grey millstone grit, Yorkshire moorland',
  default: 'traditional British countryside'
}

async function generateFarmImages() {
  const options = parseArgs()
  const runware = getRunwareClient()

  if (!runware.isConfigured()) {
    console.error('❌ RUNWARE_API_KEY not configured')
    process.exit(1)
  }

  console.log('🌾 Farm Companion - Farm Shop Image Generator')
  console.log('='.repeat(50))

  try {
    // Query farms without images
    let farms
    if (options.slug) {
      farms = await prisma.farm.findMany({
        where: {
          slug: options.slug,
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          county: true,
          images: {
            where: { status: 'approved' },
            take: 1
          }
        }
      })
    } else {
      // Find farms with no approved images
      farms = await prisma.farm.findMany({
        where: {
          status: 'active',
          images: {
            none: {
              status: 'approved'
            }
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          county: true,
          images: true
        },
        take: options.limit,
        orderBy: {
          name: 'asc'
        }
      })
    }

    if (farms.length === 0) {
      if (options.slug) {
        console.log(`❌ No farm found with slug: ${options.slug}`)
      } else {
        console.log('✅ All farms have images! Nothing to generate.')
      }
      return
    }

    const mode = options.upload ? 'Save URL to database' : 'Dry-run (no save)'
    console.log(`📋 Mode: ${mode}`)
    console.log(`📦 Processing ${farms.length} farms without images`)
    if (!options.upload) {
      console.log('💡 Add --upload flag to save URLs to database')
    }
    console.log('')

    const results: GeneratedResult[] = []

    for (let i = 0; i < farms.length; i++) {
      const farm = farms[i]
      console.log(`\n[${i + 1}/${farms.length}] Processing: ${farm.name}`)
      console.log(`   Slug: ${farm.slug}`)
      console.log(`   County: ${farm.county}`)
      console.log('-'.repeat(50))

      try {
        // Build prompt for this farm
        const countyKey = farm.county?.toLowerCase() || 'default'
        const regionalStyle = REGIONAL_STYLES[countyKey] || REGIONAL_STYLES.default

        const prompt = buildHarvestPrompt(
          `authentic rural British farm shop exterior`,
          regionalStyle,
          {
            lighting: HARVEST_STYLE.lighting,
            background: 'green countryside, natural setting'
          }
        )

        // Generate image via Runware (returns URL directly)
        console.log(`🎨 Generating AI image via Runware...`)
        const result = await runware.generate({
          prompt,
          negativePrompt: HARVEST_STYLE.negative,
          width: 2048,
          height: 1152,
          seed: hashString(farm.slug)
        })

        if (!result || result.images.length === 0) {
          console.warn(`⚠️  No image generated for ${farm.name}`)
          results.push({ slug: farm.slug, name: farm.name, success: false, error: 'Generation failed' })
          continue
        }

        const imageUrl = result.images[0].imageURL
        console.log(`✅ Generated image URL: ${imageUrl}`)

        // Save URL to database
        if (options.upload) {
          await prisma.image.create({
            data: {
              farmId: farm.id,
              url: imageUrl,
              altText: `${farm.name} farm shop`,
              uploadedBy: 'ai_generator',
              status: 'approved',
              displayOrder: 0
            }
          })

          console.log(`✅ Saved to database`)
          results.push({ slug: farm.slug, name: farm.name, url: imageUrl, success: true })
        } else {
          // Dry-run: just show the URL
          console.log(`🔗 Would save URL: ${imageUrl}`)
          results.push({ slug: farm.slug, name: farm.name, url: imageUrl, success: true })
        }

        // Rate limit between generations
        if (i < farms.length - 1) {
          console.log(`⏳ Waiting 2s before next generation...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Failed: ${message}`)
        results.push({ slug: farm.slug, name: farm.name, success: false, error: message })
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 SUMMARY')
    console.log('='.repeat(50))

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`✅ Success: ${successCount} farms`)
    console.log(`❌ Errors: ${errorCount} farms`)

    if (errorCount > 0) {
      console.log('\nFailed farms:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.name} (${r.slug}): ${r.error}`)
      })
    }

    if (options.upload && successCount > 0) {
      console.log('\n✅ Images have been uploaded and saved to the database.')
      console.log('   They will appear on farm pages automatically.')
    }

  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
generateFarmImages().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
