#!/usr/bin/env tsx
/**
 * Database Integrity Check Script (Pure SQL)
 *
 * Direct PostgreSQL connection for comprehensive validation without Prisma.
 * Validates data integrity across farms, images, and relationships.
 *
 * Usage: DATABASE_URL="postgresql://..." tsx scripts/check-database-integrity-sql.ts
 */

import { Client } from 'pg'

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

async function checkOrphanedPhotos(client: Client) {
  console.log('\n🔍 Checking for orphaned photos...')

  const result = await client.query(`
    SELECT p.id, p."farmId", p.status
    FROM images p
    LEFT JOIN farms f ON p."farmId" = f.id
    WHERE f.id IS NULL
  `)

  if (result.rows.length > 0) {
    logIssue({
      severity: 'critical',
      category: 'Orphaned Photos',
      message: `Found ${result.rows.length} photos referencing non-existent farms`,
      details: { count: result.rows.length, sample: result.rows.slice(0, 5) }
    })
  } else {
    console.log('✅ No orphaned photos found')
  }
}

async function checkDuplicateSlugs(client: Client) {
  console.log('\n🔍 Checking for duplicate farm slugs...')

  const result = await client.query(`
    SELECT slug, COUNT(*) as count
    FROM farms
    GROUP BY slug
    HAVING COUNT(*) > 1
  `)

  if (result.rows.length > 0) {
    for (const dup of result.rows) {
      logIssue({
        severity: 'critical',
        category: 'Duplicate Slugs',
        message: `Duplicate slug found: ${dup.slug}`,
        details: { slug: dup.slug, count: parseInt(dup.count) }
      })
    }
  } else {
    console.log('✅ No duplicate slugs found')
  }
}

async function checkCoordinateBounds(client: Client) {
  console.log('\n🔍 Checking coordinate bounds (UK: lat 49-61, lng -8-2)...')

  const result = await client.query(`
    SELECT id, name, slug, latitude, longitude
    FROM farms
    WHERE latitude < 49 OR latitude > 61
       OR longitude < -8 OR longitude > 2
  `)

  if (result.rows.length > 0) {
    for (const farm of result.rows) {
      logIssue({
        severity: 'critical',
        category: 'Invalid Coordinates',
        message: `Farm "${farm.name}" has coordinates outside UK bounds`,
        recordId: farm.id,
        details: { slug: farm.slug, lat: parseFloat(farm.latitude), lng: parseFloat(farm.longitude) }
      })
    }
  } else {
    console.log('✅ All coordinates within UK bounds')
  }
}

async function checkRatingBounds(client: Client) {
  console.log('\n🔍 Checking Google rating bounds (0.0-5.0)...')

  const result = await client.query(`
    SELECT id, name, slug, "googleRating"
    FROM farms
    WHERE "googleRating" IS NOT NULL
      AND ("googleRating" < 0.0 OR "googleRating" > 5.0)
  `)

  if (result.rows.length > 0) {
    for (const farm of result.rows) {
      logIssue({
        severity: 'warning',
        category: 'Invalid Rating',
        message: `Farm "${farm.name}" has invalid Google rating`,
        recordId: farm.id,
        details: { slug: farm.slug, rating: parseFloat(farm.googleRating) }
      })
    }
  } else {
    console.log('✅ All ratings within valid bounds')
  }
}

