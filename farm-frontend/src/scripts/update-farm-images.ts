#!/usr/bin/env tsx
/**
 * Update Farm Images Script
 *
 * Regenerates farm images with new prompts that exclude church spires
 * and National Geographic watermarks. Automatically updates database.
 *
 * Usage:
 *   pnpm tsx src/scripts/update-farm-images.ts
 *   pnpm tsx src/scripts/update-farm-images.ts --dry-run
 *   pnpm tsx src/scripts/update-farm-images.ts --limit=10
 *   pnpm tsx src/scripts/update-farm-images.ts --slug=darts-farm
 *   pnpm tsx src/scripts/update-farm-images.ts --force  # Regenerate even if images exist
 */

import { prisma } from '../lib/prisma'
import { FarmImageGenerator } from '../lib/farm-image-generator'
import { uploadFarmImage } from '../lib/farm-blob'

interface ImageResult {
  slug: string
  name: string
  url: string | null
  success: boolean
  error?: string
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const slugArg = args.find(a => a.startsWith('--slug='))
  const targetSlug = slugArg ? slugArg.split('=')[1] : null
  const limitArg = args.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50

  console.log('========================================')
  console.log('Update Farm Images')
  console.log('========================================')
  console.log('')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will upload and save)'}`)
  console.log(`Force: ${force ? 'YES (regenerate all)' : 'NO (skip existing)'}`)
  console.log(`Target: ${targetSlug || `Up to ${limit} farms`}`)
  console.log('')

  try {
    // Build query
    const where: any = {
      status: 'active'
    }

    if (targetSlug) {
      where.slug = targetSlug
    } else if (!force) {
      // Only farms without approved AI-generated images
      where.images = {
        none: {
          status: 'approved',
          uploadedBy: 'ai_generator'
        }
      }
    }

    // Query farms
    const farms = await prisma.farm.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        county: true,
        images: {
          where: {
            status: 'approved',
            uploadedBy: 'ai_generator'
          }
        }
      },
      take: targetSlug ? undefined : limit,
      orderBy: { name: 'asc' }
    })

    console.log(`Found ${farms.length} farms to process`)
    console.log('')

    if (farms.length === 0) {
      console.log('No farms need image generation.')
      console.log('Use --force to regenerate existing images.')
      process.exit(0)
    }

    const generator = new FarmImageGenerator()
    const results: ImageResult[] = []

    for (const farm of farms) {
      console.log(`----------------------------------------`)
      console.log(`Processing: ${farm.name} (${farm.slug})`)
      console.log(`County: ${farm.county || 'Unknown'}`)
      console.log(`Existing AI images: ${farm.images.length}`)
      console.log(`----------------------------------------`)

      try {
        if (dryRun) {
          console.log(`[DRY RUN] Would generate image for ${farm.name}`)
          results.push({
            slug: farm.slug,
            name: farm.name,
            url: null,
            success: true
          })
          continue
        }

        // Generate image
        console.log('  Generating image...')
        const buffer = await generator.generateFarmImage(
          farm.name,
          farm.slug,
          { county: farm.county || 'England' }
        )

        if (!buffer) {
          throw new Error('Image generation returned null')
        }

        console.log(`  Generated: ${buffer.length} bytes`)

        // Upload to Vercel Blob
        console.log('  Uploading to Vercel Blob...')
        const { url } = await uploadFarmImage(buffer, farm.slug, {
          allowOverwrite: true
        })

        console.log(`  Uploaded: ${url}`)

        // Delete existing AI-generated images if force mode
        if (force && farm.images.length > 0) {
          console.log(`  Removing ${farm.images.length} old AI images...`)
          await prisma.image.deleteMany({
            where: {
              farmId: farm.id,
              uploadedBy: 'ai_generator'
            }
          })
        }

        // Create database record
        console.log('  Creating database record...')
        await prisma.image.create({
          data: {
            farmId: farm.id,
            url: url,
            altText: `${farm.name} farm shop`,
            uploadedBy: 'ai_generator',
            status: 'approved',
            displayOrder: 0,
            isHero: true
          }
        })

        results.push({
          slug: farm.slug,
          name: farm.name,
          url: url,
          success: true
        })

        console.log(`  SUCCESS: ${farm.name}`)
        console.log('')

        // Rate limiting between farms
        await sleep(2000)

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`  FAILED: ${message}`)
        results.push({
          slug: farm.slug,
          name: farm.name,
          url: null,
          success: false,
          error: message
        })
      }
    }

    // Summary
    console.log('')
    console.log('========================================')
    console.log('GENERATION SUMMARY')
    console.log('========================================')

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    console.log(`Total processed: ${results.length}`)
    console.log(`Successful: ${successful.length}`)
    console.log(`Failed: ${failed.length}`)
    console.log('')

    if (failed.length > 0) {
      console.log('Failed farms:')
      failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`))
      console.log('')
    }

    if (successful.length > 0 && !dryRun) {
      console.log('Successfully updated farms:')
      successful.forEach(s => {
        if (s.url) {
          console.log(`  - ${s.name}: ${s.url}`)
        }
      })
    }

    // Check if more farms need processing
    if (!targetSlug && farms.length === limit) {
      const remaining = await prisma.farm.count({
        where: {
          status: 'active',
          images: {
            none: {
              status: 'approved',
              uploadedBy: 'ai_generator'
            }
          }
        }
      })

      if (remaining > 0) {
        console.log('')
        console.log(`NOTE: ${remaining} more farms may need images.`)
        console.log('Run the script again to continue processing.')
      }
    }

  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run
main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
