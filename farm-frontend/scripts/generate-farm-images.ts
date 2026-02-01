#!/usr/bin/env npx tsx
/**
 * Batch Farm Image Generator
 *
 * Generates AI images for all farms using Runware and saves URLs directly to database.
 * No storage layer needed - Runware URLs are CDN-backed and persistent.
 *
 * Usage:
 *   npx tsx scripts/generate-farm-images.ts [options]
 *
 * Options:
 *   --limit N       Process only N farms (default: all)
 *   --offset N      Start from farm N (default: 0)
 *   --force         Regenerate existing images
 *   --dry-run       Test without database writes
 *   --batch-size N  Process N farms per batch (default: 50)
 *   --delay N       Delay between images in ms (default: 1500)
 *   --resume        Resume from last checkpoint
 *
 * Environment:
 *   DATABASE_URL    PostgreSQL connection string
 *   RUNWARE_API_KEY Runware API key
 */

// Load environment variables
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const CONFIG = {
  checkpointFile: path.join(process.cwd(), '.farm-image-checkpoint.json'),
  defaultBatchSize: 50,
  defaultDelay: 1500,
  costPerImage: 0.0096
}

interface Checkpoint {
  lastProcessedIndex: number
  processedSlugs: string[]
  startedAt: string
  lastUpdatedAt: string
  stats: GenerationStats
}

interface GenerationStats {
  total: number
  processed: number
  generated: number
  skipped: number
  failed: number
  estimatedCost: number
}

interface FarmRecord {
  id: string
  name: string
  slug: string
  county: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    limit: undefined as number | undefined,
    offset: 0,
    force: false,
    dryRun: false,
    batchSize: CONFIG.defaultBatchSize,
    delay: CONFIG.defaultDelay,
    resume: false
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit': options.limit = parseInt(args[++i], 10); break
      case '--offset': options.offset = parseInt(args[++i], 10); break
      case '--force': options.force = true; break
      case '--dry-run': options.dryRun = true; break
      case '--batch-size': options.batchSize = parseInt(args[++i], 10); break
      case '--delay': options.delay = parseInt(args[++i], 10); break
      case '--resume': options.resume = true; break
      case '--help':
        console.log(`
Farm Image Generator - Generate AI images for all farms

Usage: npx tsx scripts/generate-farm-images.ts [options]

Options:
  --limit N       Process only N farms (default: all)
  --offset N      Start from farm N (default: 0)
  --force         Regenerate existing images
  --dry-run       Test without database writes
  --batch-size N  Process N farms per batch (default: 50)
  --delay N       Delay between images in ms (default: 1500)
  --resume        Resume from last checkpoint
  --help          Show this help message
        `)
        process.exit(0)
    }
  }
  return options
}

function loadCheckpoint(): Checkpoint | null {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.checkpointFile, 'utf-8'))
    }
  } catch (error) {
    console.warn('Failed to load checkpoint:', error)
  }
  return null
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  checkpoint.lastUpdatedAt = new Date().toISOString()
  fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2))
}

function clearCheckpoint(): void {
  if (fs.existsSync(CONFIG.checkpointFile)) fs.unlinkSync(CONFIG.checkpointFile)
}

