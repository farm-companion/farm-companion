// Stage 06: diff candidates against the live DB using the pure merge policy.
// Reads the DB read-only; emits a ChangeSet. No writes.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import { matchExisting, mergeFarm } from '../policy/merge-policy'
import { classifyVenue, hasRetailLexeme, isFsaRetailRecent } from '../lib/classify-venue'
import { CURATED_SOURCES, type SourceName } from '../types'
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
    // Venue classification. Only Tier A writes an admitted type; everything else
    // stays unknown so no page can claim visitability without a human.
    //
    // osmShopFarm infers from osmId because parseOverpass already rejects any
    // element without shop=farm, so an osmId implies the tag. If OSM discovery
    // ever widens beyond shop=farm, this inference breaks silently.
    const { venueType, tier } = classifyVenue({
      osmShopFarm: Boolean(c.osmId),
      osmOpeningHours: Boolean(c.fields.openingHours),
      fsaFarmType: Boolean(c.fsaId),
      retailLexeme: hasRetailLexeme(c.fields.name?.value as string | undefined),
      websiteRetailSignal: false,
      placesRetailWithHours: false,
      // E8: the FSA says this is a public-facing premises and names when it was
      // last inspected. Admits only alongside the name signal (E4), never alone.
      fsaRetailRecent: isFsaRetailRecent(c.fsaBusinessType, c.fsaRatingDate),
    })
    const priorVenueType = (match?.fields.venueType as string | undefined) ?? null

    // A HUMAN set venueVerifiedAt after checking this row, and source evidence
    // is exactly what they were checking. Reclassifying under them would void a
    // decision with their name on it.
    //
    // A row counts as a person's decision unless provenance POSITIVELY names a
    // machine as the one who set it. That direction matters both ways: keying on
    // the field alone would freeze every row the pipeline itself verified and
    // treat its own write as a person's, while keying on provenance alone would
    // expose a verification set by hand in SQL, or set before provenance was
    // tracked, which carries no source at all. Wrongly freezing a row costs
    // nothing. Wrongly overwriting a decision with someone's name on it is
    // unrecoverable, so the unknown case fails safe.
    const isMachine = (src: SourceName | undefined): boolean =>
      src != null && !CURATED_SOURCES.has(src)
    const verifiedBy = match?.provenance?.venueVerifiedAt?.source
    const typedBy = match?.provenance?.venueType?.source
    const humanVerified =
      (match?.fields.venueVerifiedAt != null && !isMachine(verifiedBy)) ||
      (typedBy != null && CURATED_SOURCES.has(typedBy))

    if (!humanVerified && venueType !== 'unknown' && venueType !== priorVenueType) {
      change.fields.push({
        field: 'venueType',
        from: priorVenueType,
        to: venueType,
        reason: 'classified from source evidence',
      })
      // mergeFarm froze change.action from its own diff count before this block
      // ran, so a venueType-only change on a matched row would still say 'noop'
      // and 07-load skips noop unconditionally. Promote it or the write is lost.
      if (change.action === 'noop') change.action = 'update'
    }

    // E8 carries an inspection, which no other machine edge does: a regulator
    // physically attended a public-facing premises on a known date. That is a
    // verification event, so it sets venueVerifiedAt and the page may claim.
    //
    // The timestamp is the INSPECTION date, not now. A 23-month-old inspection
    // should read as 23 months old, so any future freshness policy can act on
    // it and so the audit trail does not overstate what was checked when. The
    // OSM Tier A path deliberately does NOT do this: an OSM tag is something
    // someone typed, with no inspection and no date behind it.
    const fsaInspection = isFsaRetailRecent(c.fsaBusinessType, c.fsaRatingDate)
      ? c.fsaRatingDate
      : undefined
    if (!humanVerified && tier === 'A' && fsaInspection && match?.fields.venueVerifiedAt == null) {
      change.fields.push({
        field: 'venueVerifiedAt',
        from: null,
        to: fsaInspection,
        reason: `fsa ${c.fsaBusinessType} inspected ${fsaInspection.slice(0, 10)}`,
      })
      change.provenanceNext.venueVerifiedAt = { source: 'fsa', at: now }
      if (change.action === 'noop') change.action = 'update'
    }
    if (matchKey === 'fuzzy') change.matchKey = 'fuzzy'
    if (c.categories.length > 0) change.categories = c.categories
    if (c.images.length > 0) change.images = c.images
    return change
  })
}

const FIELD_NAMES: FarmFieldName[] = [
  'name', 'description', 'address', 'city', 'county', 'postcode',
  'latitude', 'longitude', 'phone', 'email', 'website', 'openingHours', 'status', 'verified',
  // venueVerifiedAt is read-only to the pipeline: the select already fetched
  // it, but omitting it here meant this loop discarded it, so the merge stage
  // could not see human verification at all. No source produces it and
  // mergeFarm only diffs candidate-present fields, so listing it cannot
  // cause a write.
  'venueType', 'venueVerifiedAt',
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
    venueType: true, venueVerifiedAt: true,
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
