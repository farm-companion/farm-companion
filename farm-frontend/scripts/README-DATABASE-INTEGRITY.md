# Database Integrity Check

Comprehensive validation script for Farm Companion's Supabase/PostgreSQL database.

## Two Versions Available

1. **`check-database-integrity-sql.ts`** (Recommended) - Pure SQL using `pg` (node-postgres)
   - No Prisma dependencies
   - Faster and more efficient
   - Direct PostgreSQL connection

2. **`check-database-integrity.ts`** - Uses Prisma ORM
   - Requires Prisma Client
   - Type-safe queries
   - Good for development

## What It Checks

### 1. **Orphaned Photos** (Critical)
- Detects photos with `farmSlug` referencing non-existent farms
- Uses LEFT JOIN to find orphaned Image records
- Impact: Prevents 404 errors and broken UI

### 2. **Duplicate Slugs** (Critical)
- Identifies farms sharing the same slug (violates unique constraint)
- Groups by slug and counts occurrences
- Impact: Prevents routing conflicts and data corruption

### 3. **Coordinate Bounds** (Critical)
- Validates latitude: 49°N to 61°N (UK bounds)
- Validates longitude: -8°W to 2°E (UK bounds)
- Detects farms with invalid or out-of-country coordinates
- Impact: Ensures accurate map rendering and geospatial queries

### 4. **Rating Bounds** (Warning)
- Validates Google ratings: 0.0 to 5.0
- Checks for NULL or out-of-range values
- Impact: Prevents display errors in farm listings

### 5. **Required Fields** (Critical)
- Ensures all farms have: name, latitude, longitude, county
- Detects NULL or empty string values
- Impact: Prevents crashes in UI components expecting these fields

### 6. **Status Enums** (Critical)
- **Farm status**: `active`, `pending`, `suspended`
- **Photo status**: `pending`, `approved`, `rejected`
- Detects invalid enum values
- Impact: Ensures database constraints are honored

### 7. **Geospatial Indexes** (Warning)
- Verifies existence of performance-critical indexes:
  - `[latitude, longitude]` - Basic coordinate lookup
  - `[latitude, longitude, status]` - Active farms by location
  - `[county, latitude, longitude]` - County-filtered queries
- Queries `pg_indexes` system table
- Impact: Ensures optimal map query performance

### 8. **Database Statistics** (Info)
- Counts total, active, pending, suspended farms
- Counts total, approved, pending, rejected photos
- Counts verified and featured farms
- Provides health overview

## Usage

### Prerequisites

1. **Install pg dependency** (for SQL version):
   ```bash
   cd farm-frontend
   pnpm add -D pg @types/node
   ```

2. Set `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/database"
   ```
   Or create `.env` file in `farm-frontend/`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

### Run the Check

**Option 1: SQL Version (Recommended)**
```bash
cd farm-frontend
npx tsx scripts/check-database-integrity-sql.ts
```

**Option 2: Prisma Version**
```bash
cd farm-frontend
npx tsx scripts/check-database-integrity.ts
```

### Expected Output

#### All Checks Pass
```
🚀 Farm Companion Database Integrity Check
============================================================

📊 Database Statistics...
✅ Database Summary:
   Farms: 1299 total (1250 active, 40 pending, 9 suspended)
   Verified: 850 farms
   Featured: 120 farms
   Photos: 3420 total (2800 approved, 500 pending, 120 rejected)

🔍 Checking for orphaned photos...
✅ No orphaned photos found

🔍 Checking for duplicate farm slugs...
✅ No duplicate slugs found

🔍 Checking coordinate bounds (UK: lat 49-61, lng -8-2)...
✅ All coordinates within UK bounds

🔍 Checking Google rating bounds (0.0-5.0)...
✅ All ratings within valid bounds

🔍 Checking required fields (name, latitude, longitude, county)...
✅ All farms have required fields

🔍 Checking farm status enum (active, pending, suspended)...
✅ All farm statuses are valid

🔍 Checking photo status enum (pending, approved, rejected)...
✅ All photo statuses are valid

🔍 Verifying geospatial indexes exist in schema...
✅ Found 3 geospatial indexes:
   - farms_latitude_longitude_idx
   - farms_latitude_longitude_status_idx
   - farms_county_latitude_longitude_idx

============================================================
📋 INTEGRITY CHECK SUMMARY
============================================================

✅ All checks passed! Database integrity is excellent.

✨ Check complete!
```

