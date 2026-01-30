#!/usr/bin/env tsx
/**
 * Update Produce Images Script
 *
 * Regenerates all produce images with new prompts and automatically updates
 * src/data/produce.ts with the new Vercel Blob URLs.
 *
 * Usage:
 *   pnpm tsx src/scripts/update-produce-images.ts
 *   pnpm tsx src/scripts/update-produce-images.ts --dry-run
 *   pnpm tsx src/scripts/update-produce-images.ts --slug=strawberries
 */

import { PRODUCE } from '../data/produce'
import { ProduceImageGenerator } from '../lib/produce-image-generator'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

interface ImageResult {
  slug: string
  name: string
  urls: string[]
  success: boolean
  error?: string
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const slugArg = args.find(a => a.startsWith('--slug='))
  const targetSlug = slugArg ? slugArg.split('=')[1] : null
  const countArg = args.find(a => a.startsWith('--count='))
  const count = countArg ? parseInt(countArg.split('=')[1]) : 4

  console.log('========================================')
  console.log('Update Produce Images')
  console.log('========================================')
  console.log('')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no uploads)' : 'LIVE (will upload)'}`)
  console.log(`Target: ${targetSlug || 'ALL produce items'}`)
  console.log(`Variations per item: ${count}`)
  console.log('')

  // Filter produce items
  const produceItems = targetSlug
    ? PRODUCE.filter(p => p.slug === targetSlug)
    : PRODUCE

  if (produceItems.length === 0) {
    console.error(`No produce found with slug: ${targetSlug}`)
    process.exit(1)
  }

  console.log(`Processing ${produceItems.length} produce items...`)
  console.log('')

  const generator = new ProduceImageGenerator()
  const results: ImageResult[] = []

  for (const produce of produceItems) {
    console.log(`----------------------------------------`)
    console.log(`Processing: ${produce.name} (${produce.slug})`)
    console.log(`----------------------------------------`)

    try {
      if (dryRun) {
        console.log(`[DRY RUN] Would generate ${count} variations`)
        results.push({
          slug: produce.slug,
          name: produce.name,
          urls: [],
          success: true
        })
        continue
      }

      const urls: string[] = []

      for (let i = 1; i <= count; i++) {
        console.log(`  Generating variation ${i}/${count}...`)

        const seed = hashString(`${produce.slug}-${i}`)
        const buffer = await generator.generateProduceImage(
          produce.name,
          produce.slug,
          { seed }
        )

        if (buffer) {
          console.log(`  Uploading variation ${i}...`)
          const url = await generator.uploadImage(
            buffer,
            produce.slug,
            i,
            produce.name,
            true // allowOverwrite
          )
          urls.push(url)
          console.log(`  Uploaded: ${url}`)
        } else {
          console.warn(`  Failed to generate variation ${i}`)
        }

        // Rate limiting
        if (i < count) {
          await sleep(1000)
        }
      }

      results.push({
        slug: produce.slug,
        name: produce.name,
        urls,
        success: urls.length > 0
      })

      console.log(`Completed ${produce.name}: ${urls.length}/${count} images`)
      console.log('')

      // Rate limiting between items
      await sleep(2000)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Failed: ${produce.name} - ${message}`)
      results.push({
        slug: produce.slug,
        name: produce.name,
        urls: [],
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

  const successful = results.filter(r => r.success && r.urls.length > 0)
  const failed = results.filter(r => !r.success || r.urls.length === 0)

  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)
  console.log('')

  if (failed.length > 0) {
    console.log('Failed items:')
    failed.forEach(f => console.log(`  - ${f.name}: ${f.error || 'No images generated'}`))
    console.log('')
  }

  // Update produce.ts if we have results
  if (!dryRun && successful.length > 0) {
    console.log('========================================')
    console.log('UPDATING produce.ts')
    console.log('========================================')
    console.log('')

    await updateProduceFile(successful)
  }

  // Output TypeScript snippet for manual update if needed
  console.log('')
  console.log('========================================')
  console.log('TYPESCRIPT SNIPPET (for manual update)')
  console.log('========================================')
  console.log('')

  for (const result of successful) {
    console.log(`// ${result.name}`)
    console.log(`images: [`)
    result.urls.forEach((url, i) => {
      console.log(`  { src: '${url}', alt: 'Fresh ${result.name.toLowerCase()} - variation ${i + 1}' },`)
    })
    console.log(`],`)
    console.log('')
  }
}

async function updateProduceFile(results: ImageResult[]): Promise<void> {
  const filePath = join(process.cwd(), 'src/data/produce.ts')

  try {
    let content = await readFile(filePath, 'utf-8')

    for (const result of results) {
      if (result.urls.length === 0) continue

      // Build new images array
      const newImages = result.urls.map((url, i) => {
        const altText = generateAltText(result.name, i + 1)
        return `      { src: '${url}', alt: '${altText}' }`
      }).join(',\n')

      // Find and replace the images array for this produce item
      // Match pattern: images: [\n ... ],
      const slugPattern = new RegExp(
        `(slug:\\s*'${result.slug}'[\\s\\S]*?images:\\s*\\[)[\\s\\S]*?(\\],)`,
        'g'
      )

      const replacement = `$1\n${newImages}\n    $2`
      const newContent = content.replace(slugPattern, replacement)

      if (newContent !== content) {
        content = newContent
        console.log(`Updated images for: ${result.name}`)
      } else {
        console.warn(`Could not find/update images for: ${result.name}`)
      }
    }

    await writeFile(filePath, content, 'utf-8')
    console.log('')
    console.log('produce.ts updated successfully!')

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to update produce.ts: ${message}`)
    console.log('')
    console.log('Please update manually using the TypeScript snippet above.')
  }
}

function generateAltText(name: string, variation: number): string {
  const altTexts = [
    `Fresh ${name.toLowerCase()} on rustic wooden surface`,
    `${name} close-up with natural light`,
    `British ${name.toLowerCase()} harvest display`,
    `Farm-fresh ${name.toLowerCase()} with soft focus`
  ]
  return altTexts[(variation - 1) % altTexts.length]
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Run
main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
