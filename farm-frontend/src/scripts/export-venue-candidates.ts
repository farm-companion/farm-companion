// farm-frontend/src/scripts/export-venue-candidates.ts
// Read-only. Write a county's rows to a CSV for a human to verify by phone.
//
// This is the whole of E7's machinery on the way out. There is no admin UI and
// no review queue because N is 63: at this size you do the work and record it.
//
// The call list is ordered so the rows most likely to pass come first: a row
// with a phone or a website AND a retail Google Places type is a near-certain
// farm shop, and 49 of Cornwall's 63 are in that bucket. The Places types come
// from dist/farms.uk.json, a gitignored pre-loss artifact; they are a sort key
// for a human's afternoon, never evidence. A Places "store" tag proves no more
// about public access than FSA businessTypeId 7838 did.
//
//   pnpm tsx src/scripts/export-venue-candidates.ts            (Cornwall)
//   pnpm tsx src/scripts/export-venue-candidates.ts Somerset
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'
import { isIndexable, type ClaimInput } from '@/lib/farm-claims'
import { toCsv } from '@/lib/csv'

const DEFAULT_COUNTY = 'Cornwall'
const DEFAULT_OFFERING = 'Farm Shops'
const RETAIL_PLACES_TYPES = new Set([
  'grocery_or_supermarket', 'store', 'convenience_store', 'supermarket', 'bakery', 'liquor_store',
])

/** Columns the script fills, then the columns the human fills. */
const COLUMNS = [
  'slug', 'name', 'phone', 'website', 'address', 'postcode',
  'places_types', 'retail_typed', 'would_index',
  'venue_type', 'verified', 'verified_by', 'basis', 'notes',
]

interface PlacesRecord { slug?: string; place_id?: string; types?: string[] }

/**
 * Places types keyed by BOTH slug and place_id, because matching on slug alone
 * misses three of Cornwall's rows whose slug was later regenerated. Returns an
 * empty map when the artifact is absent.
 */
function loadPlacesTypes(): Map<string, string[]> {
  const path = resolve(process.cwd(), '..', 'dist', 'farms.uk.json')
  if (!existsSync(path)) {
    console.warn(`[export] ${path} not found; places_types will be blank.`)
    return new Map()
  }
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(parsed)) return new Map()
  const map = new Map<string, string[]>()
  for (const r of parsed as PlacesRecord[]) {
    if (!Array.isArray(r.types)) continue
    if (r.slug) map.set(r.slug, r.types)
    if (r.place_id) map.set(r.place_id, r.types)
  }
  return map
}

async function main(): Promise<void> {
  const county = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? DEFAULT_COUNTY
  const places = loadPlacesTypes()

  const rows = await prisma.farm.findMany({
    where: { status: 'active', county },
    select: {
      slug: true, name: true, phone: true, website: true, address: true, postcode: true,
      googlePlaceId: true,
      description: true, openingHours: true, venueType: true, venueVerifiedAt: true,
      categories: { select: { category: { select: { name: true } } } },
      images: {
        where: { status: 'approved', uploadedBy: { notIn: ['ai_generator', 'ai_pitti'] } },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  if (rows.length === 0) {
    console.error(`No active rows for county "${county}".`)
    await prisma.$disconnect()
    process.exit(1)
  }

  const records = rows.map((r) => {
    const claim: ClaimInput = {
      venueType: r.venueType,
      venueVerifiedAt: r.venueVerifiedAt,
      openingHours: r.openingHours,
      phone: r.phone,
      website: r.website,
      description: r.description,
      offerings: r.categories.map((c) => c.category.name),
      hasRealImage: r.images.length > 0,
    }
    // Ask the production gate, rather than reimplementing its scoring: would
    // this page be indexable once a human verifies it? 13 of Cornwall's 63
    // answer no, and those are correctly verified-but-unindexed.
    const wouldIndex = isIndexable({ ...claim, venueType: 'shop', venueVerifiedAt: new Date() })
    const types = places.get(r.slug) ?? (r.googlePlaceId ? places.get(r.googlePlaceId) : undefined) ?? []
    const retailTyped = types.some((t) => RETAIL_PLACES_TYPES.has(t))
    return {
      record: {
        slug: r.slug,
        name: r.name,
        phone: r.phone ?? '',
        website: r.website ?? '',
        address: r.address ?? '',
        postcode: r.postcode ?? '',
        places_types: types.join(' '),
        retail_typed: retailTyped ? 'y' : '',
        would_index: wouldIndex ? 'y' : '',
        // Pre-filled only when a human already decided; never guessed.
        venue_type: r.venueType ?? '',
        verified: r.venueVerifiedAt ? 'y' : '',
        verified_by: '',
        basis: '',
        notes: '',
      },
      contactable: Boolean(r.phone || r.website),
      retailTyped,
      wouldIndex,
      offeringCount: claim.offerings.filter((o) => o !== DEFAULT_OFFERING).length,
    }
  })

  // Front-load the afternoon: contactable and retail-typed first, then
  // contactable, then the rest. Within a bucket, indexable first.
  const rank = (c: typeof records[number]) =>
    (c.contactable ? 4 : 0) + (c.retailTyped ? 2 : 0) + (c.wouldIndex ? 1 : 0)
  records.sort((a, b) => rank(b) - rank(a) || a.record.name.localeCompare(b.record.name))

  const dir = resolve(process.cwd(), '..', 'docs', 'verification')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `${county.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`)
  if (existsSync(file)) {
    console.error(`REFUSING TO OVERWRITE ${file}`)
    console.error('That file is the audit trail and may already hold a human\'s work.')
    console.error('Move or delete it deliberately if you really want a fresh export.')
    await prisma.$disconnect()
    process.exit(1)
  }
  writeFileSync(file, toCsv(COLUMNS, records.map((c) => c.record)))

  const contactable = records.filter((c) => c.contactable).length
  const retail = records.filter((c) => c.retailTyped).length
  const indexable = records.filter((c) => c.wouldIndex).length
  console.log(`${county}: ${rows.length} active rows -> ${file}`)
  console.log(`  contactable by phone or website: ${contactable}`)
  console.log(`  carrying a retail Places type:   ${retail}`)
  console.log(`  would be indexable if verified:  ${indexable}`)
  console.log(`\nFill venue_type (shop | pyo | market_stall, or blank for not visitable),`)
  console.log(`verified (y), verified_by and basis. Leave a row blank to skip it.`)
  console.log(`Then: pnpm tsx src/scripts/import-venue-verification.ts ${file}`)
  await prisma.$disconnect()
}

if (/export-venue-candidates\.ts$/.test(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