function displayProgress(stats: GenerationStats, currentFarm: string): void {
  const percent = ((stats.processed / stats.total) * 100).toFixed(1)
  const bar = '='.repeat(Math.floor(stats.processed / stats.total * 40))
  const empty = ' '.repeat(40 - bar.length)
  process.stdout.write(
    `\r[${bar}${empty}] ${percent}% | ` +
    `${stats.processed}/${stats.total} | ` +
    `Gen: ${stats.generated} Skip: ${stats.skipped} Fail: ${stats.failed} | ` +
    `$${stats.estimatedCost.toFixed(2)} | ` +
    `${currentFarm.substring(0, 25).padEnd(25)}`
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateFarmImages(): Promise<void> {
  const options = parseArgs()
  const prisma = new PrismaClient()

  console.log('\n=== Farm Image Generator (Direct URL Mode) ===\n')
  console.log('Configuration:')
  console.log(`  Limit: ${options.limit ?? 'all'}`)
  console.log(`  Offset: ${options.offset}`)
  console.log(`  Force regenerate: ${options.force}`)
  console.log(`  Dry run: ${options.dryRun}`)
  console.log(`  Batch size: ${options.batchSize}`)
  console.log(`  Delay: ${options.delay}ms`)
  console.log(`  Resume: ${options.resume}`)
  console.log('')

  // Import generator
  const { FarmImageGenerator } = await import('../src/lib/farm-image-generator')
  const generator = new FarmImageGenerator()

  try {
    const totalCount = await prisma.farm.count({ where: { status: 'active' } })
    console.log(`Total active farms in database: ${totalCount}`)

    let checkpoint: Checkpoint | null = null
    let startIndex = options.offset

    if (options.resume) {
      checkpoint = loadCheckpoint()
      if (checkpoint) {
        startIndex = checkpoint.lastProcessedIndex + 1
        console.log(`Resuming from checkpoint at index ${startIndex}`)
      }
    }

    const stats: GenerationStats = checkpoint?.stats ?? {
      total: options.limit ? Math.min(options.limit, totalCount - options.offset) : totalCount - options.offset,
      processed: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
      estimatedCost: 0
    }

    if (!checkpoint) {
      checkpoint = {
        lastProcessedIndex: startIndex - 1,
        processedSlugs: [],
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        stats
      }
    }

    let currentOffset = startIndex
    const endIndex = options.limit ? startIndex + options.limit : totalCount

    console.log(`\nProcessing farms ${startIndex} to ${endIndex - 1}...`)
    console.log('Press Ctrl+C to pause (progress will be saved)\n')

    let shouldStop = false
    process.on('SIGINT', () => {
      console.log('\n\nReceived interrupt signal. Saving checkpoint...')
      shouldStop = true
    })

    while (currentOffset < endIndex && !shouldStop) {
      const batchSize = Math.min(options.batchSize, endIndex - currentOffset)

      const farms: FarmRecord[] = await prisma.farm.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, slug: true, county: true },
        orderBy: { createdAt: 'asc' },
        skip: currentOffset,
        take: batchSize
      })

      if (farms.length === 0) break

      for (const farm of farms) {
        if (shouldStop) break

        displayProgress(stats, farm.name)

        try {
          // Check if hero image already exists
          if (!options.force) {
            const existingHero = await prisma.image.findFirst({
              where: { farmId: farm.id, isHero: true, status: 'approved' }
            })
            if (existingHero) {
              stats.skipped++
              stats.processed++
              checkpoint.processedSlugs.push(farm.slug)
              checkpoint.lastProcessedIndex = currentOffset
              checkpoint.stats = stats
              if (stats.processed % 10 === 0) saveCheckpoint(checkpoint)
              currentOffset++
              continue
            }
          }

          // Generate image and get URL directly
          const imageUrl = await generator.generateFarmImageUrl(
            farm.name,
            farm.slug,
            { county: farm.county }
          )

          if (imageUrl) {
            if (!options.dryRun) {
              // Check if hero image already exists
              const existingHero = await prisma.image.findFirst({
                where: { farmId: farm.id, isHero: true }
              })

              if (existingHero) {
                await prisma.image.update({
                  where: { id: existingHero.id },
                  data: {
                    url: imageUrl,
                    altText: `${farm.name} - British farm shop in ${farm.county}`,
                    status: 'approved'
                  }
                })
              } else {
                await prisma.image.create({
                  data: {
                    farmId: farm.id,
                    url: imageUrl,
                    altText: `${farm.name} - British farm shop in ${farm.county}`,
                    isHero: true,
                    displayOrder: 0,
                    uploadedBy: 'admin',
                    status: 'approved'
                  }
                })
              }
            }

            stats.generated++
            stats.estimatedCost += CONFIG.costPerImage
          } else {
            stats.failed++
          }
        } catch (error) {
          console.error(`\nError processing ${farm.slug}:`, error)
          stats.failed++
        }

        stats.processed++
        checkpoint.processedSlugs.push(farm.slug)
        checkpoint.lastProcessedIndex = currentOffset
        checkpoint.stats = stats

        if (stats.processed % 10 === 0) saveCheckpoint(checkpoint)
        currentOffset++
        await sleep(options.delay)
      }
    }

    saveCheckpoint(checkpoint)

    console.log('\n\n=== Generation Complete ===\n')
    console.log(`Total processed: ${stats.processed}`)
    console.log(`Generated: ${stats.generated}`)
    console.log(`Skipped (existing): ${stats.skipped}`)
    console.log(`Failed: ${stats.failed}`)
    console.log(`Estimated cost: $${stats.estimatedCost.toFixed(4)}`)

    if (shouldStop) {
      console.log('\nGeneration paused. Run with --resume to continue.')
    } else {
      clearCheckpoint()
      console.log('\nAll farms processed successfully!')
    }
  } finally {
    await prisma.$disconnect()
  }
}

generateFarmImages().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
