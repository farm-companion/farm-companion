#!/usr/bin/env tsx
/**
 * Generate AI images for farms - Direct URL Mode
 *
 * This script generates images using Runware and stores the URLs directly
 * in the farms.imageUrl column (no Vercel Blob needed).
 *
 * After running, use migrate-image-urls.ts to create Image table records.
 *
 * Usage:
 *   npx tsx scripts/generate-farm-images-direct.ts [options]
 *
 * Options:
 *   --limit=N       Number of farms to process (default: 50)
 *   --offset=N      Skip first N farms (for pagination)
 *   --dry-run       Preview without making changes
 *   --force         Regenerate even if imageUrl exists
 *   --resume        Continue from last successful farm
 *   --batch-size=N  Farms per batch (default: 50)
 *   --delay=N       Delay between requests in ms (default: 1500)
 *
 * Examples:
 *   npx tsx scripts/generate-farm-images-direct.ts --limit=10
 *   npx tsx scripts/generate-farm-images-direct.ts --resume
 *   npx tsx scripts/generate-farm-images-direct.ts --dry-run --limit=5
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient, Prisma } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()
const RUNWARE_API_URL = 'https://api.runware.ai/v1'
const PROGRESS_FILE = resolve(process.cwd(), '.farm-image-progress.json')
const COST_PER_IMAGE = 0.0096 // Runware Flux.2 cost estimate

interface Options {
  limit: number
  offset: number
  dryRun: boolean
  force: boolean
  resume: boolean
  batchSize: number
  delay: number
}

interface Progress {
  lastProcessedId: string | null
  totalProcessed: number
  totalGenerated: number
  totalSkipped: number
  totalFailed: number
  failedFarms: string[]
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {
    limit: 50,
    offset: 0,
    dryRun: false,
    force: false,
    resume: false,
    batchSize: 50,
    delay: 1500
  }

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10) || 50
    } else if (arg.startsWith('--offset=')) {
      options.offset = parseInt(arg.split('=')[1], 10) || 0
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10) || 50
    } else if (arg.startsWith('--delay=')) {
      options.delay = parseInt(arg.split('=')[1], 10) || 1500
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--resume') {
      options.resume = true
    }
  }

  return options
}

async function loadProgress(): Promise<Progress> {
  try {
    if (existsSync(PROGRESS_FILE)) {
      const content = await readFile(PROGRESS_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch {
    // Ignore errors
  }
  return {
    lastProcessedId: null,
    totalProcessed: 0,
    totalGenerated: 0,
    totalSkipped: 0,
    totalFailed: 0,
    failedFarms: []
  }
}

async function saveProgress(progress: Progress): Promise<void> {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2))
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

// UK regional architectural characteristics for prompt variety
const REGIONAL_STYLES: Record<string, string> = {
  'Cornwall': 'Cornish stone farmhouse, coastal landscape, slate roof',
  'Devon': 'Devon cob cottage, rolling green hills, thatched roof',
  'Somerset': 'Somerset farmstead, orchard backdrop, cider country',
  'Dorset': 'Dorset flint building, chalk downs, wildflower meadow',
  'Kent': 'Kent oast house, hop garden, fruit orchard',
  'Sussex': 'Sussex barn conversion, South Downs, weatherboard',
  'Surrey': 'Surrey farmhouse, woodland edge, brick and timber',
  'Hampshire': 'Hampshire country store, chalk stream, thatched village',
  'Wiltshire': 'Wiltshire stone building, Cotswold style, rolling plains',
  'Gloucestershire': 'Cotswold stone farmshop, honey-colored walls, dry stone walls',
  'Oxfordshire': 'Oxfordshire barn, limestone, pastoral countryside',
  'default': 'traditional British farmshop, rustic stone building, countryside setting'
}

function getRegionalStyle(county: string): string {
  return REGIONAL_STYLES[county] || REGIONAL_STYLES['default']
}

async function generateFarmImage(
  farmName: string,
  county: string,
  apiKey: string
): Promise<string | null> {
  const regionalStyle = getRegionalStyle(county)
  const seed = hashString(farmName + county)

  const prompt = `Professional editorial photograph of ${farmName}, ${regionalStyle}, morning golden hour light, welcoming farm shop entrance, fresh produce display visible, British countryside, 35mm lens f/2.8, shallow depth of field, magazine quality photography`

  const negativePrompt = 'people, faces, text, watermarks, logos, AI artifacts, cartoon, illustration, 3D render, oversaturated, plastic, artificial'

  const payload = {
    taskType: 'imageInference',
    taskUUID: crypto.randomUUID(),
    model: 'rundiffusion:130@100', // Juggernaut Pro Flux
    positivePrompt: prompt,
    negativePrompt: negativePrompt,
    width: 2048,
    height: 1152, // 16:9 aspect ratio
    seed: seed,
    steps: 50,
    CFGScale: 3.0,
    scheduler: 'FlowMatchEulerDiscreteScheduler',
    outputFormat: 'webp',
    numberResults: 1,
    rawMode: true
  }

  try {
    const response = await axios.post(
      RUNWARE_API_URL,
      [payload],
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    )

    const results = response.data?.data || response.data
    if (!Array.isArray(results) || results.length === 0) {
      return null
    }

    const imageUrl = results[0]?.imageURL
    return imageUrl || null
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Unknown error'
    console.error(`   API Error: ${message}`)
    return null
  }
}

async function main() {
  const options = parseArgs()
  const apiKey = process.env.RUNWARE_API_KEY

  console.log('\n=== Farm Image Generator (Direct URL Mode) ===\n')

  // Check API key
  if (!apiKey) {
    console.error('Error: RUNWARE_API_KEY not found in environment')
    console.error('Set it in .env.local: RUNWARE_API_KEY=your_key')
    process.exit(1)
  }

  console.log('Configuration:')
  console.log(`  Limit: ${options.limit === 0 ? 'all' : options.limit}`)
  console.log(`  Offset: ${options.offset}`)
  console.log(`  Force regenerate: ${options.force}`)
  console.log(`  Dry run: ${options.dryRun}`)
  console.log(`  Batch size: ${options.batchSize}`)
  console.log(`  Delay: ${options.delay}ms`)
  console.log(`  Resume: ${options.resume}`)
  console.log('')

  // Load progress if resuming
  let progress = await loadProgress()
  if (options.resume && progress.lastProcessedId) {
    console.log(`Resuming from farm ID: ${progress.lastProcessedId}`)
    console.log(`Previous progress: ${progress.totalProcessed} processed, ${progress.totalGenerated} generated`)
    console.log('')
  } else {
    // Reset progress
    progress = {
      lastProcessedId: null,
      totalProcessed: 0,
      totalGenerated: 0,
      totalSkipped: 0,
      totalFailed: 0,
      failedFarms: []
    }
  }

  try {
    // Build query conditions
    const whereConditions: Prisma.FarmWhereInput = {
      status: 'active'
    }

    // If not forcing and not resuming, only get farms without imageUrl
    if (!options.force) {
      whereConditions.OR = [
        { imageUrl: null },
        { imageUrl: '' }
      ]
    }

    // If resuming, start after the last processed ID
    if (options.resume && progress.lastProcessedId) {
      whereConditions.id = {
        gt: progress.lastProcessedId
      }
    }

    // Count total farms
    const totalCount = await prisma.farm.count({ where: whereConditions })
    console.log(`Found ${totalCount} farms to process`)

    if (totalCount === 0) {
      console.log('No farms need image generation!')
      return
    }

    // Process in batches
    let processed = 0
    const limit = options.limit === 0 ? totalCount : Math.min(options.limit, totalCount)

    while (processed < limit) {
      const batchSize = Math.min(options.batchSize, limit - processed)

      const farms = await prisma.farm.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          slug: true,
          county: true,
          imageUrl: true
        },
        orderBy: { id: 'asc' },
        skip: options.offset + processed,
        take: batchSize
      })

      if (farms.length === 0) {
        break
      }

      for (const farm of farms) {
        processed++
        progress.totalProcessed++

        console.log(`\n[${processed}/${limit}] ${farm.name}`)
        console.log(`   County: ${farm.county}`)
        console.log(`   Slug: ${farm.slug}`)

        // Skip if already has imageUrl and not forcing
        if (farm.imageUrl && !options.force) {
          console.log(`   Skipped: Already has imageUrl`)
          progress.totalSkipped++
          progress.lastProcessedId = farm.id
          await saveProgress(progress)
          continue
        }

        if (options.dryRun) {
          console.log(`   [DRY RUN] Would generate image`)
          progress.totalGenerated++
          progress.lastProcessedId = farm.id
          await saveProgress(progress)
          continue
        }

        // Generate image
        console.log(`   Generating image...`)
        const imageUrl = await generateFarmImage(farm.name, farm.county, apiKey)

        if (!imageUrl) {
          console.log(`   Failed: No image returned`)
          progress.totalFailed++
          progress.failedFarms.push(farm.slug)
          progress.lastProcessedId = farm.id
          await saveProgress(progress)
          continue
        }

        // Update farm with imageUrl
        await prisma.farm.update({
          where: { id: farm.id },
          data: { imageUrl: imageUrl }
        })

        console.log(`   Success: ${imageUrl.substring(0, 60)}...`)
        progress.totalGenerated++
        progress.lastProcessedId = farm.id
        await saveProgress(progress)

        // Delay between requests
        if (processed < limit) {
          await new Promise(resolve => setTimeout(resolve, options.delay))
        }
      }
    }

    // Summary
    console.log('\n=== Generation Complete ===\n')
    console.log(`Total processed: ${progress.totalProcessed}`)
    console.log(`Generated: ${progress.totalGenerated}`)
    console.log(`Skipped (existing): ${progress.totalSkipped}`)
    console.log(`Failed: ${progress.totalFailed}`)
    console.log(`Estimated cost: $${(progress.totalGenerated * COST_PER_IMAGE).toFixed(4)}`)

    if (progress.failedFarms.length > 0) {
      console.log(`\nFailed farms: ${progress.failedFarms.join(', ')}`)
    }

    if (processed < totalCount) {
      console.log(`\nGeneration paused. Run with --resume to continue.`)
    } else {
      console.log(`\nAll farms processed!`)
      console.log(`\nNext step: Run 'npx tsx scripts/migrate-image-urls.ts' to create Image records.`)
    }

  } catch (error) {
    console.error('\nFatal error:', error)
    await saveProgress(progress)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
