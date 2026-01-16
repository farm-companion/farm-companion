/**
 * Data Migration Script
 * Migrates farm data from JSON file to PostgreSQL database
 *
 * Usage: npx tsx scripts/migrate-to-postgres.ts
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface LegacyFarm {
  id: string
  name: string
  slug: string
  description?: string
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    county: string
    postcode: string
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  hours?: Array<{
    day: string
    open: string
    close: string
  }>
  offerings?: string[]
  verified?: boolean | string
  place_id?: string
  rating?: number
  user_ratings_total?: number
  images?: string[]
  updatedAt?: string
}

async function migrate() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...\n')

  try {
    // 1. Read existing farms.json
    const jsonPath = path.join(process.cwd(), 'data', 'farms.json')
    console.log(`📖 Reading farms from: ${jsonPath}`)

    const data = await fs.readFile(jsonPath, 'utf-8')
    const farms: LegacyFarm[] = JSON.parse(data)

    console.log(`✓ Found ${farms.length} farms to migrate\n`)

    // 2. Check database connection
    console.log('🔌 Checking database connection...')
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✓ Database connection successful\n')
    } catch (error) {
      console.error('✗ Database connection failed!')
      console.error('Make sure DATABASE_URL is set in your environment variables')
      throw error
    }

    // 3. Migrate farms
    let migrated = 0
    let errors = 0
    const errorLog: Array<{ farm: string; error: string }> = []

    console.log('📦 Migrating farms...')
    console.log('Progress: 0%')

    for (let i = 0; i < farms.length; i++) {
      const farm = farms[i]

      try {
        // Convert verified field to boolean
        const verified = farm.verified === true || farm.verified === 'true'

        // Create farm record
        await prisma.farm.create({
          data: {
            id: farm.id,
            name: farm.name,
            slug: farm.slug,
            description: farm.description || null,

            // Location
            address: farm.location.address,
            city: farm.location.city || null,
            county: farm.location.county,
            postcode: farm.location.postcode,
            latitude: farm.location.lat,
            longitude: farm.location.lng,

            // Contact
            phone: farm.contact?.phone || null,
            email: farm.contact?.email || null,
            website: farm.contact?.website || null,

            // Google Places
            googlePlaceId: farm.place_id || null,
            googleRating: farm.rating || null,
            googleReviewsCount: farm.user_ratings_total || 0,

            // Metadata
            verified,
            featured: false,
            status: 'active',

            // JSON fields
            openingHours: farm.hours || undefined,
          },
        })

        // Create image records if they exist
        if (farm.images && farm.images.length > 0) {
          await prisma.image.createMany({
            data: farm.images.map((url, index) => ({
              farmId: farm.id,
              url,
              isHero: index === 0,
              displayOrder: index,
              uploadedBy: 'admin',
              status: 'approved',
            })),
          })
        }

        // Create product records from offerings
        if (farm.offerings && farm.offerings.length > 0) {
          await prisma.product.createMany({
            data: farm.offerings.map((offering) => ({
              farmId: farm.id,
              name: offering,
              seasonal: false,
            })),
          })
        }

        migrated++

        // Show progress every 50 farms
        if (migrated % 50 === 0 || migrated === farms.length) {
          const percentage = Math.round((migrated / farms.length) * 100)
          console.log(`Progress: ${percentage}% (${migrated}/${farms.length})`)
        }
      } catch (error: any) {
        errors++
        errorLog.push({
          farm: farm.name,
          error: error.message || 'Unknown error',
        })

        // Log every error
        console.error(`✗ Error migrating "${farm.name}": ${error.message}`)
      }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Complete!')
    console.log('='.repeat(60))
    console.log(`✓ Successfully migrated: ${migrated} farms`)
    console.log(`✗ Errors: ${errors}`)

    if (errors > 0) {
      console.log('\n❌ Errors encountered:')
      errorLog.forEach(({ farm, error }) => {
        console.log(`  - ${farm}: ${error}`)
      })
    }

    // 5. Verify migration
    console.log('\n🔍 Verifying migration...')
    const dbCount = await prisma.farm.count()
    console.log(`Database contains ${dbCount} farms`)

    if (dbCount === migrated) {
      console.log('✓ Migration verification successful!\n')
    } else {
      console.log(`⚠️ Warning: Expected ${migrated} farms but found ${dbCount}\n`)
    }

    // 6. Display statistics
    const stats = await Promise.all([
      prisma.farm.count({ where: { verified: true } }),
      prisma.farm.count({ where: { featured: true } }),
      prisma.image.count(),
      prisma.product.count(),
      prisma.farm.groupBy({
        by: ['county'],
        _count: true,
      }),
    ])

    console.log('📈 Database Statistics:')
    console.log(`  - Verified farms: ${stats[0]}`)
    console.log(`  - Featured farms: ${stats[1]}`)
    console.log(`  - Images: ${stats[2]}`)
    console.log(`  - Products: ${stats[3]}`)
    console.log(`  - Counties covered: ${stats[4].length}`)

    console.log('\n✨ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed with error:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrate()
