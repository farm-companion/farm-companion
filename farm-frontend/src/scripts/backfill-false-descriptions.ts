// farm-frontend/src/scripts/backfill-false-descriptions.ts
// Null the generated fallback description on rows that have not been
// venue-verified. That sentence asserts "X is a farm shop in Y" about
// businesses that are, in most cases, producers with no public access.
//
// Defence in depth, not the primary fix: the shop page already replaces an
// unverified row's description with the producer sentence (farm-claims.ts), so
// nothing here reaches a visitor. That means the rule can afford to be strict
// and spare anything doubtful.
//
// Dry-run by default; --apply writes. Prior values are backed up first, and
// restore-false-descriptions.ts replays the backup backwards.
//   pnpm tsx src/scripts/backfill-false-descriptions.ts
//   pnpm tsx src/scripts/backfill-false-descriptions.ts --apply
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'

const TEMPLATE = /^(.+?) is a farm shop in (.+?)\.$/

// Applied ONLY to the place clause after "in ", never to the whole sentence.
// Business names are arbitrary: "With The Wild CIC", "Hi Sell Direct", "The
// Curry Pincher Also Trading As CJW Catering", and names ending in an initial
// ("A. Croskell Ltd") all trip a whole-string check and would be spared for no
// reason. Measured against live data: whole-string sparing 36 rows of which
// only 8 held real content; tail-only spares exactly those 8.
// "and" is deliberately absent: real counties contain it ("Dumfries and
// Galloway", "Perth and Kinross", "Bath and North East Somerset").
const PROSE = /\b(selling|sells|sell|offering|offers|including|includes|stocks|stocking|serving|serves|available|open|with|that|has|features)\b/i

/** A second sentence after the place clause means the row says something real. */
const MULTI_SENTENCE = /\.\s+\S/

/**
 * True when a description is the generated template and nothing more.
 *
 * Exported for the test: the rule is the whole risk surface of this script, so
 * it is a pure function rather than an inline filter.
 */
export function isGeneratedTemplate(description: string | null | undefined): boolean {
  const text = (description ?? '').trim()
  const match = TEMPLATE.exec(text)
  if (!match) return false
  const placeClause = match[2]
  if (MULTI_SENTENCE.test(placeClause)) return false
  if (PROSE.test(placeClause)) return false
  return true
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const rows = await prisma.farm.findMany({
    where: { venueVerifiedAt: null, description: { not: null } },
    select: { id: true, slug: true, name: true, description: true },
  })
  const loose = rows.filter((r) => TEMPLATE.test((r.description ?? '').trim()))
  const hits = rows.filter((r) => isGeneratedTemplate(r.description))
  const spared = loose.filter((r) => !hits.includes(r))

  console.log(`${rows.length} unverified rows with a description.`)
  console.log(`${loose.length} match the template loosely; ${hits.length} are template and nothing more.`)
  console.log(`${spared.length} spared because they carry real content:`)
  for (const r of spared) console.log(`  ${r.slug}: ${(r.description ?? '').trim().slice(0, 120)}`)

  console.log('\nSample of rows that WILL be nulled:')
  for (const r of hits.slice(0, 10)) console.log(`  ${r.slug}: ${r.description}`)
  if (hits.length > 10) console.log(`  ... and ${hits.length - 10} more`)

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to back up and null these descriptions.')
    await prisma.$disconnect()
    return
  }

  // Backup first, synchronously, so any filesystem failure exits before the
  // write. The restore script reads exactly this shape.
  const dir = resolve(process.cwd(), '.cleanup-backups')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `false-descriptions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(hits, null, 2))
  console.log(`\nBacked up ${hits.length} prior values -> ${file}`)
  console.log('Copy that file off this machine before continuing to trust it.')

  const result = await prisma.farm.updateMany({
    where: { id: { in: hits.map((h) => h.id) } },
    data: { description: null },
  })
  console.log(`Nulled ${result.count} descriptions.`)
  console.log(`Restore with: pnpm tsx src/scripts/restore-false-descriptions.ts ${file} --apply`)
  await prisma.$disconnect()
}

// Only run when invoked directly, so the test can import the rule.
// Ends-with, not includes: the test file path contains this name too, and an
// `includes` check would make a unit test open a connection to the live
// database and run the script for real.
if (/backfill-false-descriptions\.ts$/.test(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
