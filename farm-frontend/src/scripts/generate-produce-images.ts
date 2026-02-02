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
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { produceImageExists } from '../lib/produce-blob'

const PUBLIC_DIR = join(process.cwd(), 'public', 'images', 'produce')
const PRODUCE_TS_PATH = join(process.cwd(), 'src', 'data', 'produce.ts')

interface Options {
  produce?: string
  count?: number
  force?: boolean
  upload?: boolean
}

interface GeneratedImage {
  url: string
  variationId: number
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = { count: 4, upload: false }

  for (const arg of args) {
    if (arg.startsWith('--produce=')) {
      options.produce = arg.split('=')[1]
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--upload') {
      options.upload = true
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
      console.log(`🎨 Generating ${options.count} variations...`)
      const buffers = await generator.generateVariations(
        produce.name,
        produce.slug,
        options.count
      )

      if (buffers.length === 0) {
        console.warn(`⚠️  No images generated for ${produce.name}`)
        errorCount++
        continue
      }

      console.log(`✅ Generated ${buffers.length} image buffers`)

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

  // Automatically update produce.ts with new image URLs
  if (options.upload && Object.keys(generatedData).length > 0) {
    const updated = updateProduceTs(generatedData, produceItems)

    if (updated) {
      console.log('\n💡 NEXT STEPS:')
      console.log('   1. Review changes: git diff src/data/produce.ts')
      console.log('   2. Run pnpm build to verify')
      console.log('   3. Commit changes to Git')
    }
  } else if (!options.upload) {
    console.log('\n💡 NEXT STEPS:')
    console.log('   1. Review generated images in public/images/produce/')
    console.log('   2. Run with --upload flag to upload to Vercel Blob and auto-update produce.ts')
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

/**
 * Generate descriptive alt text for each shot type
 * Creates distinct descriptions for accessibility and SEO
 */
function getAltTextForShot(produceName: string, variationId: number): string {
  const name = produceName.toLowerCase()
  const shotAlts: Record<number, string> = {
    1: `Fresh British ${name} - beautiful whole specimen`,
    2: `${produceName} cross-section showing fresh interior`,
    3: `${produceName} macro detail - natural texture close-up`,
    4: `Artistic arrangement of fresh ${name}`
  }
  return shotAlts[variationId] || `Fresh ${name}`
}

/**
 * Automatically update produce.ts with new image URLs
 */
function updateProduceTs(
  generatedData: Record<string, GeneratedImage[]>,
  produceItems: typeof PRODUCE
): boolean {
  if (Object.keys(generatedData).length === 0) {
    return false
  }

  try {
    console.log('\n📝 Updating src/data/produce.ts automatically...')

    let content = readFileSync(PRODUCE_TS_PATH, 'utf-8')
    let updatedCount = 0

    for (const [slug, images] of Object.entries(generatedData)) {
      const produce = produceItems.find(p => p.slug === slug)
      if (!produce) continue

      // Build the new images array with distinct alt text per shot type
      const newImagesArray = images
        .map(img => {
          const alt = getAltTextForShot(produce.name, img.variationId)
          return `      { src: '${img.url}', alt: '${alt}' }`
        })
        .join(',\n')

      // Find and replace the images array for this produce
      // Match: images: [ ... ], (with multiline content)
      const slugPattern = new RegExp(
        `(slug:\\s*['"]${slug}['"][\\s\\S]*?images:\\s*\\[)[\\s\\S]*?(\\],)`,
        'm'
      )

      if (slugPattern.test(content)) {
        content = content.replace(slugPattern, `$1\n${newImagesArray},\n    $2`)
        updatedCount++
        console.log(`   ✅ Updated images for ${produce.name}`)
      } else {
        console.log(`   ⚠️  Could not find images array for ${slug}`)
      }
    }

    if (updatedCount > 0) {
      writeFileSync(PRODUCE_TS_PATH, content, 'utf-8')
      console.log(`\n✅ Successfully updated ${updatedCount} produce entries in produce.ts`)
      return true
    }

    return false
  } catch (error: any) {
    console.error(`\n❌ Failed to update produce.ts: ${error.message}`)
    return false
  }
}

// Run the script
generateImages().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
