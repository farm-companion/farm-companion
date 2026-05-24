// Stage 06: diff candidates against the live DB using the pure merge policy.
// Reads the DB read-only; emits a ChangeSet. No writes.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { matchExisting, mergeFarm } from '../policy/merge-policy'
import type { ChangeSet, DbFarm, FarmFieldName, NormalizedCandidate } from '../types'

/** Pure: build the change set from candidates + a DB snapshot. */
export function buildChangeSet(
  candidates: NormalizedCandidate[],
  rows: DbFarm[],
  now: string,
): ChangeSet {
  return candidates.map((c) => {
    const { match, matchKey } = matchExisting(c, rows)
    const change = mergeFarm(match, c, now)
    if (matchKey === 'fuzzy') change.matchKey = 'fuzzy'
    if (c.categories.length > 0) change.categories = c.categories
    if (c.images.length > 0) change.images = c.images
    return change
  })
}

const FIELD_NAMES: FarmFieldName[] = [
  'name', 'description', 'address', 'city', 'county', 'postcode',
  'latitude', 'longitude', 'phone', 'email', 'website', 'openingHours', 'status', 'verified',
]

/** Load a minimal read-only DB snapshot via Prisma. */
export async function loadDbSnapshot(prisma: {
  farm: { findMany: (args: unknown) => Promise<Record<string, unknown>[]> }
}): Promise<DbFarm[]> {
  const rows = await prisma.farm.findMany({ select: {
    id: true, slug: true, osmId: true, fsaId: true, googlePlaceId: true,
    postcode: true, latitude: true, longitude: true, provenance: true,
    name: true, description: true, address: true, city: true, county: true,
    phone: true, email: true, website: true, openingHours: true, status: true, verified: true,
  } }) as Record<string, unknown>[]

  return rows.map((r) => {
    const fields: DbFarm['fields'] = {}
    for (const f of FIELD_NAMES) {
      const v = r[f]
      if (v === undefined) continue
      fields[f] = (v !== null && typeof v === 'object' && typeof (v as Record<string, unknown>).toNumber === 'function')
        ? (v as { toNumber(): number }).toNumber()
        : v
    }
    return {
      id: String(r.id), slug: String(r.slug),
      osmId: (r.osmId as string) ?? null, fsaId: (r.fsaId as string) ?? null,
      googlePlaceId: (r.googlePlaceId as string) ?? null,
      postcode: (r.postcode as string) ?? null,
      latitude: (fields.latitude as number) ?? null,
      longitude: (fields.longitude as number) ?? null,
      provenance: (r.provenance as DbFarm['provenance']) ?? null,
      fields,
    }
  })
}

export async function runMerge(): Promise<ChangeSet> {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const candidates = JSON.parse(readFileSync(resolve(dir, '05-images.json'), 'utf8')) as NormalizedCandidate[]
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const rows = await loadDbSnapshot(prisma as unknown as Parameters<typeof loadDbSnapshot>[0])
    const cs = buildChangeSet(candidates, rows, new Date().toISOString())
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, '06-merge.json'), JSON.stringify(cs, null, 2))
    const counts = cs.reduce((acc, c) => { acc[c.action]++; return acc }, { create: 0, update: 0, noop: 0 } as Record<string, number>)
    log('info', 'merge complete', { stage: '06', ...counts })
    return cs
  } finally {
    await prisma.$disconnect()
  }
}
