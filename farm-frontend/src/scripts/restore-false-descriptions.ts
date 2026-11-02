// farm-frontend/src/scripts/restore-false-descriptions.ts
// Replay a backfill backup backwards, restoring each description to its prior
// value. .cleanup-backups/ is gitignored, so the backup JSON is the only
// record that these sentences ever existed: without this script the backfill
// was effectively one-way.
//
// Dry-run by default; --apply writes.
//   pnpm tsx src/scripts/restore-false-descriptions.ts .cleanup-backups/false-descriptions-<stamp>.json
//   pnpm tsx src/scripts/restore-false-descriptions.ts .cleanup-backups/false-descriptions-<stamp>.json --apply
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'

interface BackupRow {
  id: string
  slug: string
  name: string
  description: string | null
}

function parseBackup(raw: string): BackupRow[] {
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('backup is not an array')
  return parsed.map((r, i) => {
    const row = r as Record<string, unknown>
    if (typeof row.id !== 'string' || typeof row.slug !== 'string') {
      throw new Error(`row ${i} is missing id or slug`)
    }
    if (row.description !== null && typeof row.description !== 'string') {
      throw new Error(`row ${i} has a non-string description`)
    }
    return { id: row.id, slug: row.slug, name: String(row.name ?? ''), description: row.description }
  })
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const path = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!path) {
    console.error('Usage: tsx src/scripts/restore-false-descriptions.ts <backup.json> [--apply]')
    process.exit(1)
  }

  const rows = parseBackup(readFileSync(resolve(path), 'utf8'))
  console.log(`${rows.length} rows in ${path}`)

  // Only restore where the row is still null. A row that has since been given
  // a real description must not be clobbered by a stale backup.
  const current = await prisma.farm.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: { id: true, slug: true, description: true },
  })
  const present = new Set(current.map((c) => c.id))
  const nowNull = new Set(current.filter((c) => c.description === null).map((c) => c.id))
  // The three counts partition the backup exactly, so they must sum to its
  // length. A recovery tool whose numbers overlap is a tool you cannot read
  // under pressure.
  const restorable = rows.filter((r) => nowNull.has(r.id) && r.description !== null)
  const occupied = rows.filter((r) => present.has(r.id) && !nowNull.has(r.id))
  const missing = rows.filter((r) => !present.has(r.id))
  const nullInBackup = rows.filter((r) => nowNull.has(r.id) && r.description === null)

  console.log(`${restorable.length} restorable (row still null, backup has a value).`)
  console.log(`${occupied.length} skipped (row has a description now; not clobbering).`)
  console.log(`${missing.length} skipped (row no longer in the database).`)
  if (nullInBackup.length > 0) {
    console.log(`${nullInBackup.length} skipped (backup value was itself null).`)
  }
  const accounted = restorable.length + occupied.length + missing.length + nullInBackup.length
  if (accounted !== rows.length) {
    throw new Error(`accounting error: ${accounted} of ${rows.length} rows classified`)
  }

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to restore.')
    await prisma.$disconnect()
    return
  }

  let restored = 0
  for (const r of restorable) {
    await prisma.farm.update({ where: { id: r.id }, data: { description: r.description } })
    restored++
  }
  console.log(`Restored ${restored} descriptions.`)
  await prisma.$disconnect()
}

// Ends-with, not includes: the test file path contains this name too, and an
// `includes` check would make a unit test open a connection to the live
// database and run the script for real.
if (/restore-false-descriptions\.ts$/.test(process.argv[1] ?? '')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}

export { parseBackup }
