#!/usr/bin/env tsx
/**
 * Check image status for all farms in the database
 *
 * Usage: pnpm tsx src/scripts/check-image-status.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImageStatus() {
  console.log('🖼️  Farm Image Status Report')
  console.log('='.repeat(60))
  console.log('')

  try {
    // Get total farms
    const totalFarms = await prisma.farm.count({
      where: { status: 'active' }
    })

    // Get farms with approved hero images
    const farmsWithHeroImages = await prisma.farm.count({
      where: {
        status: 'active',
        images: {
          some: {
            status: 'approved',
            isHero: true
          }
        }
      }
    })

    // Get farms with any approved images
    const farmsWithAnyImages = await prisma.farm.count({
      where: {
        status: 'active',
        images: {
          some: {
            status: 'approved'
          }
        }
      }
    })

    // Get farms without any images
    const farmsWithoutImages = await prisma.farm.count({
      where: {
        status: 'active',
        images: {
          none: {}
        }
      }
    })

    // Get image counts by source
    const imagesBySource = await prisma.image.groupBy({
      by: ['source'],
      where: { status: 'approved' },
      _count: { id: true }
    })

    // Get image counts by uploadedBy
    const imagesByUploader = await prisma.image.groupBy({
      by: ['uploadedBy'],
      where: { status: 'approved' },
      _count: { id: true }
    })

    // Get pending images
    const pendingImages = await prisma.image.count({
      where: { status: 'pending' }
    })

    // Print summary
    console.log('📊 FARM COVERAGE')
    console.log('-'.repeat(40))
    console.log(`Total active farms:        ${totalFarms}`)
    console.log(`Farms with hero image:     ${farmsWithHeroImages} (${(farmsWithHeroImages/totalFarms*100).toFixed(1)}%)`)
    console.log(`Farms with any image:      ${farmsWithAnyImages} (${(farmsWithAnyImages/totalFarms*100).toFixed(1)}%)`)
    console.log(`Farms WITHOUT images:      ${farmsWithoutImages} (${(farmsWithoutImages/totalFarms*100).toFixed(1)}%)`)
    console.log('')

    console.log('📷 IMAGE SOURCES')
    console.log('-'.repeat(40))
    if (imagesBySource.length === 0) {
      console.log('No images found (source column may not exist yet)')
    } else {
      for (const row of imagesBySource) {
        console.log(`${row.source || 'upload'}: ${row._count.id} images`)
      }
    }
    console.log('')

    console.log('👤 IMAGE UPLOADERS')
    console.log('-'.repeat(40))
    for (const row of imagesByUploader) {
      console.log(`${row.uploadedBy}: ${row._count.id} images`)
    }
    console.log('')

    console.log('⏳ PENDING IMAGES')
    console.log('-'.repeat(40))
    console.log(`Awaiting approval: ${pendingImages}`)
    console.log('')

    // List some farms without images
    if (farmsWithoutImages > 0) {
      console.log('🚫 SAMPLE FARMS WITHOUT IMAGES (first 10)')
      console.log('-'.repeat(40))

      const farmsNeedingImages = await prisma.farm.findMany({
        where: {
          status: 'active',
          images: {
            none: {}
          }
        },
        select: {
          name: true,
          slug: true,
          county: true
        },
        take: 10,
        orderBy: { name: 'asc' }
      })

      for (const farm of farmsNeedingImages) {
        console.log(`  - ${farm.name} (${farm.county}) [${farm.slug}]`)
      }

      if (farmsWithoutImages > 10) {
        console.log(`  ... and ${farmsWithoutImages - 10} more`)
      }
    }

    console.log('')
    console.log('='.repeat(60))
    console.log('')

    // Recommendations
    console.log('💡 RECOMMENDATIONS')
    console.log('-'.repeat(40))

    if (farmsWithoutImages > 0) {
      console.log(`Run: pnpm tsx src/scripts/generate-farm-images.ts --limit=${Math.min(farmsWithoutImages, 50)} --upload`)
      console.log(`This will generate AI images for ${Math.min(farmsWithoutImages, 50)} farms without images.`)
    } else {
      console.log('All farms have images!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImageStatus()
