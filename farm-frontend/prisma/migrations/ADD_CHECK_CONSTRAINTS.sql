-- Database Constraint Migration
-- Adds CHECK constraints for data integrity validation
-- Run this after schema changes are applied

-- ============================================================================
-- FARM TABLE CONSTRAINTS
-- ============================================================================

-- Coordinate bounds (valid geographic coordinates)
ALTER TABLE farms
ADD CONSTRAINT farms_latitude_bounds
CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE farms
ADD CONSTRAINT farms_longitude_bounds
CHECK (longitude >= -180 AND longitude <= 180);

-- Google rating bounds (0.0 to 5.0)
ALTER TABLE farms
ADD CONSTRAINT farms_google_rating_bounds
CHECK (google_rating IS NULL OR (google_rating >= 0.0 AND google_rating <= 5.0));

-- Status enum validation
ALTER TABLE farms
ADD CONSTRAINT farms_status_valid
CHECK (status IN ('active', 'pending', 'suspended'));

-- ============================================================================
-- IMAGE TABLE CONSTRAINTS
-- ============================================================================

-- Image status enum validation
ALTER TABLE images
ADD CONSTRAINT images_status_valid
CHECK (status IN ('pending', 'approved', 'rejected'));

-- ============================================================================
-- REVIEW TABLE CONSTRAINTS
-- ============================================================================

-- Rating bounds (1 to 5 stars)
ALTER TABLE reviews
ADD CONSTRAINT reviews_rating_bounds
CHECK (rating >= 1 AND rating <= 5);

-- Review status enum validation
ALTER TABLE reviews
ADD CONSTRAINT reviews_status_valid
CHECK (status IN ('pending', 'approved', 'rejected'));

-- ============================================================================
-- BLOG_POSTS TABLE CONSTRAINTS
-- ============================================================================

-- Blog post status enum validation
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_status_valid
CHECK (status IN ('draft', 'published', 'archived'));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify constraints are active:
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'farms'::regclass AND contype = 'c';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_latitude_bounds;
-- ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_longitude_bounds;
-- ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_google_rating_bounds;
-- ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_status_valid;
-- ALTER TABLE images DROP CONSTRAINT IF EXISTS images_status_valid;
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_bounds;
-- ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_valid;
-- ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_valid;