#### Issues Found
```
🔍 Checking for orphaned photos...
❌ [Orphaned Photos] Found 5 photos referencing non-existent farms
   Details: {
     "count": 5,
     "sample": [
       { "id": "abc123", "farmSlug": "deleted-farm", "status": "approved" },
       ...
     ]
   }

============================================================
📋 INTEGRITY CHECK SUMMARY
============================================================

Total Issues Found: 5
  ❌ Critical: 5

Recommendations:
  1. Address CRITICAL issues immediately before deploying to production
  3. Run cleanup script to remove orphaned photos

✨ Check complete!
```

## Exit Codes

- **0**: All checks passed
- **1**: Critical issues found OR script error

Use in CI/CD pipelines:
```bash
npx tsx scripts/check-database-integrity.ts || exit 1
```

## Fixing Common Issues

### Orphaned Photos
```sql
-- Find orphaned photos
SELECT p.id, p."farmSlug"
FROM "Image" p
LEFT JOIN "farms" f ON p."farmSlug" = f.slug
WHERE f.id IS NULL;

-- Delete orphaned photos (CAREFUL!)
DELETE FROM "Image"
WHERE id IN (
  SELECT p.id
  FROM "Image" p
  LEFT JOIN "farms" f ON p."farmSlug" = f.slug
  WHERE f.id IS NULL
);
```

### Duplicate Slugs
```sql
-- Find duplicates
SELECT slug, COUNT(*)
FROM "farms"
GROUP BY slug
HAVING COUNT(*) > 1;

-- Investigate duplicates
SELECT * FROM "farms"
WHERE slug = 'duplicate-slug-here'
ORDER BY "createdAt";

-- Resolve: Keep oldest, update newer ones with unique slugs
UPDATE "farms"
SET slug = 'duplicate-slug-here-2'
WHERE id = 'newer-farm-id';
```

### Invalid Coordinates
```sql
-- Find farms outside UK
SELECT id, name, slug, latitude, longitude
FROM "farms"
WHERE latitude < 49 OR latitude > 61
   OR longitude < -8 OR longitude > 2;

-- Fix: Update with correct coordinates or suspend
UPDATE "farms"
SET status = 'suspended'
WHERE id = 'invalid-farm-id';
```

## Integration with CI/CD

Add to GitHub Actions workflow:
```yaml
- name: Database Integrity Check
  run: |
    cd farm-frontend
    npx tsx scripts/check-database-integrity.ts
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Related Files

- **Prisma Schema**: `prisma/schema.prisma` - Index definitions
- **Database Constraints**: `prisma/migrations/20260121185119_add_check_constraints/migration.sql`
- **Constraint Validation**: `prisma/migrations/20260121185119_add_check_constraints/validate-constraints.ts`
- **API Endpoint**: `src/app/api/admin/database-integrity/route.ts` - HTTP API for web UI

## Frequency

Run this check:
- **Before production deployment** (blocking)
- **After bulk data imports** (verify)
- **Weekly in production** (monitoring)
- **After schema migrations** (validation)

## Performance

- Typical runtime: 5-15 seconds (1,299 farms, 3,000+ photos)
- Uses optimized Prisma queries with indexes
- Parallel Promise.all for statistics
- Raw SQL for complex checks (orphaned photos, pg_indexes)

## Maintenance

Update the script when:
- New models added to schema
- New constraints defined
- New geospatial indexes created
- Business rules change (e.g., rating bounds)

---

**Last Updated**: 2026-01-22
**Version**: 1.0.0
**Phase**: 1 (Stabilization) - Track 3 (Data Quality)
