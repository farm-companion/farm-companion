#!/usr/bin/env tsx
/**
 * Slice 1.1.3c Part 3 — Backfill legacy Pitti image rows
 *
 * Finds Image rows whose URL matches a Pitti style path but whose uploadedBy
 * column still reads 'ai_generator' (a label that predates the style-aware
 * Pitti / Apothecary split introduced in Slice 1.1.3a). Updates uploadedBy
 * to 'ai_pitti' so the listing-side filter from Slice 1.1.3c Part 2 stops
 * suppressing them on /shop, /counties/[slug], /find/[county]/[category],
 * and the map's /api/farms feed.
 *
 * Default mode: READ-ONLY (prints what would change).
 * Live mode: pass --apply to perform the UPDATE inside a transaction.
 *
 * Usage:
 *   npx tsx scripts/backfill-pitti-uploaded-by.ts            # read-only audit
 *   npx tsx scripts/backfill-pitti-uploaded-by.ts --apply    # commit changes
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// URL fragments that uniquely identify a Pitti-style image.
// Per ledger Slice 1.1.3a: Pitti per-farm images live under the Hetzner
// blob prefix 'pitti-farm-images/'. The legacy darts-farm row and any
// other rows uploaded before the style-aware label split are the
// population this script targets.
const PITTI_URL_FRAGMENTS = ['pitti-farm-images/', '/images/pitti/'] as const

interface LegacyPittiRow {
  id: string
  url: string
  farmId: string
  farmName: string
  farmSlug: string
}

async function main() {
  const apply = process.argv.includes('--apply')

  console.log('Slice 1.1.3c Part 3 — Pitti uploadedBy backfill')
  console.log('='.repeat(60))
  console.log(`Mode: ${apply ? 'APPLY (will UPDATE rows)' : 'READ-ONLY (no writes)'}`)
  console.log(`URL fragments: ${PITTI_URL_FRAGMENTS.join(', ')}`)
  console.log('')

  try {
    const rows = await prisma.$queryRaw<LegacyPittiRow[]>`
      SELECT
        i.id,
        i.url,
        i."farmId",
        f.name AS "farmName",
        f.slug AS "farmSlug"
      FROM images i
      JOIN farms f ON f.id = i."farmId"
      WHERE i."uploadedBy" = 'ai_generator'
        AND (
          i.url LIKE '%pitti-farm-images/%'
          OR i.url LIKE '%/images/pitti/%'
        )
      ORDER BY f.slug
    `

    if (rows.length === 0) {
      console.log('No rows match. Nothing to backfill.')
      return
    }

    console.log(`Found ${rows.length} legacy Pitti row(s) labelled ai_generator:`)
    console.log('')

    for (const row of rows) {
      console.log(`  ${row.farmSlug.padEnd(40)}  ${row.url}`)
    }
    console.log('')

    if (!apply) {
      console.log('Read-only run. Re-run with --apply to commit the UPDATE.')
      return
    }

    const ids = rows.map((r) => r.id)
    const result = await prisma.$transaction(async (tx) => {
      return tx.image.updateMany({
        where: { id: { in: ids } },
        data: { uploadedBy: 'ai_pitti' },
      })
    })

    console.log(`Updated ${result.count} row(s). Expected ${rows.length}.`)
    if (result.count !== rows.length) {
      console.error('Mismatch between selected and updated counts. Investigate.')
      process.exitCode = 2
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
