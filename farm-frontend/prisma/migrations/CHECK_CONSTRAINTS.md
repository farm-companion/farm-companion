# Database CHECK Constraints

## Overview

This document describes the CHECK constraints added to enforce data integrity at the database level. Prisma does not natively support CHECK constraints in its schema language, so they are applied via raw SQL migrations.

## Why CHECK Constraints?

CHECK constraints enforce data validity rules at the database level, providing:

1. **Defense in depth** - Data integrity even if application validation is bypassed
2. **Multi-client safety** - Protects data when accessed via direct SQL, admin tools, or other clients
3. **Performance** - Database-level validation is faster than application-level checks
4. **Documentation** - Constraints serve as machine-readable documentation of data rules

## Constraints Added

### Farm Table

| Column | Constraint | Validation Rule |
|--------|-----------|----------------|
| `latitude` | `farms_latitude_bounds` | `>= -90 AND <= 90` |
| `longitude` | `farms_longitude_bounds` | `>= -180 AND <= 180` |
| `google_rating` | `farms_google_rating_bounds` | `NULL OR >= 0.0 AND <= 5.0` |
| `status` | `farms_status_valid` | `IN ('active', 'pending', 'suspended')` |

### Image Table

| Column | Constraint | Validation Rule |
|--------|-----------|----------------|
| `status` | `images_status_valid` | `IN ('pending', 'approved', 'rejected')` |

### Review Table

| Column | Constraint | Validation Rule |
|--------|-----------|----------------|
| `rating` | `reviews_rating_bounds` | `>= 1 AND <= 5` |
| `status` | `reviews_status_valid` | `IN ('pending', 'approved', 'rejected')` |

### BlogPost Table

| Column | Constraint | Validation Rule |
|--------|-----------|----------------|
| `status` | `blog_posts_status_valid` | `IN ('draft', 'published', 'archived')` |

## How to Apply

### Option 1: Via Prisma Migrate (Recommended)

1. Create a new empty migration:
   ```bash
   cd farm-frontend
   npx prisma migrate dev --create-only --name add_check_constraints
   ```

2. Copy the contents of `ADD_CHECK_CONSTRAINTS.sql` into the generated migration file.

3. Apply the migration:
   ```bash
   npx prisma migrate dev
   ```

### Option 2: Direct SQL Execution

If you need to apply constraints to an existing production database:

```bash
psql $DATABASE_URL -f prisma/migrations/ADD_CHECK_CONSTRAINTS.sql
```

Or via Supabase SQL Editor:
1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `ADD_CHECK_CONSTRAINTS.sql`
3. Execute the SQL

## Validation Before Applying

Before applying constraints, verify existing data complies:

```sql
-- Check for invalid coordinates
SELECT id, name, latitude, longitude
FROM farms
WHERE latitude < -90 OR latitude > 90
   OR longitude < -180 OR longitude > 180;

-- Check for invalid ratings
SELECT id, name, google_rating
FROM farms
WHERE google_rating IS NOT NULL
  AND (google_rating < 0.0 OR google_rating > 5.0);

-- Check for invalid farm status
SELECT id, name, status
FROM farms
WHERE status NOT IN ('active', 'pending', 'suspended');

-- Check for invalid review ratings
SELECT id, rating
FROM reviews
WHERE rating < 1 OR rating > 5;
```

## Data Cleanup (if needed)

If validation queries find invalid data:

```sql
-- Fix coordinates outside valid bounds
UPDATE farms
SET latitude = CASE
  WHEN latitude < -90 THEN -90
  WHEN latitude > 90 THEN 90
  ELSE latitude
END,
longitude = CASE
  WHEN longitude < -180 THEN -180
  WHEN longitude > 180 THEN 180
  ELSE longitude
END
WHERE latitude < -90 OR latitude > 90
   OR longitude < -180 OR longitude > 180;

-- Fix ratings outside valid bounds
UPDATE farms
SET google_rating = CASE
  WHEN google_rating < 0 THEN 0
  WHEN google_rating > 5 THEN 5
  ELSE google_rating
END
WHERE google_rating IS NOT NULL
  AND (google_rating < 0 OR google_rating > 5);
```

## Testing Constraints

After applying, verify constraints work:

```sql
-- Should fail: latitude out of bounds
INSERT INTO farms (id, name, slug, address, county, postcode, latitude, longitude)
VALUES (gen_random_uuid(), 'Test', 'test', '123 St', 'Test', 'AB1 2CD', 91, 0);
-- Expected: ERROR: new row for relation "farms" violates check constraint "farms_latitude_bounds"

-- Should fail: invalid status
INSERT INTO farms (id, name, slug, address, county, postcode, latitude, longitude, status)
VALUES (gen_random_uuid(), 'Test', 'test2', '123 St', 'Test', 'AB1 2CD', 50, 0, 'invalid');
-- Expected: ERROR: new row for relation "farms" violates check constraint "farms_status_valid"

-- Should succeed: valid data
INSERT INTO farms (id, name, slug, address, county, postcode, latitude, longitude, status)
VALUES (gen_random_uuid(), 'Test', 'test3', '123 St', 'Test', 'AB1 2CD', 51.5, -0.1, 'active');
```

## Rollback

If you need to remove constraints:

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

## Application-Level Validation

These constraints complement (not replace) application-level validation. Always validate in both places:

**Application Layer** (TypeScript):
- Provides user-friendly error messages
- Validates before network round-trip
- Catches issues early in development

**Database Layer** (CHECK constraints):
- Final safety net for data integrity
- Protects against bugs, direct SQL access, admin tools
- Machine-readable documentation of valid data

## References

- PostgreSQL CHECK Constraints: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS
- Prisma Client Validation: https://www.prisma.io/docs/orm/prisma-client/queries/crud#validation
- Supabase Database Management: https://supabase.com/docs/guides/database
