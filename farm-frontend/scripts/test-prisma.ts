#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  console.log('Testing Prisma connection...\n')

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✓ Database connection successful\n')

    // Count farms
    const farmCount = await prisma.farm.count()
    console.log(`✓ Found ${farmCount} farms\n`)

    // Get first farm
    const farm = await prisma.farm.findFirst({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (farm) {
      console.log('✓ Sample farm:')
      console.log(`  Name: ${farm.name}`)
      console.log(`  County: ${farm.county}`)
      console.log(`  Verified: ${farm.verified}`)
      console.log(`  Rating: ${farm.googleRating}`)
      console.log(`  Categories: ${farm.categories.length}`)
      console.log(`\n✓ Prisma is working correctly!`)
    }

  } catch (error) {
    console.error('✗ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
