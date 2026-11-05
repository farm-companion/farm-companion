#!/usr/bin/env tsx
/**
 * Pre-generate map plates for a county's farms.
 *
 * Usage:
 *   npx tsx scripts/generate-map-plates-batch.ts --county=Cornwall --limit=12
 *   npx tsx scripts/generate-map-plates-batch.ts --county=Cornwall --dry-run
 *
 * Overpass is a free service shared by everyone, with a fair-use policy and a
 * small number of concurrent slots. This runs strictly sequentially with a
 * pause between calls, defaults to a conservative limit, and skips plates that
 * already exist. Do not remove the delay to make a bulk run finish sooner; a
 * blocked IP affects every OSM user on this network.
 */
import { writeFile, mkdir, access } from 'fs/promises'
import { join } from 'path'
import { buildOverpassQuery, renderPlate, PLATE_ATTRIBUTION } from '../src/lib/map-plate'
import type { OverpassWay } from '../src/lib/map-plate'

const ENDPOINT = 'https://overpass-api.de/api/interpreter'
const OUT_DIR = join(process.cwd(), 'public', 'images', 'plates')
const USER_AGENT = 'farm-companion plate generator (https://www.farmcompanion.co.uk)'

function flag(name: string, fallback: string): string {
  const found = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : fallback
}
const has = (name: string) => process.argv.includes(`--${name}`)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Overpass answers 502 when its slots are full and 429 when we have asked for
 * too much too fast. Both are transient and both are normal in a batch of any
 * size, so they get an exponential backoff rather than killing the run. A 400
 * is our query being wrong and is not retried.
 */
const RETRYABLE = new Set([429, 502, 503, 504])
const MAX_ATTEMPTS = 4

async function fetchWays(lat: number, lon: number, radiusM: number): Promise<OverpassWay[]> {
  let lastError = ''
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(buildOverpassQuery(lat, lon, radiusM))}`,
    })
    if (response.ok) {
      const payload = (await response.json()) as { elements?: OverpassWay[] }
      return payload.elements ?? []
    }
    lastError = `${response.status} ${response.statusText}`
    if (!RETRYABLE.has(response.status)) {
      throw new Error(`Overpass ${lastError}`)
    }
    if (attempt < MAX_ATTEMPTS) {
      const backoff = 4000 * 2 ** (attempt - 1)
      console.log(`    overpass ${response.status}, backing off ${backoff / 1000}s`)
      await sleep(backoff)
    }
  }
  throw new Error(`Overpass still failing after ${MAX_ATTEMPTS} attempts: ${lastError}`)
}

async function main(): Promise<void> {
  const county = flag('county', 'Cornwall')
  const limit = Number(flag('limit', '12'))
  const delayMs = Number(flag('delay', '1500'))
  const radiusM = Number(flag('radius', '1200'))
  const [width, height] = flag('size', '430x630').split('x').map(Number)
  const dryRun = has('dry-run')
  const force = has('force')

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const farms = await prisma.farm.findMany({
    where: { county },
    select: { slug: true, name: true, latitude: true, longitude: true },
    orderBy: { slug: 'asc' },
    take: limit,
  })
  await prisma.$disconnect()

  console.log(`${county}: ${farms.length} farms (limit ${limit}), delay ${delayMs}ms`)
  if (dryRun) {
    for (const farm of farms) {
      console.log(`  ${farm.slug}  ${farm.latitude},${farm.longitude}`)
    }
    console.log('dry run, nothing fetched')
    return
  }

  await mkdir(OUT_DIR, { recursive: true })
  let written = 0
  let skipped = 0

  for (const [index, farm] of farms.entries()) {
    const path = join(OUT_DIR, `${farm.slug}.svg`)
    if (!force && (await exists(path))) {
      skipped += 1
      continue
    }

    const lat = Number(farm.latitude)
    const lon = Number(farm.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      console.warn(`  ${farm.slug}: no usable coordinates, skipped`)
      skipped += 1
      continue
    }

    if (index > 0) await sleep(delayMs)
    const ways = await fetchWays(lat, lon, radiusM)
    const { svg, featureCount } = renderPlate(ways, { lat, lon, radiusM, width, height })
    await writeFile(path, `<!-- ${PLATE_ATTRIBUTION} -->\n${svg}\n`)
    written += 1
    console.log(`  ${farm.slug}: ${ways.length} ways, ${featureCount} drawn`)
  }

  console.log(`done: ${written} written, ${skipped} skipped -> ${OUT_DIR}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
