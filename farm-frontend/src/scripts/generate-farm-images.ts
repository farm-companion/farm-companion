#!/usr/bin/env tsx

/**
 * Generate AI images for farm shops without photos
 * Usage:
 *   pnpm run generate:farm-images [--limit=10] [--slug=farm-slug] [--upload] [--force] [--style=harvest|pitti]
 *
 * Examples:
 *   pnpm run generate:farm-images --limit=5 --upload
 *   pnpm run generate:farm-images --slug=darts-farm --upload --force --style=pitti
 *   pnpm run generate:farm-images --slug=darts-farm --upload --force --style=apothecary
 *
 * Behavior with --slug + --upload:
 *   - If the farm has no approved image: a new image row is created.
 *   - If an approved image already exists and --force is set: the existing
 *     row is updated in place (url/altText/uploadedBy/isHero/displayOrder).
 *   - If an approved image already exists and --force is NOT set: the farm
 *     is skipped with a warning. List mode (no --slug) still filters farms
 *     by `images.none`, so it remains insert-only.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local first, then .env.
// override:true is required so .env.local wins over values that
// @prisma/client auto-loaded from .env at module-import time
// (ES-module imports run before this code).
config({ path: resolve(process.cwd(), '.env.local'), override: true })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import {
  getRunwareClient,
  buildHarvestPrompt,
  HARVEST_STYLE,
  PITTI_STYLE,
  RUNWARE_MODELS,
  buildPittiFarmHeaderPrompt,
} from '../lib/runware-client'
import { generationHeightFor, cropBottomStrip } from '../lib/image-crop'
import { uploadPittiFarmImage } from '../lib/pitti-blob'
import {
  APOTHECARY_STYLE,
  buildApothecaryFarmOfferingsPrompt,
} from '../lib/apothecary-style'
import { uploadApothecaryFarmImage } from '../lib/apothecary-blob'

const prisma = new PrismaClient()

type Style = 'harvest' | 'pitti' | 'apothecary'

interface Options {
  limit?: number
  slug?: string
  force?: boolean
  upload?: boolean
  style?: Style
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
  const options: Options = { limit: 10, upload: false, style: 'harvest' }

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--slug=')) {
      options.slug = arg.split('=')[1]
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--upload') {
      options.upload = true
    } else if (arg.startsWith('--style=')) {
      const s = arg.split('=')[1]
      if (s !== 'harvest' && s !== 'pitti' && s !== 'apothecary') {
        console.error(`Unknown --style value: ${s}. Valid: harvest, pitti, apothecary`)
        process.exit(1)
      }
      options.style = s
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
          categories: { select: { category: { select: { name: true } } } },
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
          categories: { select: { category: { select: { name: true } } } },
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

      // Only meaningful in --slug mode: the no-slug query already filters
      // farms with `images.none`, so existingImageId will always be undefined
      // there. In --slug mode the query loads up to one approved image, so
      // farm.images[0]?.id is the row we'd overwrite under --force.
      const existingImageId: string | undefined = farm.images[0]?.id

      // Apothecary is always additive (inserts a new row even when other
      // approved images exist) per the Pitti+Apothecary plan, so it never
      // participates in the skip-on-existing or force-overwrite logic.
      if (options.upload && existingImageId && !options.force && options.style !== 'apothecary') {
        console.log(`⚠️  Skipping ${farm.slug}: approved image already exists. Use --force to overwrite.`)
        results.push({
          slug: farm.slug,
          name: farm.name,
          success: false,
          error: 'Image already exists; pass --force to overwrite',
        })
        continue
      }

      try {
        // Branch on style.
        // - Harvest: Runware-hosted URL (legacy photographic-style).
        // - Pitti: buffer -> cropBottomStrip -> pitti-farm-images/ blob.
        // - Apothecary: buffer -> cropBottomStrip -> apothecary-farm-
        //   illustrations/ blob. Distinct prompt + path prefix from Pitti
        //   so the two illustration styles never overwrite each other
        //   (Slice 1.1.3a).
        let imageUrl: string
        const seed = hashString(farm.slug)

        if (options.style === 'pitti') {
          const offerings = farm.categories
            .map(c => c.category.name)
            .slice(0, 3)
          const prompt = buildPittiFarmHeaderPrompt(
            farm.county ?? 'rural England',
            offerings.length > 0 ? offerings : ['seasonal produce']
          )
          const targetWidth = 1536
          const targetHeight = 768
          const genHeight = generationHeightFor(targetHeight)

          console.log(`🎨 Generating Pitti Press image (${targetWidth}x${genHeight} → crop to ${targetWidth}x${targetHeight})...`)
          const rawBuffer = await runware.generateBuffer({
            prompt,
            negativePrompt: PITTI_STYLE.negative,
            width: targetWidth,
            height: genHeight,
            seed,
            steps: 28,
            cfgScale: 3.5,
            model: RUNWARE_MODELS.fluxDev,
            outputFormat: 'webp',
          })

          if (!rawBuffer) {
            console.warn(`⚠️  No image generated for ${farm.name}`)
            results.push({ slug: farm.slug, name: farm.name, success: false, error: 'Pitti generation failed' })
            continue
          }

          const cropped = await cropBottomStrip(rawBuffer, targetHeight, 'webp')

          if (!options.upload) {
            // Dry-run: keep the blob upload out of cold storage.
            imageUrl = `<dry-run pitti, ${cropped.byteLength} bytes>`
            console.log(`🔗 Would upload Pitti WebP (${cropped.byteLength} bytes) → pitti-farm-images/${farm.slug}/main.webp`)
          } else {
            const blob = await uploadPittiFarmImage(cropped, farm.slug)
            imageUrl = blob.url
            console.log(`✅ Pitti image uploaded: ${imageUrl}`)
          }
        } else if (options.style === 'apothecary') {
          const offerings = farm.categories
            .map(c => c.category.name)
            .slice(0, 3)
          const prompt = buildApothecaryFarmOfferingsPrompt(
            offerings.length > 0 ? offerings : ['seasonal produce'],
            farm.county ?? 'rural England',
          )
          const targetWidth = 1536
          const targetHeight = 768
          const genHeight = generationHeightFor(targetHeight)

          console.log(`🌿 Generating Apothecary image (${targetWidth}x${genHeight} → crop to ${targetWidth}x${targetHeight})...`)
          const rawBuffer = await runware.generateBuffer({
            prompt,
            negativePrompt: APOTHECARY_STYLE.negative,
            width: targetWidth,
            height: genHeight,
            seed,
            steps: 28,
            cfgScale: 3.5,
            model: RUNWARE_MODELS.fluxDev,
            outputFormat: 'webp',
          })

          if (!rawBuffer) {
            console.warn(`⚠️  No image generated for ${farm.name}`)
            results.push({ slug: farm.slug, name: farm.name, success: false, error: 'Apothecary generation failed' })
            continue
          }

          const cropped = await cropBottomStrip(rawBuffer, targetHeight, 'webp')

          if (!options.upload) {
            imageUrl = `<dry-run apothecary, ${cropped.byteLength} bytes>`
            console.log(`🔗 Would upload Apothecary WebP (${cropped.byteLength} bytes) → apothecary-farm-illustrations/${farm.slug}/main.webp`)
          } else {
            const blob = await uploadApothecaryFarmImage(cropped, farm.slug)
            imageUrl = blob.url
            console.log(`✅ Apothecary image uploaded: ${imageUrl}`)
          }
        } else {
          // Harvest path (unchanged)
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

          console.log(`🎨 Generating Harvest image via Runware...`)
          const result = await runware.generate({
            prompt,
            negativePrompt: HARVEST_STYLE.negative,
            width: 2048,
            height: 1152,
            seed
          })

          if (!result || result.images.length === 0) {
            console.warn(`⚠️  No image generated for ${farm.name}`)
            results.push({ slug: farm.slug, name: farm.name, success: false, error: 'Generation failed' })
            continue
          }

          imageUrl = result.images[0].imageURL
          console.log(`✅ Generated image URL: ${imageUrl}`)
        }

        // Save URL to database.
        // uploadedBy is style-aware so Slice 1.1.3c can suppress only the
        // legacy ai_generator (fake-photo) rows without affecting Pitti
        // or Apothecary illustration rows.
        if (options.upload) {
          const uploadedBy =
            options.style === 'pitti' ? 'ai_pitti' :
            options.style === 'apothecary' ? 'ai_apothecary' :
            'ai_generator'
          const altText =
            options.style === 'apothecary'
              ? `${farm.name} botanical illustration`
              : `${farm.name} farm shop`

          if (existingImageId && options.force && options.style !== 'apothecary') {
            await prisma.image.update({
              where: { id: existingImageId },
              data: {
                url: imageUrl,
                altText,
                uploadedBy,
                status: 'approved',
                isHero: true,
                displayOrder: 0,
              },
            })
            console.log(`✅ Updated existing image row (${existingImageId})`)
          } else {
            await prisma.image.create({
              data: {
                farmId: farm.id,
                url: imageUrl,
                altText,
                uploadedBy,
                status: 'approved',
                isHero: true,
                displayOrder: 0,
              },
            })
            console.log(`✅ Saved to database`)
          }
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
