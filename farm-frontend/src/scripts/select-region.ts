// farm-frontend/src/scripts/select-region.ts
// Read-only: rank counties as launch-region candidates.
//
// The target band is 60 to 150 candidate rows: roughly one working day of human
// verification, and enough listings for a county page to be genuinely useful.
// Below 60 the page is too thin to compete; above 150 verification slips past a
// day and the region stops being a fast proof.
//   pnpm tsx src/scripts/select-region.ts
import { prisma } from '@/lib/prisma'

const MIN_ROWS = 60
const MAX_ROWS = 150

async function main(): Promise<void> {
  const rows = await prisma.farm.groupBy({
    by: ['county'],
    where: { status: 'active', county: { not: null } },
    _count: { _all: true },
  })
  const ranked = rows
    .map((r) => ({ county: r.county as string, count: r._count._all }))
    .sort((a, b) => b.count - a.count)

  console.log(`counties: ${ranked.length}\n`)
  console.log('IN TARGET BAND (60-150 rows):')
  const inBand = ranked.filter((r) => r.count >= MIN_ROWS && r.count <= MAX_ROWS)
  for (const r of inBand) console.log(`  ${String(r.count).padStart(4)}  ${r.county}`)
  if (inBand.length === 0) console.log('  (none; widen the band or group adjacent counties)')

  console.log('\nFOR CONTEXT (top 15 by row count):')
  for (const r of ranked.slice(0, 15)) {
    const flag = r.count > MAX_ROWS ? 'too many' : r.count < MIN_ROWS ? 'too few' : 'in band'
    console.log(`  ${String(r.count).padStart(4)}  ${r.county}  (${flag})`)
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
