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
import { FarmImageGenerator } from '../lib/farm-image-generator'
import { uploadFarmImage, farmImageExists } from '../lib/farm-blob'
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

async function generateFarmImages() {
  const options = parseArgs()
  const generator = new FarmImageGenerator()

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

    const mode = options.upload ? 'Upload to Vercel Blob' : 'Local dry-run'
    console.log(`📋 Mode: ${mode}`)
    console.log(`📦 Processing ${farms.length} farms without images`)
    if (!options.upload) {
      console.log('💡 Add --upload flag to upload to Vercel Blob')
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
        // Check if AI image already exists in blob (for upload mode)
        if (options.upload && !options.force) {
          const exists = await farmImageExists(farm.slug)
          if (exists) {
            console.log(`⏭️  Skipping - AI image already exists in blob storage`)
            console.log(`   Use --force to regenerate`)
            results.push({ slug: farm.slug, name: farm.name, success: true })
            continue
          }
        }

        // Generate image
        console.log(`🎨 Generating AI image...`)
        const buffer = await generator.generateFarmImage(farm.name, farm.slug, {
          county: farm.county
        })

        if (!buffer) {
          console.warn(`⚠️  No image generated for ${farm.name}`)
          results.push({ slug: farm.slug, name: farm.name, success: false, error: 'Generation failed' })
          continue
        }

        console.log(`✅ Generated image buffer (${Math.round(buffer.length / 1024)}KB)`)

        // Upload or save
        if (options.upload) {
          console.log(`📤 Uploading to Vercel Blob...`)
          const { url } = await uploadFarmImage(buffer, farm.slug, {
            farmName: farm.name,
            generatedAt: new Date().toISOString(),
            allowOverwrite: options.force
          })

          // Update farm in database with new image
          await prisma.image.create({
            data: {
              farmId: farm.id,
              url: url,
              altText: `${farm.name} farm shop`,
              uploadedBy: 'ai_generator',
              status: 'approved',
              displayOrder: 0
            }
          })

          console.log(`✅ Uploaded and saved to database`)
          console.log(`   URL: ${url}`)
          results.push({ slug: farm.slug, name: farm.name, url, success: true })
        } else {
          // Dry-run: save locally
          if (!existsSync(PUBLIC_DIR)) {
            await mkdir(PUBLIC_DIR, { recursive: true })
          }
          const filepath = join(PUBLIC_DIR, `${farm.slug}.webp`)
          await writeFile(filepath, buffer)
          console.log(`✅ Saved locally: ${filepath}`)
          results.push({ slug: farm.slug, name: farm.name, success: true })
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
