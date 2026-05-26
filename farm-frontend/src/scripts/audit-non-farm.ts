// farm-frontend/src/scripts/audit-non-farm.ts
// Read-only scan: lists active farms whose name/website looks like a known
// non-farm chain (uses the same predicate the ingest parsers now enforce).
// Run: pnpm tsx src/scripts/audit-non-farm.ts
import { prisma } from '@/lib/prisma'
import { isNonFarmChain } from './pipeline/sources/non-farm-chains'

async function main(): Promise<void> {
  const farms = await prisma.farm.findMany({
    where: { status: 'active' },
    select: { id: true, slug: true, name: true, website: true, county: true, dataSource: true },
  })
  const hits = farms.filter((f) => isNonFarmChain({ name: f.name ?? undefined, website: f.website ?? undefined }))
  console.log(`Scanned ${farms.length} active farms; ${hits.length} chain candidate(s):`)
  for (const f of hits) {
    console.log(`  ${f.id}  ${f.dataSource ?? 'null'}  ${f.name}  (${f.county ?? 'no county'})  ${f.slug}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
