#!/usr/bin/env tsx
// Whole-site Pitti batch generator.
//
// For every active farm WITHOUT a real (owner/admin/user) photo, generate a
// Pitti railway-poster farm-header illustration (Runware FLUX-dev) and upload
// it to Hetzner blob at pitti-farm-images/<slug>/main.webp. The site resolver
// (src/data/pitti-farms.ts) serves that URL; FarmCard falls back gracefully
// for any slug not yet uploaded.
//
// Resumable: skips slugs already present in the blob (HEAD check) unless
// --force. Small concurrency pool. Progress + ok/skip/fail logging.
//   pnpm tsx src/scripts/generate-pitti-batch.ts [--limit=N] [--concurrency=5] [--force]
import { config } from 'dotenv'
import { resolve } from 'path'
import { createHash } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local'), override: true })
config({ path: resolve(process.cwd(), '.env') })

import {
  getRunwareClient,
  PITTI_STYLE,
  RUNWARE_MODELS,
  buildPittiFarmHeaderPrompt,
} from '../lib/runware-client'
import { generationHeightFor, cropBottomStrip } from '../lib/image-crop'
import { uploadPittiFarmImage } from '../lib/pitti-blob'

const SEED_VERSION = 1
const WIDTH = 1536
const HEIGHT = 768
const PUBLIC_BASE = process.env.BLOB_PUBLIC_URL_BASE ?? ''

function seedFor(slug: string): number {
  const h = createHash('sha256').update(`${slug}@v${SEED_VERSION}`).digest('hex')
  return parseInt(h.slice(0, 8), 16)
}

async function alreadyUploaded(slug: string): Promise<boolean> {
  if (!PUBLIC_BASE) return false
  try {
    const res = await fetch(`${PUBLIC_BASE}/pitti-farm-images/${encodeURIComponent(slug)}/main.webp`, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function generateOne(slug: string, county: string | null, offerings: string[], force: boolean): Promise<'ok' | 'skip' | 'fail'> {
  if (!force && (await alreadyUploaded(slug))) return 'skip'
  try {
    const client = getRunwareClient()
    const prompt = buildPittiFarmHeaderPrompt(county ?? 'the UK', offerings)
    const raw = await client.generateBuffer({
      prompt,
      negativePrompt: PITTI_STYLE.negative,
      width: WIDTH,
      height: generationHeightFor(HEIGHT),
      seed: seedFor(slug),
      steps: 28,
      cfgScale: 3.5,
      model: RUNWARE_MODELS.fluxDev,
      outputFormat: 'webp',
    })
    if (!raw) return 'fail'
    const buffer = await cropBottomStrip(raw, HEIGHT, 'webp')
    await uploadPittiFarmImage(buffer, slug)
    return 'ok'
  } catch (e) {
    console.error(`  fail ${slug}: ${e instanceof Error ? e.message : String(e)}`)
    return 'fail'
  }
}

async function main(): Promise<void> {
  const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
  const limit = arg('limit') ? parseInt(arg('limit')!, 10) : undefined
  const concurrency = arg('concurrency') ? parseInt(arg('concurrency')!, 10) : 5
  const force = process.argv.includes('--force')

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const farms = await prisma.farm.findMany({
    where: {
      status: 'active',
      // Only farms with no real (curated) photo — Pitti is their hero fallback.
      NOT: { images: { some: { status: 'approved', uploadedBy: { in: ['owner', 'admin', 'user'] } } } },
    },
    select: { slug: true, county: true, categories: { select: { category: { select: { slug: true } } } } },
    ...(limit ? { take: limit } : {}),
  })
  await prisma.$disconnect()

  console.log(`Pitti batch: ${farms.length} farms, concurrency ${concurrency}${force ? ' (force)' : ''}`)
  let ok = 0, skip = 0, fail = 0, done = 0
  const queue = [...farms]

  async function worker(): Promise<void> {
    for (let f = queue.shift(); f; f = queue.shift()) {
      const offerings = f.categories.map((c) => c.category.slug).filter((s) => s !== 'farm-shops').slice(0, 3)
      const r = await generateOne(f.slug, f.county, offerings.length ? offerings : ['farm-shops'], force)
      if (r === 'ok') ok++
      else if (r === 'skip') skip++
      else fail++
      done++
      if (done % 25 === 0 || done === farms.length) {
        console.log(`[${done}/${farms.length}] ok=${ok} skip=${skip} fail=${fail}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker))
  console.log(`DONE: ok=${ok} skip=${skip} fail=${fail} of ${farms.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
