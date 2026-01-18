/**
 * Prisma Database Seed Script
 *
 * Seeds the database with initial seasonal produce data.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import { PRODUCE_SEED_DATA } from './seed-data/produce'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Seed Produce table
  console.log(`Seeding ${PRODUCE_SEED_DATA.length} produce items...`)

  for (const produce of PRODUCE_SEED_DATA) {
    await prisma.produce.upsert({
      where: { slug: produce.slug },
      update: {
        name: produce.name,
        description: produce.description,
        category: produce.category,
        seasonStart: produce.seasonStart,
        seasonEnd: produce.seasonEnd,
        icon: produce.icon,
        imageUrl: produce.imageUrl,
        displayOrder: produce.displayOrder,
        seasonalPageSlug: produce.seasonalPageSlug,
      },
      create: {
        name: produce.name,
        slug: produce.slug,
        description: produce.description,
        category: produce.category,
        seasonStart: produce.seasonStart,
        seasonEnd: produce.seasonEnd,
        icon: produce.icon,
        imageUrl: produce.imageUrl,
        displayOrder: produce.displayOrder,
        seasonalPageSlug: produce.seasonalPageSlug,
      },
    })
    console.log(`  - ${produce.name} (${produce.slug})`)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
