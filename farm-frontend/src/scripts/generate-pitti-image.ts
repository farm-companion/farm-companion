#!/usr/bin/env tsx
/**
 * Pitti Press image generator — single-image CLI for style validation.
 *
 * Spec: docs/superpowers/specs/2026-05-19-pitti-press-design.md §6
 * Slice: 1.1.2k-α
 *
 * Distinct from the existing `generate-farm-images.ts` / `generate-county-images.ts`
 * batch generators, which still produce harvest-style photorealistic imagery.
 * This script generates a single Pitti Press linocut image at a time for
 * prompt iteration. Once the style is validated, the production batch
 * generators can swap their prompt builders from harvest to Pitti Press
 * (Slice 1.1.2k-γ / 1.1.2k-δ).
 *
 * Usage:
 *   pnpm generate:pitti hero homepage
 *   pnpm generate:pitti county cornwall --feature="coastal cliffs"
 *   pnpm generate:pitti farm-header river-cafe --county=Devon --offerings=dairy,eggs,bakery
 *   pnpm generate:pitti seasonal asparagus
 *   pnpm generate:pitti hero homepage --dry-run
 *   pnpm generate:pitti hero homepage --model=schnell
 *
 * Output: farm-frontend/public/images/pitti/{type}-{slug}-{model}-seed{seed}.webp
 *
 * Setup:
 *   1. Add `RUNWARE_API_KEY=<your_key>` to farm-frontend/.env.local
 *   2. Run: pnpm generate:pitti hero homepage
 */

import { config } from 'dotenv'
import { resolve, join } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { writeFile, mkdir } from 'fs/promises'
import { createHash } from 'crypto'
import {
  getRunwareClient,
  buildPittiPrompt,
  PITTI_STYLE,
  RUNWARE_MODELS,
} from '../lib/runware-client'
import {
  WATERMARK_CROP_PX,
  generationHeightFor,
  cropBottomStrip,
} from '../lib/image-crop'

const TYPES = ['hero', 'county', 'farm-header', 'seasonal'] as const
type ImageType = (typeof TYPES)[number]
type ModelKey = 'dev' | 'schnell'

interface CliOptions {
  type: ImageType
  slug: string
  dryRun: boolean
  model: ModelKey
  county?: string
  feature?: string
  offerings?: string[]
  season?: string
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    console.error('Usage: pnpm generate:pitti <type> <slug> [...flags]')
    console.error(`  Types:  ${TYPES.join(' | ')}`)
    console.error('  Flags:  --dry-run, --model=dev|schnell,')
    console.error('          --county=<name>, --feature=<desc>,')
    console.error('          --offerings=<a,b,c>, --season=<name>')
    process.exit(args.length === 0 ? 1 : 0)
  }
  const [type, slug, ...rest] = args
  if (!TYPES.includes(type as ImageType)) {
    console.error(`Unknown type: ${type}. Valid: ${TYPES.join(', ')}`)
    process.exit(1)
  }
  const opts: CliOptions = {
    type: type as ImageType,
    slug,
    dryRun: false,
    model: 'dev',
  }
  for (const arg of rest) {
    if (arg === '--dry-run') opts.dryRun = true
    else if (arg.startsWith('--model=')) {
      const m = arg.split('=')[1]
      if (m !== 'dev' && m !== 'schnell') {
        console.error(`Unknown model: ${m}. Valid: dev, schnell`)
        process.exit(1)
      }
      opts.model = m
    } else if (arg.startsWith('--county=')) opts.county = arg.split('=')[1]
    else if (arg.startsWith('--feature=')) opts.feature = arg.split('=')[1]
    else if (arg.startsWith('--offerings=')) opts.offerings = arg.split('=')[1].split(',')
    else if (arg.startsWith('--season=')) opts.season = arg.split('=')[1]
    else console.warn(`Ignoring unknown flag: ${arg}`)
  }
  return opts
}

// Deterministic seed — `hash(slug + version) → uint32`.
// Bump SEED_VERSION to force regeneration across an entire catalogue.
const SEED_VERSION = 1
function seedFor(slug: string): number {
  const h = createHash('sha256').update(`${slug}@v${SEED_VERSION}`).digest('hex')
  return parseInt(h.slice(0, 8), 16)
}

interface PromptShape {
  prompt: string
  width: number
  height: number
}

