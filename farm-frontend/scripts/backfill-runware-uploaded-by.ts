#!/usr/bin/env tsx
/**
 * Correct the provenance of the 2026-02-01 Runware farm images.
 *
 * scripts/generate-farm-images-direct.ts generated 86 farm images through the
 * Runware API on 2026-02-01 and wrote them with uploadedBy 'admin', keeping
 * the generator's own CDN URL (im.runware.ai) as the permanent url. Two
 * defects follow from that one mistake:
 *
 *   1. 'admin' is a real-photograph label, so selectFarmHeroImage promotes
 *      these rows to the /shop/[slug] hero as style 'photo'. That asserts
 *      "this is what this farm looks like" about an AI illustration, which is
 *      precisely what the imagery law in src/lib/farm-hero-image.ts forbids.
 *   2. The bytes were never downloaded. Runware has since evicted them, so
 *      every one of those heroes is a 404 on production.
 *
 * The fix is data, not code: relabel them 'ai_generator' (the documented
 * label for legacy mixed-style AI rows, suppressed site-wide since Slice
 * 1.1.3c) and reject them, because the files are gone. The existing imagery
 * law then returns null and /shop/[slug] renders its typographic hero.
 *
 * Rows are matched on the generator's CDN host, not on uploadedBy, so a
 * re-run cannot touch a genuine admin photograph.
 *
 * Default mode: READ-ONLY (prints what would change).
 * Live mode: pass --apply to perform the UPDATE inside a transaction.
 *
 * Usage:
 *   npx tsx scripts/backfill-runware-uploaded-by.ts            # read-only audit
 *   npx tsx scripts/backfill-runware-uploaded-by.ts --apply    # commit changes
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * The generation CDN. Matching on the host rather than on uploadedBy keeps
 * the population exact: any row still pointing at the generator's own CDN
 * was never ingested, whatever label it carries.
 */
const RUNWARE_CDN_FRAGMENT = 'im.runware.ai'

/** Where these rows should have been labelled in the first place. */
const CORRECT_LABEL = 'ai_generator'

interface RunwareRow {
  id: string
  url: string
  uploadedBy: string
  status: string
  isHero: boolean
  farmName: string
  farmSlug: string
}

async function main() {
  const apply = process.argv.includes('--apply')

  console.log('Runware farm-image provenance correction')
  console.log('='.repeat(60))
  console.log(`Mode: ${apply ? 'APPLY (will UPDATE rows)' : 'READ-ONLY (no writes)'}`)
  console.log(`Matching url host fragment: ${RUNWARE_CDN_FRAGMENT}`)
  console.log('')

  try {
    const rows = await prisma.$queryRaw<RunwareRow[]>`
      SELECT
        i.id,
        i.url,
        i."uploadedBy",
        i.status,
        i."isHero",
        f.name AS "farmName",
        f.slug AS "farmSlug"
      FROM images i
      JOIN farms f ON f.id = i."farmId"
      WHERE i.url LIKE '%im.runware.ai%'
      ORDER BY f.slug
    `

    if (rows.length === 0) {
      console.log('No rows point at the generation CDN. Nothing to correct.')
      return
    }

    const heroed = rows.filter((r) => r.isHero).length
    const approved = rows.filter((r) => r.status === 'approved').length
    const labelledAsPhoto = rows.filter((r) =>
      ['owner', 'admin', 'user'].includes(r.uploadedBy)
    ).length

    console.log(`Found ${rows.length} row(s) pointing at the generation CDN:`)
    console.log(`  approved:                 ${approved}`)
    console.log(`  isHero:                   ${heroed}`)
    console.log(`  labelled as a photograph: ${labelledAsPhoto}  <- breaks the imagery law`)
    console.log('')

    for (const row of rows.slice(0, 10)) {
      console.log(`  ${row.farmSlug.padEnd(38)}  ${row.uploadedBy.padEnd(8)}  ${row.status}`)
    }
    if (rows.length > 10) console.log(`  ... and ${rows.length - 10} more`)
    console.log('')

    if (!apply) {
      console.log(`Would set uploadedBy='${CORRECT_LABEL}', status='rejected' on ${rows.length} row(s).`)
      console.log('Read-only run. Re-run with --apply to commit the UPDATE.')
      return
    }

    const ids = rows.map((r) => r.id)
    const result = await prisma.$transaction(async (tx) => {
      return tx.image.updateMany({
        where: { id: { in: ids } },
        data: { uploadedBy: CORRECT_LABEL, status: 'rejected' },
      })
    })

    console.log(`Updated ${result.count} row(s). Expected ${rows.length}.`)
    if (result.count !== rows.length) {
      console.error('Mismatch between selected and updated counts. Investigate.')
      process.exitCode = 2
      return
    }

    // Gate F: the whole population must be corrected, or none of it.
    const remaining = await prisma.image.count({
      where: {
        url: { contains: RUNWARE_CDN_FRAGMENT },
        uploadedBy: { in: ['owner', 'admin', 'user'] },
      },
    })
    if (remaining !== 0) {
      console.error(`${remaining} row(s) still carry a photograph label. Investigate.`)
      process.exitCode = 2
      return
    }
    console.log('No generation-CDN row carries a photograph label any more.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
