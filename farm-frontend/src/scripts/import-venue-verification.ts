// farm-frontend/src/scripts/import-venue-verification.ts
// Load a human's completed verification CSV into venueType and venueVerifiedAt.
//
// This is E7. The evidence graph cannot admit a row: classifyVenue needs OSM
// hours, which exist on zero of 3,504 rows, so a human is not one edge of seven
// but the only one. That makes this script the only writer of a visitability
// claim on the site, which is why it validates hard and refuses on any
// inconsistency rather than importing the rows it happens to understand.
//
// Dry-run by default; --apply writes; --revert undoes what it set.
//   pnpm tsx src/scripts/import-venue-verification.ts ../docs/verification/cornwall.csv
//   pnpm tsx src/scripts/import-venue-verification.ts ../docs/verification/cornwall.csv --apply
//   pnpm tsx src/scripts/import-venue-verification.ts ../docs/verification/cornwall.csv --revert --apply
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'
import { ADMITTED_VENUE_TYPES } from '@/lib/farm-claims'
import { parseCsvRecords } from '@/lib/csv'

const SOURCE = 'admin'
const YES = new Set(['y', 'yes', 'true', '1'])
const NO = new Set(['', 'n', 'no', 'false', '0'])

interface Pass {
  slug: string
  venueType: string
  verifiedBy: string
  basis: string
}

export interface Parsed {
  passes: Pass[]
  /** Rows carrying a proposed venue_type that nobody has signed yet. */
  unsigned: string[]
  declined: string[]
  errors: string[]
}

/**
 * Turn CSV records into passes, declines and errors.
 *
 * Exported and pure: the validation IS the safety of this script, so it is
 * tested directly rather than through a database.
 */
