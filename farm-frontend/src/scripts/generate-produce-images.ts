#!/usr/bin/env tsx

/**
 * Generate AI images for seasonal produce items
 * Usage:
 *   pnpm run generate:produce-images [--produce=slug] [--count=4] [--upload] [--append]
 *
 * Options:
 *   --produce=slug  Generate images for a specific produce item only
 *   --count=N       Number of images per item (1-4, default: 4)
 *   --upload        Upload to Vercel Blob and update produce.ts
 *   --append        Only generate missing shots (2, 3, 4) for items that already have shot 1
 *   --force         Regenerate even if images already exist
 *
 * Examples:
 *   pnpm run generate:produce-images --produce=strawberries --count=2
 *   pnpm run generate:produce-images --produce=sweetcorn --count=4 --upload
 *   pnpm run generate:produce-images --count=4 --upload
 *   pnpm run generate:produce-images --append --upload  # Add shots 2-4 to existing items
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
  append?: boolean
}

interface GeneratedImage {
  url: string
  variationId: number
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = { count: 4, upload: false, append: false }

  for (const arg of args) {
    if (arg.startsWith('--produce=')) {
      options.produce = arg.split('=')[1]
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--upload') {
      options.upload = true
    } else if (arg === '--append') {
      options.append = true
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
  const appendMode = options.append ? ' (append mode - adding missing shots)' : ''
  console.log(`📋 Mode: ${mode}${appendMode}`)
  console.log(`📦 Processing ${produceItems.length} produce items`)
  if (options.append) {
    console.log(`🎨 Adding missing shots (2-4) to items with existing shot 1`)
  } else {
    console.log(`🎨 Creating ${options.count} variations per item`)
  }
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
      // Determine which shots to generate
      let shotsToGenerate: number[] = []

      if (options.append) {
        // Append mode: find missing shots (2, 3, 4)
        const existingShots = await findExistingShots(produce.slug, 4)
        const allShots = [1, 2, 3, 4]
        shotsToGenerate = allShots.filter(s => !existingShots.includes(s) && s <= options.count!)

        if (shotsToGenerate.length === 0) {
          console.log(`⏭️  Skipping - all shots already exist`)
          continue
        }
        console.log(`📸 Missing shots: ${shotsToGenerate.join(', ')}`)
        console.log(`   Existing shots: ${existingShots.length > 0 ? existingShots.join(', ') : 'none'}`)
      } else {
        // Normal mode: check if we should skip entirely
        if (options.upload && !options.force) {
          const existingCount = await checkExistingImages(produce.slug, options.count!)
          if (existingCount > 0) {
            console.log(`⏭️  Skipping - ${existingCount} images already exist in blob storage`)
            console.log(`   Use --force to regenerate`)
            continue
          }
        }
        // Generate all requested shots
        shotsToGenerate = Array.from({ length: options.count! }, (_, i) => i + 1)
      }

      // Generate images for the required shots
      const buffers: Array<{ buffer: Buffer; variationId: number }> = []

      if (options.append) {
        // Append mode: generate specific shots one by one
        console.log(`🎨 Generating ${shotsToGenerate.length} missing shots...`)
        for (const variationId of shotsToGenerate) {
          const shotName = getShotTypeName(variationId)
          console.log(`  [${variationId}/4] Generating ${shotName}...`)
          const buffer = await generator.generateSpecificShot(
            produce.name,
            produce.slug,
            variationId
          )
          if (buffer) {
            buffers.push({ buffer, variationId })
          }
        }
      } else {
        // Normal mode: generate all variations at once
        console.log(`🎨 Generating ${options.count} variations...`)
        const allBuffers = await generator.generateVariations(
          produce.name,
          produce.slug,
          options.count
        )
        allBuffers.forEach((buffer, i) => {
          buffers.push({ buffer, variationId: i + 1 })
        })
      }

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

        for (const { buffer, variationId } of buffers) {
          const shotName = getShotTypeName(variationId)
          console.log(`  [${variationId}/4] Uploading ${shotName}...`)

          const url = await generator.uploadImage(
            buffer,
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
        for (const { buffer, variationId } of buffers) {
          const filename = `${produce.slug}-${variationId}.jpg`
          const filepath = join(PUBLIC_DIR, filename)
          await generator.saveImage(buffer, filepath)
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
    const updated = updateProduceTs(generatedData, produceItems, options.append)

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
 * Find which shot numbers already exist for a produce item
 */
