#!/usr/bin/env tsx
/**
 * Database Integrity Check Script
 *
 * Comprehensive validation of Supabase/Prisma database integrity:
 * - Orphaned photos (photos referencing non-existent farms)
 * - Invalid coordinates (outside UK bounds)
 * - Duplicate slugs
 * - Constraint violations (rating bounds, status enums)
 * - Missing required fields
 * - Geospatial index verification
 *
 * Usage: tsx scripts/check-database-integrity.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

interface IntegrityIssue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  message: string
  recordId?: string
  details?: Record<string, any>
}

const issues: IntegrityIssue[] = []

function logIssue(issue: IntegrityIssue) {
  issues.push(issue)
  const icon = issue.severity === 'critical' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'
  console.log(`${icon} [${issue.category}] ${issue.message}`)
  if (issue.details) {
    console.log(`   Details:`, JSON.stringify(issue.details, null, 2))
  }
}

async function checkOrphanedPhotos() {
  console.log('\n🔍 Checking for orphaned photos...')

  // Find photos with farmId that doesn't exist in farms table
  // Note: Schema has onDelete: Cascade, so orphans shouldn't exist, but good to verify
  const orphanedPhotos = await prisma.$queryRaw<Array<{id: string, farmId: string, status: string}>>`
    SELECT p.id, p."farmId", p.status
    FROM "images" p
    LEFT JOIN "farms" f ON p."farmId" = f.id
    WHERE f.id IS NULL
  `

  if (orphanedPhotos.length > 0) {
    logIssue({
      severity: 'critical',
      category: 'Orphaned Photos',
      message: `Found ${orphanedPhotos.length} photos referencing non-existent farms`,
      details: { count: orphanedPhotos.length, sample: orphanedPhotos.slice(0, 5) }
    })
  } else {
    console.log('✅ No orphaned photos found')
  }
}

async function checkDuplicateSlugs() {
  console.log('\n🔍 Checking for duplicate farm slugs...')

  const duplicateSlugs = await prisma.$queryRaw<Array<{slug: string, count: bigint}>>`
    SELECT slug, COUNT(*) as count
    FROM "farms"
    GROUP BY slug
    HAVING COUNT(*) > 1
  `

  if (duplicateSlugs.length > 0) {
    for (const dup of duplicateSlugs) {
      logIssue({
        severity: 'critical',
        category: 'Duplicate Slugs',
        message: `Duplicate slug found: ${dup.slug}`,
        details: { slug: dup.slug, count: Number(dup.count) }
      })
    }
  } else {
    console.log('✅ No duplicate slugs found')
  }
}

async function checkCoordinateBounds() {
  console.log('\n🔍 Checking coordinate bounds (UK: lat 49-61, lng -8-2)...')

  const invalidCoordinates = await prisma.farm.findMany({
    where: {
      OR: [
        { latitude: { lt: 49 } },
        { latitude: { gt: 61 } },
        { longitude: { lt: -8 } },
        { longitude: { gt: 2 } },
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      latitude: true,
      longitude: true
    }
  })

  if (invalidCoordinates.length > 0) {
    for (const farm of invalidCoordinates) {
      logIssue({
        severity: 'critical',
        category: 'Invalid Coordinates',
        message: `Farm "${farm.name}" has coordinates outside UK bounds`,
        recordId: farm.id,
        details: { slug: farm.slug, lat: farm.latitude, lng: farm.longitude }
      })
    }
  } else {
    console.log('✅ All coordinates within UK bounds')
  }
}

async function checkRatingBounds() {
  console.log('\n🔍 Checking Google rating bounds (0.0-5.0)...')

  const invalidRatings = await prisma.farm.findMany({
    where: {
      googleRating: {
        not: null,
        OR: [
          { lt: 0.0 },
          { gt: 5.0 }
        ]
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      googleRating: true
    }
  })

  if (invalidRatings.length > 0) {
    for (const farm of invalidRatings) {
      logIssue({
        severity: 'warning',
        category: 'Invalid Rating',
        message: `Farm "${farm.name}" has invalid Google rating`,
        recordId: farm.id,
        details: { slug: farm.slug, rating: farm.googleRating }
      })
    }
  } else {
    console.log('✅ All ratings within valid bounds')
  }
}

async function checkRequiredFields() {
  console.log('\n🔍 Checking required fields (name, latitude, longitude, county)...')

  const missingFields = await prisma.farm.findMany({
    where: {
      OR: [
        { name: null },
        { name: '' },
        { latitude: null },
        { longitude: null },
        { county: null },
        { county: '' }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      latitude: true,
      longitude: true,
      county: true
    }
  })

  if (missingFields.length > 0) {
    for (const farm of missingFields) {
      const missing: string[] = []
      if (!farm.name) missing.push('name')
      if (!farm.latitude) missing.push('latitude')
      if (!farm.longitude) missing.push('longitude')
      if (!farm.county) missing.push('county')

      logIssue({
        severity: 'critical',
        category: 'Missing Required Fields',
        message: `Farm ${farm.slug || farm.id} missing required fields: ${missing.join(', ')}`,
        recordId: farm.id,
        details: { slug: farm.slug, missingFields: missing }
      })
    }
  } else {
    console.log('✅ All farms have required fields')
  }
}

async function checkStatusEnum() {
  console.log('\n🔍 Checking farm status enum (active, pending, suspended)...')

  const invalidStatus = await prisma.$queryRaw<Array<{id: string, name: string, status: string}>>`
    SELECT id, name, status
    FROM "farms"
    WHERE status NOT IN ('active', 'pending', 'suspended')
  `

  if (invalidStatus.length > 0) {
    for (const farm of invalidStatus) {
      logIssue({
        severity: 'critical',
        category: 'Invalid Status',
        message: `Farm "${farm.name}" has invalid status: ${farm.status}`,
        recordId: farm.id,
        details: { status: farm.status }
      })
    }
  } else {
    console.log('✅ All farm statuses are valid')
  }
}

async function checkPhotoStatus() {
  console.log('\n🔍 Checking photo status enum (pending, approved, rejected)...')

  const invalidPhotoStatus = await prisma.$queryRaw<Array<{id: string, farmId: string, status: string}>>`
    SELECT id, "farmId", status
    FROM "images"
    WHERE status NOT IN ('pending', 'approved', 'rejected')
  `

  if (invalidPhotoStatus.length > 0) {
    for (const photo of invalidPhotoStatus) {
      logIssue({
        severity: 'critical',
        category: 'Invalid Photo Status',
        message: `Photo for farm "${photo.farmId}" has invalid status: ${photo.status}`,
        recordId: photo.id,
        details: { farmId: photo.farmId, status: photo.status }
      })
    }
  } else {
    console.log('✅ All photo statuses are valid')
  }
}

async function checkDatabaseStats() {
  console.log('\n📊 Database Statistics...')

  const [
    totalFarms,
    activeFarms,
    pendingFarms,
    suspendedFarms,
    totalPhotos,
    approvedPhotos,
    pendingPhotos,
    rejectedPhotos,
    verifiedFarms,
    featuredFarms
  ] = await Promise.all([
    prisma.farm.count(),
    prisma.farm.count({ where: { status: 'active' } }),
    prisma.farm.count({ where: { status: 'pending' } }),
    prisma.farm.count({ where: { status: 'suspended' } }),
    prisma.image.count(),
    prisma.image.count({ where: { status: 'approved' } }),
    prisma.image.count({ where: { status: 'pending' } }),
    prisma.image.count({ where: { status: 'rejected' } }),
    prisma.farm.count({ where: { verified: true } }),
    prisma.farm.count({ where: { featured: true } })
  ])

  console.log('✅ Database Summary:')
  console.log(`   Farms: ${totalFarms} total (${activeFarms} active, ${pendingFarms} pending, ${suspendedFarms} suspended)`)
  console.log(`   Verified: ${verifiedFarms} farms`)
  console.log(`   Featured: ${featuredFarms} farms`)
  console.log(`   Photos: ${totalPhotos} total (${approvedPhotos} approved, ${pendingPhotos} pending, ${rejectedPhotos} rejected)`)
}

async function checkGeospatialIndexes() {
  console.log('\n🔍 Verifying geospatial indexes exist in schema...')

  // Query Prisma schema indexes (this checks if indexes are defined, not if they exist in DB)
  // In production, you'd query the actual database indexes with:
  // SELECT * FROM pg_indexes WHERE tablename = 'farms' AND indexname LIKE '%lat%'

  const indexQuery = await prisma.$queryRaw<Array<{indexname: string}>>`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'farms'
    AND (
      indexname LIKE '%latitude%' OR
      indexname LIKE '%longitude%' OR
      indexname LIKE '%lat%' OR
      indexname LIKE '%lng%'
    )
  `

  if (indexQuery.length >= 3) {
    console.log(`✅ Found ${indexQuery.length} geospatial indexes:`)
    for (const idx of indexQuery) {
      console.log(`   - ${idx.indexname}`)
    }
  } else {
    logIssue({
      severity: 'warning',
      category: 'Missing Indexes',
      message: `Expected at least 3 geospatial indexes, found ${indexQuery.length}`,
      details: { found: indexQuery }
    })
  }
}

async function main() {
  console.log('🚀 Farm Companion Database Integrity Check')
  console.log('=' .repeat(60))

  try {
    // Run all checks
    await checkDatabaseStats()
    await checkOrphanedPhotos()
    await checkDuplicateSlugs()
    await checkCoordinateBounds()
    await checkRatingBounds()
    await checkRequiredFields()
    await checkStatusEnum()
    await checkPhotoStatus()
    await checkGeospatialIndexes()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 INTEGRITY CHECK SUMMARY')
    console.log('='.repeat(60))

    const critical = issues.filter(i => i.severity === 'critical')
    const warnings = issues.filter(i => i.severity === 'warning')
    const info = issues.filter(i => i.severity === 'info')

    if (issues.length === 0) {
      console.log('✅ All checks passed! Database integrity is excellent.')
    } else {
      console.log(`\nTotal Issues Found: ${issues.length}`)
      if (critical.length > 0) console.log(`  ❌ Critical: ${critical.length}`)
      if (warnings.length > 0) console.log(`  ⚠️  Warnings: ${warnings.length}`)
      if (info.length > 0) console.log(`  ℹ️  Info: ${info.length}`)

      console.log('\nRecommendations:')
      if (critical.length > 0) {
        console.log('  1. Address CRITICAL issues immediately before deploying to production')
      }
      if (warnings.length > 0) {
        console.log('  2. Review and fix WARNING issues to improve data quality')
      }
      if (issues.some(i => i.category === 'Orphaned Photos')) {
        console.log('  3. Run cleanup script to remove orphaned photos')
      }
      if (issues.some(i => i.category === 'Duplicate Slugs')) {
        console.log('  4. Investigate and merge duplicate farm entries')
      }
    }

    console.log('\n✨ Check complete!')

    // Exit with error code if critical issues found
    if (critical.length > 0) {
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error running integrity check:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