export function parseVerification(records: Record<string, string>[]): Parsed {
  const passes: Pass[] = []
  const unsigned: string[] = []
  const declined: string[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  records.forEach((r, i) => {
    const line = i + 2 // header is line 1
    const slug = (r.slug ?? '').trim()
    if (!slug) { errors.push(`line ${line}: no slug`); return }
    if (seen.has(slug)) { errors.push(`line ${line}: duplicate slug ${slug}`); return }
    seen.add(slug)

    const verified = (r.verified ?? '').trim().toLowerCase()
    const venueType = (r.venue_type ?? '').trim().toLowerCase()
    const verifiedBy = (r.verified_by ?? '').trim()
    const basis = (r.basis ?? '').trim()

    if (NO.has(verified)) {
      // A venue_type with no verification is a PROPOSAL: the enrichment script
      // pre-fills it from the farm's own website so a person reviews a finding
      // instead of doing the research. Unsigned, it does nothing, and the count
      // is reported so a part-done file is obvious.
      //
      // A verifier's name or basis without the flag is different: that is a row
      // someone started and left, and it is an error rather than a proposal.
      if (verifiedBy || basis) {
        errors.push(`line ${line} (${slug}): verified_by or basis is filled but verified is blank`)
      } else if (venueType) {
        unsigned.push(slug)
      } else {
        declined.push(slug)
      }
      return
    }
    if (!YES.has(verified)) {
      errors.push(`line ${line} (${slug}): verified must be y or blank, got "${r.verified}"`)
      return
    }
    if (!ADMITTED_VENUE_TYPES.has(venueType)) {
      errors.push(
        `line ${line} (${slug}): venue_type must be one of ` +
        `${[...ADMITTED_VENUE_TYPES].join(' | ')}, got "${r.venue_type}"`,
      )
      return
    }
    // The audit trail is the point of this file. A verification nobody signed
    // cannot answer "who said my farm is open to the public?".
    if (!verifiedBy) { errors.push(`line ${line} (${slug}): verified_by is required when verified is y`); return }
    if (!basis) { errors.push(`line ${line} (${slug}): basis is required when verified is y`); return }

    passes.push({ slug, venueType, verifiedBy, basis })
  })

  return { passes, unsigned, declined, errors }
}

type ProvenanceMap = Record<string, { source: string; at: string }>

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const revert = process.argv.includes('--revert')
  const path = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!path) {
    console.error('Usage: tsx src/scripts/import-venue-verification.ts <verification.csv> [--apply] [--revert]')
    process.exit(1)
  }

  const records = parseCsvRecords(readFileSync(resolve(path), 'utf8'))
  const { passes, unsigned, declined, errors } = parseVerification(records)

  console.log(`${records.length} rows in ${path}`)
  console.log(`  ${passes.length} verified as visitable`)
  console.log(`  ${unsigned.length} PROPOSED but not signed yet (nothing will be written for these)`)
  console.log(`  ${declined.length} left blank (not visitable, or not yet checked)`)

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s). Nothing was imported:`)
    for (const e of errors) console.error(`  ${e}`)
    await prisma.$disconnect()
    process.exit(1)
  }

  // Every slug must exist. A typo would otherwise be a silent no-op.
  const slugs = revert ? records.map((r) => r.slug).filter(Boolean) : passes.map((p) => p.slug)
  const rows = await prisma.farm.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, venueType: true, venueVerifiedAt: true, provenance: true },
  })
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const unknown = slugs.filter((s) => !bySlug.has(s))
  if (unknown.length > 0) {
    console.error(`\n${unknown.length} slug(s) not in the database. Nothing was imported:`)
    for (const s of unknown) console.error(`  ${s}`)
    await prisma.$disconnect()
    process.exit(1)
  }

  if (revert) {
    // Only undo what this script set. A row verified by anything else is not
    // ours to clear.
    const ours = rows.filter((r) => {
      const p = (r.provenance ?? {}) as ProvenanceMap
      return r.venueVerifiedAt != null && p.venueVerifiedAt?.source === SOURCE
    })
    const foreign = rows.filter((r) => r.venueVerifiedAt != null && !ours.includes(r))
    console.log(`\nREVERT: ${ours.length} row(s) set by this script; ${foreign.length} verified elsewhere, left alone.`)
    for (const r of ours) console.log(`  ${r.slug} (${r.venueType})`)
    if (!apply) {
      console.log('\nDRY RUN. Add --apply to revert.')
      await prisma.$disconnect()
      return
    }
    for (const r of ours) {
      const p = { ...((r.provenance ?? {}) as ProvenanceMap) }
      delete p.venueType
      delete p.venueVerifiedAt
      await prisma.farm.update({
        where: { id: r.id },
        data: { venueType: null, venueVerifiedAt: null, provenance: p },
      })
    }
    console.log(`Reverted ${ours.length} row(s).`)
    await prisma.$disconnect()
    return
  }

  const now = new Date()
  const changing = passes.filter((p) => {
    const row = bySlug.get(p.slug)!
    return row.venueType !== p.venueType || row.venueVerifiedAt == null
  })
  console.log(`\n${changing.length} row(s) will change:`)
  for (const p of changing) {
    const row = bySlug.get(p.slug)!
    const from = row.venueVerifiedAt ? `${row.venueType} (verified)` : `${row.venueType ?? 'unknown'} (unverified)`
    console.log(`  ${p.slug}: ${from} -> ${p.venueType} verified by ${p.verifiedBy} (${p.basis})`)
  }
  if (changing.length < passes.length) {
    console.log(`${passes.length - changing.length} already match and will be left alone.`)
  }

  if (!apply) {
    console.log('\nDRY RUN. Add --apply to write.')
    console.log(`Revert with: --revert --apply`)
    await prisma.$disconnect()
    return
  }

  for (const p of changing) {
    const row = bySlug.get(p.slug)!
    const provenance = {
      ...((row.provenance ?? {}) as ProvenanceMap),
      venueType: { source: SOURCE, at: now.toISOString() },
      venueVerifiedAt: { source: SOURCE, at: now.toISOString() },
    }
    await prisma.farm.update({
      where: { id: row.id },
      data: { venueType: p.venueType, venueVerifiedAt: now, provenance },
    })
  }
  console.log(`\nVerified ${changing.length} row(s) at ${now.toISOString()}.`)
  console.log('Commit the CSV: it is the only record of who decided and why.')
  await prisma.$disconnect()
}

if (/import-venue-verification\.ts$/.test(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
