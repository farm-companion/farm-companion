// farm-frontend/src/scripts/backfill-false-descriptions.ts
// Null the LLM fallback description on rows that have not been venue-verified.
// That sentence asserts "X is a farm shop in Y" about businesses that are, in
// 65.2% of cases, producers with no public access.
//
// Dry-run by default; --apply writes. Prior values are backed up first so the
// operation replays backwards.
//   pnpm tsx src/scripts/backfill-false-descriptions.ts
//   pnpm tsx src/scripts/backfill-false-descriptions.ts --apply
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'

const TEMPLATE = /^(.+?) is a farm shop in (.+?)\.$/

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const rows = await prisma.farm.findMany({
    where: { venueVerifiedAt: null, description: { not: null } },
    select: { id: true, slug: true, name: true, description: true },
  })
  const hits = rows.filter((r) => TEMPLATE.test((r.description ?? '').trim()))
  console.log(`${rows.length} unverified rows with a description; ${hits.length} match the template.`)
  for (const r of hits.slice(0, 10)) console.log(`  ${r.slug}: ${r.description}`)
  if (hits.length > 10) console.log(`  ... and ${hits.length - 10} more`)

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to back up and null these descriptions.')
    await prisma.$disconnect()
    return
  }

  const dir = resolve(process.cwd(), '.cleanup-backups')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `false-descriptions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(hits, null, 2))
  console.log(`\nBacked up ${hits.length} prior values -> ${file}`)

  const result = await prisma.farm.updateMany({
    where: { id: { in: hits.map((h) => h.id) } },
    data: { description: null },
  })
  console.log(`Nulled ${result.count} descriptions.`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
