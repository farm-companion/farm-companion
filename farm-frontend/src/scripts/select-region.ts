// farm-frontend/src/scripts/select-region.ts
// Read-only: rank counties as launch-region candidates.
//
// The target band is 60 to 150 candidate rows: roughly one working day of
// human verification, and enough listings for a county page to be genuinely
// useful. Below 60 the page is too thin to compete; above 150 verification
// slips past a day and the region stops being a fast proof.
//
// Ranking by row count alone is wrong, and this script used to do it. Row
// count is anti-correlated with quality here: Highland holds 387 active rows
// with zero phone numbers and zero websites, and Dumfries and Galloway holds
// 274 with two of each. Those are the producer-contaminated tails of the FSA
// import. A human cannot verify a row they have no way to contact, so the
// ranking key is the share of rows carrying a phone or a website.
//   pnpm tsx src/scripts/select-region.ts
import { prisma } from '@/lib/prisma'

const MIN_ROWS = 60
const MAX_ROWS = 150

// Mirrors backfill-false-descriptions.ts. A description matching the generated
// template is not evidence of anything, so it does not count as substance.
const TEMPLATE = /^(.+?) is a farm shop in (.+?)\.$/

interface CountyStats {
  county: string
  rows: number
  phone: number
  website: number
  contactable: number
  hours: number
  realDesc: number
}

function pct(n: number, total: number): string {
  return total === 0 ? '  0%' : `${String(Math.round((n / total) * 100)).padStart(3)}%`
}

async function main(): Promise<void> {
  const rows = await prisma.farm.findMany({
    where: { status: 'active', county: { not: null } },
    select: { county: true, phone: true, website: true, openingHours: true, description: true },
  })

  const byCounty = new Map<string, CountyStats>()
  for (const r of rows) {
    const county = r.county as string
    let s = byCounty.get(county)
    if (!s) {
      s = { county, rows: 0, phone: 0, website: 0, contactable: 0, hours: 0, realDesc: 0 }
      byCounty.set(county, s)
    }
    s.rows++
    if (r.phone) s.phone++
    if (r.website) s.website++
    if (r.phone || r.website) s.contactable++
    if (Array.isArray(r.openingHours) && r.openingHours.length > 0) s.hours++
    const d = (r.description ?? '').trim()
    if (d && !TEMPLATE.test(d)) s.realDesc++
  }

  const all = [...byCounty.values()]
  const inBand = all
    .filter((s) => s.rows >= MIN_ROWS && s.rows <= MAX_ROWS)
    // Contactable share decides it; real descriptions break ties.
    .sort((a, b) => b.contactable / b.rows - a.contactable / a.rows
      || b.realDesc / b.rows - a.realDesc / a.rows)

  const header = `  ${'county'.padEnd(34)} ${'rows'.padStart(5)} ${'phone'.padStart(6)} ${'site'.padStart(6)} ${'contact'.padStart(8)} ${'hours'.padStart(6)} ${'desc'.padStart(6)}`
  const line = (s: CountyStats) =>
    `  ${s.county.padEnd(34)} ${String(s.rows).padStart(5)} ${pct(s.phone, s.rows)}   ${pct(s.website, s.rows)}   ${pct(s.contactable, s.rows)}     ${pct(s.hours, s.rows)}   ${pct(s.realDesc, s.rows)}`

  console.log(`counties: ${all.length}; active rows: ${rows.length}\n`)
  console.log(`IN TARGET BAND (${MIN_ROWS}-${MAX_ROWS} rows), ranked by contactable share:`)
  console.log(header)
  if (inBand.length === 0) {
    console.log('  (none; widen the band or group adjacent counties)')
  } else {
    for (const s of inBand) console.log(line(s))
    console.log(`\nRECOMMENDED LAUNCH REGION: ${inBand[0].county}`)
    console.log(`  ${inBand[0].contactable} of ${inBand[0].rows} rows are contactable by phone or website.`)
  }

  console.log('\nFOR CONTRAST, the five largest counties (why row count is the wrong key):')
  console.log(header)
  for (const s of [...all].sort((a, b) => b.rows - a.rows).slice(0, 5)) console.log(line(s))
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