async function findExistingShots(slug: string, maxShots: number): Promise<number[]> {
  const existingShots: number[] = []
  for (let i = 1; i <= maxShots; i++) {
    const exists = await produceImageExists(slug, i)
    if (exists) existingShots.push(i)
  }
  return existingShots
}

/**
 * Get human-readable shot type name
 */
function getShotTypeName(variationId: number): string {
  const names: Record<number, string> = {
    1: 'Hero',
    2: 'Cross-section',
    3: 'Macro',
    4: 'Composition'
  }
  return names[variationId] || `Shot ${variationId}`
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
 * Parse existing images from produce.ts for a given slug
 */
function parseExistingImages(content: string, slug: string): Array<{ src: string; alt: string; variationId?: number }> {
  // Match the images array for this slug
  const slugPattern = new RegExp(
    `slug:\\s*['"]${slug}['"][\\s\\S]*?images:\\s*\\[([\\s\\S]*?)\\]`,
    'm'
  )

  const match = content.match(slugPattern)
  if (!match) return []

  const imagesContent = match[1]
  const images: Array<{ src: string; alt: string; variationId?: number }> = []

  // Parse each image object
  const imageRegex = /\{\s*src:\s*['"]([^'"]+)['"]\s*,\s*alt:\s*['"]([^'"]+)['"]\s*\}/g
  let imageMatch
  let index = 1

  while ((imageMatch = imageRegex.exec(imagesContent)) !== null) {
    images.push({
      src: imageMatch[1],
      alt: imageMatch[2],
      variationId: index++
    })
  }

  return images
}

/**
 * Automatically update produce.ts with new image URLs
 * In append mode, merges new images with existing ones
 */
function updateProduceTs(
  generatedData: Record<string, GeneratedImage[]>,
  produceItems: typeof PRODUCE,
  appendMode: boolean = false
): boolean {
  if (Object.keys(generatedData).length === 0) {
    return false
  }

  try {
    console.log('\n📝 Updating src/data/produce.ts automatically...')

    let content = readFileSync(PRODUCE_TS_PATH, 'utf-8')
    let updatedCount = 0

    for (const [slug, newImages] of Object.entries(generatedData)) {
      const produce = produceItems.find(p => p.slug === slug)
      if (!produce) continue

      let finalImages: Array<{ src: string; alt: string; variationId: number }>

      if (appendMode) {
        // Append mode: merge new images with existing ones
        const existingImages = parseExistingImages(content, slug)
        const imageMap = new Map<number, { src: string; alt: string }>()

        // Add existing images to map
        existingImages.forEach((img, index) => {
          const variationId = img.variationId || (index + 1)
          imageMap.set(variationId, { src: img.src, alt: img.alt })
        })

        // Add/update with new images
        newImages.forEach(img => {
          const alt = getAltTextForShot(produce.name, img.variationId)
          imageMap.set(img.variationId, { src: img.url, alt })
        })

        // Convert map to sorted array
        finalImages = Array.from(imageMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([variationId, { src, alt }]) => ({ src, alt, variationId }))

        console.log(`   📸 Merged: ${existingImages.length} existing + ${newImages.length} new = ${finalImages.length} total`)
      } else {
        // Replace mode: use only new images
        finalImages = newImages.map(img => ({
          src: img.url,
          alt: getAltTextForShot(produce.name, img.variationId),
          variationId: img.variationId
        }))
      }

      // Build the images array string
      const imagesArrayStr = finalImages
        .map(img => `      { src: '${img.src}', alt: '${img.alt}' }`)
        .join(',\n')

      // Find and replace the images array for this produce
      const slugPattern = new RegExp(
        `(slug:\\s*['"]${slug}['"][\\s\\S]*?images:\\s*\\[)[\\s\\S]*?(\\],)`,
        'm'
      )

      if (slugPattern.test(content)) {
        content = content.replace(slugPattern, `$1\n${imagesArrayStr},\n    $2`)
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
