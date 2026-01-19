# PostGIS Geospatial Setup (Optional)

## Current State

The Prisma schema uses standard PostgreSQL `Decimal` types for `latitude` and `longitude` with B-tree indexes optimized for common location queries.

**Existing indexes:**
- `[latitude, longitude]` - Basic coordinate lookup
- `[latitude, longitude, status]` - Active farms by location
- `[county, latitude, longitude]` - County-filtered location queries

This approach works well for:
- Simple bounding box queries
- County/city-based filtering
- Exact coordinate lookups

## When to Add PostGIS

Consider adding PostGIS geography column when you need:
- **Radius searches**: "Find farms within 10 miles of lat/lng"
- **Nearest neighbor queries**: "Find 10 closest farms to me"
- **Distance calculations**: "Sort farms by distance from point"
- **Complex shapes**: Polygons, multi-points, spatial joins

## How to Add PostGIS Column

### 1. Verify PostGIS Extension

```sql
-- Check if PostGIS is installed (Supabase has this by default)
SELECT PostGIS_version();
```

### 2. Create Migration

Create a new Prisma migration or run raw SQL:

```sql
-- Add geography column (POINT type, WGS84 coordinate system)
ALTER TABLE farms
ADD COLUMN location geography(POINT, 4326);

-- Create spatial index (GIST index for geography queries)
CREATE INDEX farms_location_gist_idx
ON farms USING GIST(location);

-- Populate from existing latitude/longitude
UPDATE farms
SET location = ST_SetSRID(
  ST_MakePoint(longitude::float, latitude::float),
  4326
)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL;
```

### 3. Keep Columns in Sync

Add a trigger to automatically update `location` when `latitude`/`longitude` change:

```sql
CREATE OR REPLACE FUNCTION update_farm_location()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) THEN
    NEW.location := ST_SetSRID(
      ST_MakePoint(NEW.longitude::float, NEW.latitude::float),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER farms_location_sync
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON farms
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_location();
```

## Query Examples

### Radius Search (10km)

```typescript
// Using Prisma raw query
const nearbyFarms = await prisma.$queryRaw`
  SELECT
    id,
    name,
    slug,
    ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) / 1000 as distance_km
  FROM farms
  WHERE status = 'active'
    AND ST_DWithin(
      location,
      ST_MakePoint(${lng}, ${lat})::geography,
      10000  -- 10km in meters
    )
  ORDER BY location <-> ST_MakePoint(${lng}, ${lat})::geography
  LIMIT 20;
`
```

### Nearest Neighbors

```typescript
// Find 10 closest farms
const closestFarms = await prisma.$queryRaw`
  SELECT
    id,
    name,
    slug,
    ST_Distance(location, ST_MakePoint(${lng}, ${lat})::geography) / 1000 as distance_km
  FROM farms
  WHERE status = 'active'
  ORDER BY location <-> ST_MakePoint(${lng}, ${lat})::geography
  LIMIT 10;
`
```

### Bounding Box (Current Approach)

```typescript
// No PostGIS needed - works with existing indexes
const farmsInBounds = await prisma.farm.findMany({
  where: {
    status: 'active',
    latitude: {
      gte: minLat,
      lte: maxLat,
    },
    longitude: {
      gte: minLng,
      lte: maxLng,
    },
  },
})
```

## Performance Comparison

| Query Type | Current (B-tree) | PostGIS (GIST) |
|------------|------------------|----------------|
| Bounding box | ✅ Fast | ✅ Fast |
| County filter | ✅ Fast | ✅ Fast |
| Radius search | ⚠️ Manual calc | ✅ Optimized |
| Nearest neighbor | ❌ Full scan | ✅ Indexed |
| Distance sort | ❌ Post-process | ✅ Native |

## Recommendation

- **Keep current approach** for bounding box and county-based queries
- **Add PostGIS** only when implementing user-centered radius searches or "farms near me" features
- Both approaches can coexist - maintain `latitude`/`longitude` for Prisma compatibility and add `location` geography column for spatial queries

## References

- PostGIS Documentation: https://postgis.net/docs/
- Supabase PostGIS Guide: https://supabase.com/docs/guides/database/extensions/postgis
- ST_DWithin: https://postgis.net/docs/ST_DWithin.html
- Geography vs Geometry: https://postgis.net/docs/using_postgis_dbmanagement.html#PostGIS_Geography
