#!/usr/bin/env tsx
// Targeted Apothecary batch generator.
//
// For every active farm with review traction (googleReviewsCount >= MIN_REVIEWS)
// that has no real (owner/admin/user) photo and no ai_apothecary row yet,
// generate an Apothecary botanical illustration (Runware FLUX-dev) and upload it
// to Hetzner blob at apothecary-farm-illustrations/<slug>/main.webp, then create
// the approved ai_apothecary Image row so the existing card query + hero builder
// surface it (Pitti remains the long-tail fallback).
//
// Mirrors generate-pitti-batch.ts (resumable HEAD-skip, concurrency pool,
// progress log) and replicates the apothecary generation from
// generate-farm-images.ts so output matches the approved sample.
//   pnpm tsx src/scripts/generate-apothecary-batch.ts [--min-reviews=20] [--limit=N] [--concurrency=5] [--force]
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local'), override: true })
config({ path: resolve(process.cwd(), '.env') })

import { getRunwareClient, RUNWARE_MODELS } from '../lib/runware-client'
import { APOTHECARY_STYLE, buildApothecaryFarmOfferingsPrompt } from '../lib/apothecary-style'
import { generationHeightFor, cropBottomStrip } from '../lib/image-crop'
import { uploadApothecaryFarmImage } from '../lib/apothecary-blob'

const WIDTH = 1536
const HEIGHT = 768
const PUBLIC_BASE = process.env.BLOB_PUBLIC_URL_BASE ?? ''

// Deterministic seed per slug (copied from generate-farm-images.ts so a farm's
// illustration is stable across runs).
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

function blobUrlFor(slug: string): string {
  return `${PUBLIC_BASE}/apothecary-farm-illustrations/${encodeURIComponent(slug)}/main.webp`
}

async function alreadyUploaded(slug: string): Promise<boolean> {
  if (!PUBLIC_BASE) return false
  try {
    const res = await fetch(blobUrlFor(slug), { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

type Farm = { id: string; name: string; slug: string; county: string | null; categories: { category: { name: string } }[] }

async function generateAndUpload(farm: Farm): Promise<string> {
  const offerings = farm.categories.map((c) => c.category.name).slice(0, 3)
  const prompt = buildApothecaryFarmOfferingsPrompt(
    offerings.length > 0 ? offerings : ['seasonal produce'],
    farm.county ?? 'rural England',
  )
  const raw = await getRunwareClient().generateBuffer({
    prompt,
    negativePrompt: APOTHECARY_STYLE.negative,
    width: WIDTH,
    height: generationHeightFor(HEIGHT),
    seed: hashString(farm.slug),
    steps: 28,
    cfgScale: 3.5,
    model: RUNWARE_MODELS.fluxDev,
    outputFormat: 'webp',
  })
  if (!raw) throw new Error('no image returned')
  const cropped = await cropBottomStrip(raw, HEIGHT, 'webp')
  const blob = await uploadApothecaryFarmImage(cropped, farm.slug)
  return blob.url
}

async function main(): Promise<void> {
  const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
  const minReviews = arg('min-reviews') ? parseInt(arg('min-reviews')!, 10) : 20
  const limit = arg('limit') ? parseInt(arg('limit')!, 10) : undefined
  const concurrency = arg('concurrency') ? parseInt(arg('concurrency')!, 10) : 5
  const force = process.argv.includes('--force')

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const farms = (await prisma.farm.findMany({
    where: {
      status: 'active',
      googleReviewsCount: { gte: minReviews },
      images: { none: { uploadedBy: 'ai_apothecary' } },
      // Never override a real photo (its isHero row must keep ranking first).
      NOT: { images: { some: { status: 'approved', uploadedBy: { in: ['owner', 'admin', 'user'] } } } },
    },
    select: { id: true, name: true, slug: true, county: true, categories: { select: { category: { select: { name: true } } } } },
    ...(limit ? { take: limit } : {}),
    orderBy: { name: 'asc' },
  })) as Farm[]

  console.log(`Apothecary batch: ${farms.length} farms (>=${minReviews} reviews, no real photo, no apothecary), concurrency ${concurrency}${force ? ' (force)' : ''}`)
  let ok = 0, skip = 0, fail = 0, done = 0
  const queue = [...farms]

  async function worker(): Promise<void> {
    for (let f = queue.shift(); f; f = queue.shift()) {
      try {
        const existed = !force && (await alreadyUploaded(f.slug))
        const url = existed ? blobUrlFor(f.slug) : await generateAndUpload(f)
        await prisma.image.create({
          data: {
            farmId: f.id,
            url,
            altText: `${f.name} botanical illustration`,
            uploadedBy: 'ai_apothecary',
            status: 'approved',
            isHero: true,
            displayOrder: 0,
          },
        })
        if (existed) skip++
        else ok++
      } catch (e) {
        fail++
        console.error(`  fail ${f.slug}: ${e instanceof Error ? e.message : String(e)}`)
      }
      done++
      if (done % 25 === 0 || done === farms.length) {
        console.log(`[${done}/${farms.length}] ok=${ok} skip=${skip} fail=${fail}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker))
  await prisma.$disconnect()
  console.log(`DONE: ok=${ok} skip=${skip} fail=${fail} of ${farms.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
