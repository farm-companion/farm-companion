-- Data Validation Script
-- Run this BEFORE applying CHECK constraints migration
-- Queue 9 Slice 4: Database constraints and validation
--
-- Usage:
--   psql $DATABASE_URL -f scripts/validate-constraints.sql
--
-- All queries should return 0 rows. If any return rows, that data needs
-- to be fixed before applying constraints.

-- ============================================================================
-- FARM TABLE VALIDATION
-- ============================================================================

-- Check for invalid latitude coordinates
SELECT
  'Invalid latitude' as issue,
  id,
  name,
  latitude::text as invalid_value
FROM farms
WHERE latitude < -90 OR latitude > 90;

-- Check for invalid longitude coordinates
SELECT
  'Invalid longitude' as issue,
  id,
  name,
  longitude::text as invalid_value
FROM farms
WHERE longitude < -180 OR longitude > 180;

-- Check for invalid Google ratings
SELECT
  'Invalid Google rating' as issue,
  id,
  name,
  "googleRating"::text as invalid_value
FROM farms
WHERE "googleRating" IS NOT NULL
  AND ("googleRating" < 0.0 OR "googleRating" > 5.0);

-- Check for invalid farm status values
SELECT
  'Invalid farm status' as issue,
  id,
  name,
  status as invalid_value
FROM farms
WHERE status NOT IN ('active', 'pending', 'suspended');

-- ============================================================================
-- IMAGE TABLE VALIDATION
-- ============================================================================

-- Check for invalid image status values
SELECT
  'Invalid image status' as issue,
  id,
  "farmId" as farm_id,
  status as invalid_value
FROM images
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- ============================================================================
-- REVIEW TABLE VALIDATION
-- ============================================================================

-- Check for invalid review ratings
SELECT
  'Invalid review rating' as issue,
  id,
  "farmId" as farm_id,
  rating as invalid_value
FROM reviews
WHERE rating < 1 OR rating > 5;

-- Check for invalid review status values
SELECT
  'Invalid review status' as issue,
  id,
  "farmId" as farm_id,
  status as invalid_value
FROM reviews
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- ============================================================================
-- BLOG_POSTS TABLE VALIDATION
-- ============================================================================

-- Check for invalid blog post status values
SELECT
  'Invalid blog post status' as issue,
  id,
  title,
  status as invalid_value
FROM blog_posts
WHERE status NOT IN ('draft', 'published', 'archived');

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Count all validation issues
SELECT
  'Total validation issues' as summary,
  COUNT(*) as count
FROM (
  SELECT id FROM farms WHERE latitude < -90 OR latitude > 90
  UNION ALL
  SELECT id FROM farms WHERE longitude < -180 OR longitude > 180
  UNION ALL
  SELECT id FROM farms WHERE "googleRating" IS NOT NULL AND ("googleRating" < 0.0 OR "googleRating" > 5.0)
  UNION ALL
  SELECT id FROM farms WHERE status NOT IN ('active', 'pending', 'suspended')
  UNION ALL
  SELECT id FROM images WHERE status NOT IN ('pending', 'approved', 'rejected')
  UNION ALL
  SELECT id FROM reviews WHERE rating < 1 OR rating > 5
  UNION ALL
  SELECT id FROM reviews WHERE status NOT IN ('pending', 'approved', 'rejected')
  UNION ALL
  SELECT id FROM blog_posts WHERE status NOT IN ('draft', 'published', 'archived')
) as issues;
