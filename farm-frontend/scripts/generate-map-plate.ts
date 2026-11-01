#!/usr/bin/env tsx
/**
 * Fetch one map plate from Overpass and write it as SVG.
 *
 * Usage:
 *   npx tsx scripts/generate-map-plate.ts <lat> <lon> <slug> [--radius=1200] [--size=430x630]
 *
 * Overpass is a shared free service. This is a pre-generation tool, run in
 * small batches with a pause between calls; never call it per page request.
 * Output carries an ODbL attribution comment, and any surface that displays a
 * plate must show `PLATE_ATTRIBUTION` visibly.
 */
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { buildOverpassQuery, renderPlate, PLATE_ATTRIBUTION } from '../src/lib/map-plate'
import type { OverpassWay } from '../src/lib/map-plate'

const ENDPOINT = 'https://overpass-api.de/api/interpreter'
const OUT_DIR = join(process.cwd(), 'public', 'images', 'plates')

function flag(name: string, fallback: string): string {
  const found = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : fallback
}

async function main(): Promise<void> {
  const [lat, lon, slug] = process.argv.slice(2)
  if (!lat || !lon || !slug) {
    console.error('Usage: generate-map-plate.ts <lat> <lon> <slug> [--radius=1200] [--size=430x630]')
    process.exit(1)
  }

  const radiusM = Number(flag('radius', '1200'))
  const [width, height] = flag('size', '430x630').split('x').map(Number)
  const query = buildOverpassQuery(Number(lat), Number(lon), radiusM)

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'farm-companion plate generator (https://www.farmcompanion.co.uk)',
    },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!response.ok) {
    console.error(`Overpass returned ${response.status} ${response.statusText}`)
    process.exit(1)
  }

  const payload = (await response.json()) as { elements?: OverpassWay[] }
  const ways = payload.elements ?? []
  const { svg, featureCount } = renderPlate(ways, {
    lat: Number(lat),
    lon: Number(lon),
    radiusM,
    width,
    height,
  })

  await mkdir(OUT_DIR, { recursive: true })
  const path = join(OUT_DIR, `${slug}.svg`)
  await writeFile(path, `<!-- ${PLATE_ATTRIBUTION} -->\n${svg}\n`)

  console.log(`${slug}: ${ways.length} ways fetched, ${featureCount} drawn -> ${path}`)
  if (featureCount === 0) {
    console.warn('  no features: open country, or the radius is too small')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
