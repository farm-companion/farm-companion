#!/usr/bin/env tsx
/**
 * Migrate imageUrl field values to Image table
 *
 * This script finds farms that have an imageUrl column value but no approved
 * images in the Image table, then creates proper Image records for display.
 *
 * Usage: npx tsx scripts/migrate-image-urls.ts [--dry-run]
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface FarmWithImageUrl {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

async function migrateImageUrls() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log('Farm Image URL Migration')
  console.log('='.repeat(50))
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.log('')

  try {
    // Check if imageUrl column exists on farms table
    const columnCheck = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'farms' AND column_name = 'imageUrl'
    `

    if (columnCheck.length === 0) {
      console.log('No imageUrl column found on farms table.')
      console.log('Images should be managed through the Image table relation.')
      return
    }

    console.log('Found imageUrl column on farms table.')

    // Query farms with imageUrl but no approved images
    const farmsWithImageUrl = await prisma.$queryRaw<FarmWithImageUrl[]>`
      SELECT f.id, f.name, f.slug, f."imageUrl"
      FROM farms f
      WHERE f."imageUrl" IS NOT NULL
        AND f."imageUrl" != ''
        AND NOT EXISTS (
          SELECT 1 FROM images i
          WHERE i."farmId" = f.id
            AND i.status = 'approved'
        )
      ORDER BY f.name
    `

    if (farmsWithImageUrl.length === 0) {
      console.log('No farms need migration - all farms with imageUrl already have Image records.')
      return
    }

    console.log(`Found ${farmsWithImageUrl.length} farms with imageUrl but no Image records:`)
    console.log('')

    let migrated = 0
    let errors = 0

    for (const farm of farmsWithImageUrl) {
      console.log(`[${migrated + errors + 1}/${farmsWithImageUrl.length}] ${farm.name}`)
      console.log(`   Slug: ${farm.slug}`)
      console.log(`   Image URL: ${farm.imageUrl?.substring(0, 60)}...`)

      if (isDryRun) {
        console.log('   [DRY RUN] Would create Image record')
        migrated++
        continue
      }

      try {
        await prisma.image.create({
          data: {
            farmId: farm.id,
            url: farm.imageUrl!,
            altText: `${farm.name} farm shop`,
            isHero: true,
            displayOrder: 0,
            uploadedBy: 'migration',
            status: 'approved',
          },
        })
        console.log('   Created Image record')
        migrated++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`   ERROR: ${message}`)
        errors++
      }
    }

    console.log('')
    console.log('='.repeat(50))
    console.log('Migration Summary')
    console.log('='.repeat(50))
    console.log(`Migrated: ${migrated}`)
    console.log(`Errors: ${errors}`)

    if (isDryRun) {
      console.log('')
      console.log('This was a dry run. Run without --dry-run to apply changes.')
    } else {
      console.log('')
      console.log('Migration complete. Farm images should now display on the site.')
    }

  } finally {
    await prisma.$disconnect()
  }
}

migrateImageUrls().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