async function checkRequiredFields(client: Client) {
  console.log('\n🔍 Checking required fields (name, latitude, longitude, county)...')

  const result = await client.query(`
    SELECT id, name, slug, latitude, longitude, county
    FROM farms
    WHERE name IS NULL OR name = ''
       OR latitude IS NULL
       OR longitude IS NULL
       OR county IS NULL OR county = ''
  `)

  if (result.rows.length > 0) {
    for (const farm of result.rows) {
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

async function checkStatusEnum(client: Client) {
  console.log('\n🔍 Checking farm status enum (active, pending, suspended)...')

  const result = await client.query(`
    SELECT id, name, status
    FROM farms
    WHERE status NOT IN ('active', 'pending', 'suspended')
  `)

  if (result.rows.length > 0) {
    for (const farm of result.rows) {
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

async function checkPhotoStatus(client: Client) {
  console.log('\n🔍 Checking photo status enum (pending, approved, rejected)...')

  const result = await client.query(`
    SELECT id, "farmId", status
    FROM images
    WHERE status NOT IN ('pending', 'approved', 'rejected')
  `)

  if (result.rows.length > 0) {
    for (const photo of result.rows) {
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

async function checkDatabaseStats(client: Client) {
  console.log('\n📊 Database Statistics...')

  const statsQueries = await Promise.all([
    client.query(`SELECT COUNT(*) as count FROM farms`),
    client.query(`SELECT COUNT(*) as count FROM farms WHERE status = 'active'`),
    client.query(`SELECT COUNT(*) as count FROM farms WHERE status = 'pending'`),
    client.query(`SELECT COUNT(*) as count FROM farms WHERE status = 'suspended'`),
    client.query(`SELECT COUNT(*) as count FROM images`),
    client.query(`SELECT COUNT(*) as count FROM images WHERE status = 'approved'`),
    client.query(`SELECT COUNT(*) as count FROM images WHERE status = 'pending'`),
    client.query(`SELECT COUNT(*) as count FROM images WHERE status = 'rejected'`),
    client.query(`SELECT COUNT(*) as count FROM farms WHERE verified = true`),
    client.query(`SELECT COUNT(*) as count FROM farms WHERE featured = true`)
  ])

  const [
    totalFarms, activeFarms, pendingFarms, suspendedFarms,
    totalPhotos, approvedPhotos, pendingPhotos, rejectedPhotos,
    verifiedFarms, featuredFarms
  ] = statsQueries.map(r => parseInt(r.rows[0].count))

  console.log('✅ Database Summary:')
  console.log(`   Farms: ${totalFarms} total (${activeFarms} active, ${pendingFarms} pending, ${suspendedFarms} suspended)`)
  console.log(`   Verified: ${verifiedFarms} farms`)
  console.log(`   Featured: ${featuredFarms} farms`)
  console.log(`   Photos: ${totalPhotos} total (${approvedPhotos} approved, ${pendingPhotos} pending, ${rejectedPhotos} rejected)`)
}

async function checkGeospatialIndexes(client: Client) {
  console.log('\n🔍 Verifying geospatial indexes exist in database...')

  const result = await client.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'farms'
    AND (
      indexname LIKE '%latitude%' OR
      indexname LIKE '%longitude%' OR
      indexname LIKE '%lat%' OR
      indexname LIKE '%lng%'
    )
  `)

  if (result.rows.length >= 3) {
    console.log(`✅ Found ${result.rows.length} geospatial indexes:`)
    for (const idx of result.rows) {
      console.log(`   - ${idx.indexname}`)
    }
  } else {
    logIssue({
      severity: 'warning',
      category: 'Missing Indexes',
      message: `Expected at least 3 geospatial indexes, found ${result.rows.length}`,
      details: { found: result.rows }
    })
  }
}

async function main() {
  console.log('🚀 Farm Companion Database Integrity Check (Pure SQL)')
  console.log('=' .repeat(60))

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.error('\nUsage:')
    console.error('  DATABASE_URL="postgresql://..." tsx scripts/check-database-integrity-sql.ts')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Run all checks
    await checkDatabaseStats(client)
    await checkOrphanedPhotos(client)
    await checkDuplicateSlugs(client)
    await checkCoordinateBounds(client)
    await checkRatingBounds(client)
    await checkRequiredFields(client)
    await checkStatusEnum(client)
    await checkPhotoStatus(client)
    await checkGeospatialIndexes(client)

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
    await client.end()
  }
}

main()
