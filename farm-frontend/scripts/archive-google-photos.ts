#!/usr/bin/env npx tsx
/**
 * Archive Google Photos to Vercel Blob
 *
 * One-time migration script. Downloads every Google-sourced photo
 * (using the stored googlePhotoRef) and uploads it to Vercel Blob.
 * Then updates the Image record so the photo is served for free.
 *
 * Prerequisites:
 *   - GOOGLE_PLACES_API_KEY env var set (server-side key)
 *   - BLOB_READ_WRITE_TOKEN env var set
 *   - DATABASE_URL env var set
 *
 * Usage:
 *   npx tsx scripts/archive-google-photos.ts
 *   npx tsx scripts/archive-google-photos.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

const DRY_RUN = process.argv.includes('--dry-run')
const prisma = new PrismaClient()

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!GOOGLE_API_KEY) {
  console.error('[archive] GOOGLE_PLACES_API_KEY is not set. Cannot download photos.')
  process.exit(1)
}

interface ArchiveResult {
  imageId: string
  farmSlug: string
  status: 'ok' | 'skipped' | 'failed'
  reason?: string
  blobUrl?: string
}

async function downloadGooglePhoto(photoRef: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/photo?` +
    `maxwidth=800&` +
    `photo_reference=${encodeURIComponent(photoRef)}&` +
    `key=${GOOGLE_API_KEY}`

  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    console.warn(`[archive] HTTP ${res.status} for ref ${photoRef.slice(0, 30)}...`)
    return null
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await res.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), contentType }
}

function extensionFromContentType(ct: string): string {
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  return 'jpg'
}

async function main() {
  console.log(`[archive] ${DRY_RUN ? 'DRY RUN -- ' : ''}Starting Google photo archive`)

  const images = await prisma.image.findMany({
    where: {
      source: 'google',
      googlePhotoRef: { not: null },
    },
    include: {
      farm: { select: { slug: true, name: true } },
    },
  })

  console.log(`[archive] Found ${images.length} Google-sourced images to archive`)

  if (images.length === 0) {
    console.log('[archive] Nothing to do.')
    await prisma.$disconnect()
    return
  }

  const results: ArchiveResult[] = []
  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const img of images) {
    const farmSlug = img.farm?.slug || 'unknown'

    // Skip if already archived (has a real blob URL)
    if (img.url && img.url.startsWith('https://') && img.url.includes('blob.vercel-storage.com')) {
      skipped++
      results.push({ imageId: img.id, farmSlug, status: 'skipped', reason: 'already archived' })
      continue
    }

    if (!img.googlePhotoRef) {
      skipped++
      results.push({ imageId: img.id, farmSlug, status: 'skipped', reason: 'no photo reference' })
      continue
    }

    console.log(`[archive] Downloading: ${img.farm?.name || farmSlug} (${img.id})`)

    if (DRY_RUN) {
      downloaded++
      results.push({ imageId: img.id, farmSlug, status: 'ok', reason: 'dry run' })
      continue
    }

    try {
      const photo = await downloadGooglePhoto(img.googlePhotoRef)
      if (!photo) {
        failed++
        results.push({ imageId: img.id, farmSlug, status: 'failed', reason: 'download failed' })
        continue
      }

      const ext = extensionFromContentType(photo.contentType)
      const blobPath = `farm-photos/${encodeURIComponent(farmSlug)}/${img.id}/main.${ext}`

      const blob = await put(blobPath, photo.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: photo.contentType,
      })

      // Update the database record
      await prisma.image.update({
        where: { id: img.id },
        data: {
          url: blob.url,
          source: 'google-archived',
        },
      })

      downloaded++
      results.push({ imageId: img.id, farmSlug, status: 'ok', blobUrl: blob.url })
      console.log(`[archive]   -> Saved to ${blob.url}`)

      // Rate-limit: 200ms between requests to avoid hammering Google
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ imageId: img.id, farmSlug, status: 'failed', reason: msg })
      console.error(`[archive]   -> FAILED: ${msg}`)
    }
  }

  console.log('\n[archive] === Summary ===')
  console.log(`  Total:      ${images.length}`)
  console.log(`  Downloaded: ${downloaded}`)
  console.log(`  Skipped:    ${skipped}`)
  console.log(`  Failed:     ${failed}`)

  if (failed > 0) {
    console.log('\n[archive] Failed images:')
    results
      .filter((r) => r.status === 'failed')
      .forEach((r) => console.log(`  - ${r.farmSlug} (${r.imageId}): ${r.reason}`))
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('[archive] Fatal error:', err)
  process.exit(1)
})
