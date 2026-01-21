/**
 * Data Validation Script
 * Run this BEFORE applying CHECK constraints migration
 * Queue 9 Slice 4: Database constraints and validation
 *
 * Usage:
 *   cd farm-frontend
 *   npx tsx scripts/validate-constraints.ts
 *
 * This script checks if existing data complies with the CHECK constraints
 * that will be added via migration. All checks should return 0 issues.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ValidationIssue {
  table: string
  issue: string
  id: string
  details: string
}

async function validateData() {
  const issues: ValidationIssue[] = []

  console.log('🔍 Validating existing data against CHECK constraints...\n')

  // =========================================================================
  // FARM TABLE VALIDATION
  // =========================================================================

  console.log('Validating farms table...')

  // Check latitude bounds
  const invalidLatitude = await prisma.$queryRaw<Array<{ id: string; name: string; latitude: number }>>`
    SELECT id, name, latitude::float as latitude
    FROM farms
    WHERE latitude < -90 OR latitude > 90
  `
  invalidLatitude.forEach(farm => {
    issues.push({
      table: 'farms',
      issue: 'Invalid latitude (must be >= -90 and <= 90)',
      id: farm.id,
      details: `${farm.name}: latitude = ${farm.latitude}`
    })
  })

  // Check longitude bounds
  const invalidLongitude = await prisma.$queryRaw<Array<{ id: string; name: string; longitude: number }>>`
    SELECT id, name, longitude::float as longitude
    FROM farms
    WHERE longitude < -180 OR longitude > 180
  `
  invalidLongitude.forEach(farm => {
    issues.push({
      table: 'farms',
      issue: 'Invalid longitude (must be >= -180 and <= 180)',
      id: farm.id,
      details: `${farm.name}: longitude = ${farm.longitude}`
    })
  })

  // Check Google rating bounds
  const invalidRating = await prisma.$queryRaw<Array<{ id: string; name: string; googleRating: number }>>`
    SELECT id, name, "googleRating"::float as "googleRating"
    FROM farms
    WHERE "googleRating" IS NOT NULL
      AND ("googleRating" < 0.0 OR "googleRating" > 5.0)
  `
  invalidRating.forEach(farm => {
    issues.push({
      table: 'farms',
      issue: 'Invalid Google rating (must be >= 0.0 and <= 5.0)',
      id: farm.id,
      details: `${farm.name}: googleRating = ${farm.googleRating}`
    })
  })

  // Check status enum
  const invalidFarmStatus = await prisma.$queryRaw<Array<{ id: string; name: string; status: string }>>`
    SELECT id, name, status
    FROM farms
    WHERE status NOT IN ('active', 'pending', 'suspended')
  `
  invalidFarmStatus.forEach(farm => {
    issues.push({
      table: 'farms',
      issue: 'Invalid status (must be active, pending, or suspended)',
      id: farm.id,
      details: `${farm.name}: status = ${farm.status}`
    })
  })

  console.log(`  ✓ Farms validated (${invalidLatitude.length + invalidLongitude.length + invalidRating.length + invalidFarmStatus.length} issues)\n`)

  // =========================================================================
  // IMAGE TABLE VALIDATION
  // =========================================================================

  console.log('Validating images table...')

  const invalidImageStatus = await prisma.$queryRaw<Array<{ id: string; farmId: string; status: string }>>`
    SELECT id, "farmId", status
    FROM images
    WHERE status NOT IN ('pending', 'approved', 'rejected')
  `
  invalidImageStatus.forEach(image => {
    issues.push({
      table: 'images',
      issue: 'Invalid status (must be pending, approved, or rejected)',
      id: image.id,
      details: `farmId = ${image.farmId}: status = ${image.status}`
    })
  })

  console.log(`  ✓ Images validated (${invalidImageStatus.length} issues)\n`)

  // =========================================================================
  // REVIEW TABLE VALIDATION
  // =========================================================================

  console.log('Validating reviews table...')

  const invalidReviewRating = await prisma.$queryRaw<Array<{ id: string; farmId: string; rating: number }>>`
    SELECT id, "farmId", rating
    FROM reviews
    WHERE rating < 1 OR rating > 5
  `
  invalidReviewRating.forEach(review => {
    issues.push({
      table: 'reviews',
      issue: 'Invalid rating (must be >= 1 and <= 5)',
      id: review.id,
      details: `farmId = ${review.farmId}: rating = ${review.rating}`
    })
  })

  const invalidReviewStatus = await prisma.$queryRaw<Array<{ id: string; farmId: string; status: string }>>`
    SELECT id, "farmId", status
    FROM reviews
    WHERE status NOT IN ('pending', 'approved', 'rejected')
  `
  invalidReviewStatus.forEach(review => {
    issues.push({
      table: 'reviews',
      issue: 'Invalid status (must be pending, approved, or rejected)',
      id: review.id,
      details: `farmId = ${review.farmId}: status = ${review.status}`
    })
  })

  console.log(`  ✓ Reviews validated (${invalidReviewRating.length + invalidReviewStatus.length} issues)\n`)

  // =========================================================================
  // BLOG_POSTS TABLE VALIDATION
  // =========================================================================

  console.log('Validating blog_posts table...')

  const invalidBlogStatus = await prisma.$queryRaw<Array<{ id: string; title: string; status: string }>>`
    SELECT id, title, status
    FROM blog_posts
    WHERE status NOT IN ('draft', 'published', 'archived')
  `
  invalidBlogStatus.forEach(post => {
    issues.push({
      table: 'blog_posts',
      issue: 'Invalid status (must be draft, published, or archived)',
      id: post.id,
      details: `${post.title}: status = ${post.status}`
    })
  })

  console.log(`  ✓ Blog posts validated (${invalidBlogStatus.length} issues)\n`)

  // =========================================================================
  // RESULTS
  // =========================================================================

  console.log('═'.repeat(80))
  console.log(`\n📊 Validation Summary: ${issues.length} total issues found\n`)

  if (issues.length === 0) {
    console.log('✅ All data is valid! Safe to apply CHECK constraints migration.\n')
    console.log('To apply the migration, run:')
    console.log('  cd farm-frontend')
    console.log('  npx prisma migrate deploy')
    console.log()
    return true
  } else {
    console.log('❌ Data validation failed. Fix these issues before applying constraints:\n')

    // Group issues by table
    const issuesByTable = issues.reduce((acc, issue) => {
      if (!acc[issue.table]) acc[issue.table] = []
      acc[issue.table].push(issue)
      return acc
    }, {} as Record<string, ValidationIssue[]>)

    for (const [table, tableIssues] of Object.entries(issuesByTable)) {
      console.log(`\n${table} (${tableIssues.length} issues):`)
      tableIssues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue.issue}`)
        console.log(`     ID: ${issue.id}`)
        console.log(`     Details: ${issue.details}`)
      })
    }

    console.log('\n⚠️  Please fix these data issues before applying the migration.')
    console.log()
    return false
  }
}

async function main() {
  try {
    const isValid = await validateData()
    await prisma.$disconnect()
    process.exit(isValid ? 0 : 1)
  } catch (error) {
    console.error('❌ Validation script error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()
