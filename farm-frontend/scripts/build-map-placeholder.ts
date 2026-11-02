#!/usr/bin/env tsx
/**
 * Build `public/images/map-placeholder.svg`, the fallback shown when no map
 * can be drawn for a farm.
 *
 * It comes off the same press as every other plate: `renderPlate` from
 * `src/lib/map-plate`, so the inks, weights and the vermilion marker match the
 * real thing. The geometry is invented rather than fetched, because a
 * placeholder must not quietly show a real place's coastline, and because a
 * build step should not depend on Overpass.
 *
 * Run from farm-frontend:  npx tsx scripts/build-map-placeholder.ts
 */
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { renderPlate, type OverpassWay, type LatLng } from '../src/lib/map-plate'

const OUT = join(process.cwd(), 'public', 'images')
const M_PER_DEG = 111_320

/** Lay the shapes out in metres from the centre; the renderer wants degrees. */
const at = (points: [number, number][]): LatLng[] =>
  points.map(([east, north]) => ({ lat: north / M_PER_DEG, lon: east / M_PER_DEG }))

const way = (tags: Record<string, string>, points: [number, number][]): OverpassWay => ({
  type: 'way',
  tags,
  geometry: at(points),
})

// An invented parish: one road through, two lanes off it, and a stream.
// Nowhere in particular, and recognisably a map.
const WAYS: OverpassWay[] = [
  way({ highway: 'primary' }, [
    [-1300, -260], [-700, -140], [-180, 40], [420, 150], [1000, 130], [1300, 90],
  ]),
  way({ highway: 'tertiary' }, [[-620, -150], [-540, 300], [-380, 560]]),
  way({ highway: 'tertiary' }, [[300, 120], [430, -220], [700, -430]]),
  way({ highway: 'residential' }, [[-180, 40], [-120, -330]]),
  way({ waterway: 'stream' }, [
    [-1300, 420], [-820, 330], [-420, 430], [60, 350], [520, 430], [1100, 360], [1300, 400],
  ]),
  way({ natural: 'water' }, [
    [760, -120], [980, -60], [1060, -230], [880, -320], [740, -250],
  ]),
]

async function main(): Promise<void> {
  // 2:1, matching getPlaceholderMapUrl's 400x200 default. The viewBox scales,
  // so one file serves every call site.
  const { svg, featureCount } = renderPlate(WAYS, {
    lat: 0,
    lon: 0,
    radiusM: 1200,
    width: 400,
    height: 200,
    detail: 'full',
    // Invented geometry: it holds no OpenStreetMap data, so it must not
    // carry the ODbL credit.
    attribution: null,
  })
  await mkdir(OUT, { recursive: true })
  const path = join(OUT, 'map-placeholder.svg')
  await writeFile(path, `${svg}\n`)
  console.log(`${featureCount} features -> ${path}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
