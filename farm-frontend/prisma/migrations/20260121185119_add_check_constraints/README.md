# Migration: Add CHECK Constraints

**Queue 9 Slice 4: Database constraints and validation**

## Overview

This migration adds CHECK constraints to enforce data integrity at the database level. These constraints ensure that invalid data cannot be inserted or updated, providing defense-in-depth beyond application-level validation.

## Constraints Added

### Farm Table
- `farms_latitude_bounds`: Latitude must be between -90 and 90
- `farms_longitude_bounds`: Longitude must be between -180 and 180
- `farms_google_rating_bounds`: Google rating must be NULL or between 0.0 and 5.0
- `farms_status_valid`: Status must be 'active', 'pending', or 'suspended'

### Image Table
- `images_status_valid`: Status must be 'pending', 'approved', or 'rejected'

### Review Table
- `reviews_rating_bounds`: Rating must be between 1 and 5
- `reviews_status_valid`: Status must be 'pending', 'approved', or 'rejected'

### BlogPost Table
- `blog_posts_status_valid`: Status must be 'draft', 'published', or 'archived'

## Pre-Migration Validation

**IMPORTANT:** Before applying this migration, validate that existing data complies with these constraints.

### Option 1: TypeScript validation (recommended)

```bash
cd farm-frontend
npx tsx scripts/validate-constraints.ts
```

This will check all data and report any issues. If validation passes, it's safe to apply the migration.

### Option 2: SQL validation

```bash
psql $DATABASE_URL -f scripts/validate-constraints.sql
```

All queries should return 0 rows. If any return rows, fix the data before proceeding.

## Applying the Migration

### Development

```bash
cd farm-frontend
npx prisma migrate dev
```

### Production (Supabase)

**Option A: Via Prisma Migrate (recommended)**

```bash
cd farm-frontend
npx prisma migrate deploy
```

**Option B: Via Supabase SQL Editor**

1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `migration.sql`
3. Execute the SQL
4. Mark migration as applied:
   ```bash
   npx prisma migrate resolve --applied 20260121185119_add_check_constraints
   ```

## Verification

After applying, verify constraints are active:

```sql
-- List all CHECK constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text IN ('farms', 'images', 'reviews', 'blog_posts')
ORDER BY table_name, constraint_name;
```

Expected output: 8 CHECK constraints (4 for farms, 1 for images, 2 for reviews, 1 for blog_posts)

## Testing Constraints

Verify constraints work by attempting to insert invalid data:

```sql
-- Should fail: latitude out of bounds
INSERT INTO farms (id, name, slug, address, county, postcode, latitude, longitude)
VALUES (gen_random_uuid(), 'Test', 'test', '123 St', 'Test', 'AB1 2CD', 91, 0);
-- Expected: ERROR: new row violates check constraint "farms_latitude_bounds"

-- Should fail: invalid status
INSERT INTO farms (id, name, slug, address, county, postcode, latitude, longitude, status)
VALUES (gen_random_uuid(), 'Test', 'test2', '123 St', 'Test', 'AB1 2CD', 50, 0, 'invalid');
-- Expected: ERROR: new row violates check constraint "farms_status_valid"
```

## Rollback

If you need to remove these constraints:

```sql
ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_latitude_bounds;
ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_longitude_bounds;
ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_google_rating_bounds;
ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_status_valid;
ALTER TABLE images DROP CONSTRAINT IF EXISTS images_status_valid;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_bounds;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_valid;
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_valid;
```

Then mark migration as rolled back:

```bash
npx prisma migrate resolve --rolled-back 20260121185119_add_check_constraints
```

## Why These Constraints Matter

1. **Defense in Depth**: Even if application validation is bypassed, database enforces rules
2. **Multi-Client Safety**: Protects data when accessed via SQL tools, admin panels, or other apps
3. **Data Quality**: Prevents corruption from bugs, scripts, or manual SQL operations
4. **Documentation**: Constraints serve as machine-readable data rules
5. **Performance**: Database-level validation is faster than application checks

## Related Files

- Migration SQL: `prisma/migrations/20260121185119_add_check_constraints/migration.sql`
- TypeScript validation: `scripts/validate-constraints.ts`
- SQL validation: `scripts/validate-constraints.sql`
- Documentation: `prisma/migrations/CHECK_CONSTRAINTS.md`
