#!/usr/bin/env tsx

/**
 * Generate AI images for seasonal produce items
 * Usage:
 *   pnpm run generate:produce-images [--produce=slug] [--count=4] [--upload]
 *
 * Examples:
 *   pnpm run generate:produce-images --produce=strawberries --count=2
 *   pnpm run generate:produce-images --produce=sweetcorn --count=4 --upload
 *   pnpm run generate:produce-images --count=4 --upload
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PRODUCE } from '../data/produce'
import { ProduceImageGenerator } from '../lib/produce-image-generator'
import { imageQualityValidator } from '../lib/image-quality-validator'
import { join } from 'path'
import { existsSync } from 'fs'
import { produceImageExists } from '../lib/produce-blob'

const PUBLIC_DIR = join(process.cwd(), 'public', 'images', 'produce')

interface Options {
  produce?: string
  count?: number
  force?: boolean
  upload?: boolean
  month?: number
  validate?: boolean
}

interface GeneratedImage {
  url: string
  variationId: number
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = { count: 4, upload: false, validate: true }

  for (const arg of args) {
    if (arg.startsWith('--produce=')) {
      options.produce = arg.split('=')[1]
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--month=')) {
      options.month = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--upload') {
      options.upload = true
    } else if (arg === '--no-validate') {
      options.validate = false
    }
  }

  return options
}

async function generateImages() {
  const options = parseArgs()
  const generator = new ProduceImageGenerator()

  console.log('🌾 Farm Companion - Produce Image Generator')
  console.log('='.repeat(50))

  // Filter produce items
  const produceItems = options.produce
    ? PRODUCE.filter(p => p.slug === options.produce)
    : PRODUCE

  if (produceItems.length === 0) {
    console.error(`❌ No produce found with slug: ${options.produce}`)
    process.exit(1)
  }

  const mode = options.upload ? 'Upload to Vercel Blob' : 'Local dry-run'
  console.log(`📋 Mode: ${mode}`)
  console.log(`📦 Processing ${produceItems.length} produce items`)
  console.log(`🎨 Creating ${options.count} variations per item`)
  if (!options.upload) {
    console.log('💡 Add --upload flag to upload to Vercel Blob')
  }
  console.log('')

  let successCount = 0
  let errorCount = 0
  const generatedData: Record<string, GeneratedImage[]> = {}

  for (const produce of produceItems) {
    const itemNumber = produceItems.indexOf(produce) + 1
    console.log(`\n[${itemNumber}/${produceItems.length}] Processing: ${produce.name} (${produce.slug})`)
    console.log('-'.repeat(50))

    try {
      // Check if images already exist (for upload mode)
      if (options.upload && !options.force) {
        const existingCount = await checkExistingImages(produce.slug, options.count!)
        if (existingCount > 0) {
          console.log(`⏭️  Skipping - ${existingCount} images already exist in blob storage`)
          console.log(`   Use --force to regenerate`)
          continue
        }
      }

      // Generate variations
      console.log(`🎨 Generating ${options.count} variations${options.month ? ` (month ${options.month})` : ''}...`)
      const buffers = await generator.generateVariations(
        produce.name,
        produce.slug,
        options.count,
        options.month
      )

      if (buffers.length === 0) {
        console.warn(`⚠️  No images generated for ${produce.name}`)
        errorCount++
        continue
      }

      console.log(`✅ Generated ${buffers.length} image buffers`)

      // Validate image quality
      if (options.validate) {
        console.log(`🔍 Validating image quality...`)
        const qualityResults = await imageQualityValidator.validateBatch(buffers)
        const summary = imageQualityValidator.getBatchSummary(qualityResults)

        console.log(`   Pass rate: ${summary.passRate.toFixed(1)}%`)
        console.log(`   Avg confidence: ${summary.avgConfidence.toFixed(1)}%`)

        // Show warnings for failed validations
        qualityResults.forEach((result, i) => {
          if (!result.passed) {
            console.warn(`   ⚠️  Image ${i + 1} failed: ${result.errors.join(', ')}`)
          } else if (result.warnings.length > 0) {
            console.warn(`   ⚠️  Image ${i + 1} warnings: ${result.warnings.join(', ')}`)
          }
        })

        if (summary.passRate < 100) {
          console.warn(`   ${summary.failed} images failed quality checks`)
        }
      }

      // Upload or save images
      if (options.upload) {
        console.log(`📤 Uploading to Vercel Blob...`)
        const urls: GeneratedImage[] = []

        for (let i = 0; i < buffers.length; i++) {
          const variationId = i + 1
          console.log(`  [${variationId}/${buffers.length}] Uploading variation ${variationId}...`)

          const url = await generator.uploadImage(
            buffers[i],
            produce.slug,
            variationId,
            produce.name,
            options.force || false
          )

          urls.push({ url, variationId })
        }

        generatedData[produce.slug] = urls
        console.log(`✅ Uploaded ${urls.length} images for ${produce.name}`)
      } else {
        // Dry-run: save to local filesystem
        for (let i = 0; i < buffers.length; i++) {
          const filename = `${produce.slug}-${i + 1}.jpg`
          const filepath = join(PUBLIC_DIR, filename)
          await generator.saveImage(buffers[i], filepath)
        }
        console.log(`✅ Saved ${buffers.length} images locally`)
      }

      successCount++
    } catch (error: any) {
      console.error(`❌ Failed to process ${produce.name}:`, error.message)
      errorCount++
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Success: ${successCount} produce items`)
  console.log(`❌ Errors: ${errorCount} produce items`)

  // Output TypeScript snippets for uploaded images
  if (options.upload && Object.keys(generatedData).length > 0) {
    console.log('\n' + '='.repeat(50))
    console.log('📝 TYPESCRIPT OUTPUT FOR produce.ts')
    console.log('='.repeat(50))
    console.log('\nCopy and paste the following into src/data/produce.ts:\n')

    for (const [slug, images] of Object.entries(generatedData)) {
      const produce = produceItems.find(p => p.slug === slug)
      console.log(`  // ${produce?.name}`)
      console.log(`  images: [`)
      for (const img of images) {
        console.log(`    { src: '${img.url}', alt: 'Fresh ${produce?.name.toLowerCase()}' },`)
      }
      console.log(`  ],\n`)
    }
  }

  // Next steps
  console.log('\n💡 NEXT STEPS:')
  if (options.upload) {
    console.log('   1. Copy TypeScript snippets above into src/data/produce.ts')
    console.log('   2. Update alt text for better accessibility')
    console.log('   3. Run pnpm build to verify')
    console.log('   4. Commit changes to Git')
  } else {
    console.log('   1. Review generated images in public/images/produce/')
    console.log('   2. Run with --upload flag to upload to Vercel Blob')
    console.log('   3. Update produce.ts with generated URLs')
  }
}

async function checkExistingImages(slug: string, count: number): Promise<number> {
  let existingCount = 0
  for (let i = 1; i <= count; i++) {
    const exists = await produceImageExists(slug, i)
    if (exists) existingCount++
  }
  return existingCount
}

// Run the script
generateImages().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