function promptFor(opts: CliOptions): PromptShape {
  switch (opts.type) {
    case 'hero': {
      const season = opts.season ?? 'midsummer'
      return {
        prompt: buildPittiPrompt(`UK countryside in ${season}`, {
          additionalElements: [
            'rolling hills with dry stone walls',
            'a single red tractor in the middle distance',
            'a barn silhouette',
            'wide horizon line, low sun, confident composition',
          ],
        }),
        width: 1536,
        height: 1024,
      }
    }
    case 'county': {
      const county = opts.county ?? opts.slug
      const feature = opts.feature ?? 'rolling hills with hedgerows'
      return {
        prompt: buildPittiPrompt(`landscape of ${county} England`, {
          additionalElements: [
            feature,
            'stone walls, scattered farmhouses',
            'wide editorial framing, horizon line one-third from bottom',
          ],
        }),
        width: 1280,
        height: 800,
      }
    }
    case 'farm-header': {
      const county = opts.county ?? 'rural England'
      const offerings = (opts.offerings ?? ['seasonal produce']).slice(0, 3).join(', ')
      return {
        prompt: buildPittiPrompt(`a UK farm shop in ${county}`, {
          additionalElements: [
            `selling ${offerings}`,
            'wide horizontal composition, editorial illustration',
            'single architectural building element, no human figures',
          ],
        }),
        width: 1536,
        height: 768,
      }
    }
    case 'seasonal': {
      const crop = opts.slug.replace(/-/g, ' ')
      return {
        prompt: buildPittiPrompt(`single linocut stamp of ${crop}`, {
          additionalElements: [
            'single botanical specimen centred',
            'vintage botanical print, woodcut block print',
            'vermilion ink only, no second color',
          ],
        }),
        width: 1024,
        height: 1024,
      }
    }
  }
}

async function main(): Promise<void> {
  const opts = parseArgs()

  const client = getRunwareClient()
  if (!client.isConfigured() && !opts.dryRun) {
    console.error('RUNWARE_API_KEY not found in environment.')
    console.error('Add it to farm-frontend/.env.local and retry.')
    process.exit(1)
  }

  const seed = seedFor(opts.slug)
  const { prompt, width, height } = promptFor(opts)
  const genHeight = generationHeightFor(height)
  const modelId = opts.model === 'dev' ? RUNWARE_MODELS.fluxDev : RUNWARE_MODELS.fluxSchnell
  const steps = opts.model === 'dev' ? 28 : 4
  const cfgScale = opts.model === 'dev' ? 3.5 : 1.0

  console.log('\n=== Pitti Press Image Generator (Slice 1.1.2k-γ) ===')
  console.log(`Type:        ${opts.type}`)
  console.log(`Slug:        ${opts.slug}`)
  console.log(`Model:       ${modelId} (${opts.model})`)
  console.log(`Final size:  ${width}×${height}`)
  console.log(`Gen size:    ${width}×${genHeight} (crop bottom ${genHeight - height}px)`)
  console.log(`Seed:        ${seed}`)
  console.log(`Steps/CFG:   ${steps} / ${cfgScale}`)
  console.log(`Positive:    ${prompt}`)
  console.log(`Negative:    ${PITTI_STYLE.negative}`)
  console.log('---')

  if (opts.dryRun) {
    console.log('[dry-run] No API call made.')
    return
  }

  const rawBuffer = await client.generateBuffer({
    prompt,
    negativePrompt: PITTI_STYLE.negative,
    width,
    height: genHeight,
    seed,
    steps,
    cfgScale,
    model: modelId,
    outputFormat: 'webp',
  })

  if (!rawBuffer) {
    console.error('Generation failed. See logs above for details.')
    process.exit(1)
  }

  const buffer = await cropBottomStrip(rawBuffer, height, 'webp')
  const cropped = genHeight - height
  console.log(`Cropped:     -${cropped}px from bottom (FLUX watermark safety strip; min ${WATERMARK_CROP_PX}px)`)

  const outDir = resolve(process.cwd(), 'public/images/pitti')
  await mkdir(outDir, { recursive: true })
  const filename = `${opts.type}-${opts.slug}-${opts.model}-seed${seed}.webp`
  const outPath = join(outDir, filename)
  await writeFile(outPath, buffer)
  console.log(`Saved:       ${outPath} (${Math.round(buffer.byteLength / 1024)} KB)`)
  console.log('\nReview the file locally. Iterate by editing prompts in this')
  console.log('script + buildPittiPrompt in src/lib/runware-client.ts, then')
  console.log('bump SEED_VERSION when ready for a regen sweep.')
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error('Error:', message)
  process.exit(1)
})
