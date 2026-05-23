#!/usr/bin/env tsx
/**
 * Read-only schema readiness probe.
 *
 * Verifies, against whichever DB `.env.local` points at:
 *   1. Which host we are actually connected to (host only, no credentials).
 *   2. Whether the `images` table has its image-source columns (source,
 *      googlePhotoRef, googleAttribution, urlExpiresAt) plus the pipeline
 *      provenance columns (license, sourceUrl, attribution), and whether the
 *      `farms` table has its pipeline provenance columns (provenance, osmId,
 *      fsaId, dataSource, lastEnrichedAt).
 *   3. Current farm / image row counts, so a later import has a baseline.
 *
 * Performs NO writes. Safe to run against the live database.
 *
 * Usage: pnpm tsx src/scripts/check-image-schema.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local must override values that @prisma/client auto-loaded from
// .env at module-import time (ES-module imports run before this code).
config({ path: resolve(process.cwd(), '.env.local'), override: true })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EXPECTED_IMAGE_COLUMNS = [
  'source',
  'googlePhotoRef',
  'googleAttribution',
  'urlExpiresAt',
  'license',
  'sourceUrl',
  'attribution',
] as const

const EXPECTED_FARM_COLUMNS = [
  'provenance',
  'osmId',
  'fsaId',
  'dataSource',
  'lastEnrichedAt',
] as const

async function columnsFor(table: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = ${table} AND table_schema = 'public'
  `
  return new Set(rows.map((c) => c.column_name))
}

function report(table: string, present: Set<string>, expected: readonly string[]): boolean {
  let ok = true
  console.log(`${table} columns:`)
  for (const col of expected) {
    const has = present.has(col)
    if (!has) ok = false
    console.log(`  ${has ? 'PRESENT' : 'MISSING'}  ${col}`)
  }
  console.log('')
  return ok
}

function safeHost(url: string | undefined): string {
  if (!url) return '(DATABASE_URL not set)'
  try {
    const u = new URL(url)
    return `${u.hostname}:${u.port || '(default)'}`
  } catch {
    return '(unparseable DATABASE_URL)'
  }
}

async function main() {
  console.log('Queue 32 readiness probe (read-only)')
  console.log('='.repeat(60))
  console.log(`DB host: ${safeHost(process.env.DATABASE_URL)}`)
  console.log('')

  const [imageCols, farmCols] = await Promise.all([
    columnsFor('images'),
    columnsFor('farms'),
  ])
  const imagesOk = report('images', imageCols, EXPECTED_IMAGE_COLUMNS)
  const farmsOk = report('farms', farmCols, EXPECTED_FARM_COLUMNS)

  const [farmCount, imageCount] = await Promise.all([
    prisma.farm.count(),
    prisma.image.count(),
  ])
  console.log(`Row counts: farms=${farmCount}, images=${imageCount}`)
  console.log('')
  console.log(
    imagesOk && farmsOk
      ? 'RESULT: schema already synced - no db push needed.'
      : 'RESULT: columns MISSING - run `pnpm prisma db push` to apply additive columns.'
  )
}

main()
  .catch((e) => {
    console.error('Probe failed:', e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
