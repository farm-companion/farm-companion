// farm-frontend/src/scripts/remove-farms.ts
// Reversible deletion of explicitly listed farms (by id), with a JSON backup.
// Dry-run by default. Apply with --apply.
//   pnpm tsx src/scripts/remove-farms.ts --ids=ID1,ID2            # dry-run
//   pnpm tsx src/scripts/remove-farms.ts --ids=ID1,ID2 --apply    # delete
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '@/lib/prisma'

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
}

async function main(): Promise<void> {
  const ids = (arg('ids') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const apply = process.argv.includes('--apply')
  if (ids.length === 0) {
    console.error('No --ids provided. Pass --ids=ID1,ID2 (from audit-non-farm).')
    process.exit(1)
  }

  const rows = await prisma.farm.findMany({
    where: { id: { in: ids } },
    include: { categories: true, images: true },
  })
  console.log(`Matched ${rows.length} of ${ids.length} requested ids:`)
  for (const r of rows) console.log(`  ${r.id}  ${r.name}  (${r.county ?? 'no county'})`)

  if (!apply) {
    console.log('\nDRY RUN. Re-run with --apply to back up and delete.')
    await prisma.$disconnect()
    return
  }

  const dir = resolve(process.cwd(), '.cleanup-backups')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `non-farm-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(rows, null, 2))
  console.log(`\nBacked up ${rows.length} full rows -> ${file}`)

  const result = await prisma.farm.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } })
  console.log(`Deleted ${result.count} farms (cascade removed their category/image links).`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
