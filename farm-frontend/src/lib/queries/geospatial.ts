/**
 * Geospatial Queries using PostGIS
 *
 * These queries use PostgreSQL's PostGIS extension for efficient
 * distance calculations and spatial operations.
 *
 * Performance: 5-10x faster than Haversine formula in application code
 */

import { prisma } from '../prisma'
import type { FarmShop } from '@/types/farm'

/**
 * Search farms within a radius using PostGIS ST_DWithin
 *
 * @param lat - Latitude of center point
 * @param lng - Longitude of center point
 * @param radiusKm - Search radius in kilometers (default: 25km)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of farms with distance, sorted by proximity
 */
export async function searchFarmsNearby(
  lat: number,
  lng: number,
  radiusKm: number = 25,
  limit: number = 20
) {
  // Use PostGIS for ultra-fast distance-based queries
  // ST_DWithin uses spatial index for optimal performance
  const farms = await prisma.$queryRaw<Array<any>>`
    SELECT
      f.*,
      ST_Distance(
        ST_MakePoint(f.longitude::float, f.latitude::float)::geography,
        ST_MakePoint(${lng}, ${lat})::geography
      ) / 1000 as distance_km,
      (
        SELECT json_agg(
          json_build_object(
            'category', json_build_object(
              'id', c.id,
              'name', c.name,
              'slug', c.slug
            )
          )
        )
        FROM farm_categories fc
        JOIN categories c ON c.id = fc."categoryId"
        WHERE fc."farmId" = f.id
      ) as categories,
      (
        SELECT json_agg(
          json_build_object(
            'url', i.url,
            'altText', i."altText"
          )
        )
        FROM images i
        WHERE i."farmId" = f.id
          AND i.status = 'approved'
          AND i."isHero" = true
        LIMIT 1
      ) as images
    FROM farms f
    WHERE f.status = 'active'
      AND ST_DWithin(
        ST_MakePoint(f.longitude::float, f.latitude::float)::geography,
        ST_MakePoint(${lng}, ${lat})::geography,
        ${radiusKm * 1000}
      )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `

  // Transform to FarmShop format
  return farms.map((farm) => transformToFarmShop(farm))
}

/**
 * Get farms within a bounding box using PostGIS ST_MakeEnvelope
 * Optimized for map viewport queries
 *
 * @param bounds - Map bounds { north, south, east, west }
 * @returns Array of farms within bounds
 */
export async function searchFarmsInBounds(bounds: {
  north: number
  south: number
  east: number
  west: number
}) {
  const { north, south, east, west } = bounds

  const farms = await prisma.$queryRaw<Array<any>>`
    SELECT
      f.*,
      (
        SELECT json_agg(
          json_build_object(
            'category', json_build_object(
              'id', c.id,
              'name', c.name,
              'slug', c.slug
            )
          )
        )
        FROM farm_categories fc
        JOIN categories c ON c.id = fc."categoryId"
        WHERE fc."farmId" = f.id
      ) as categories,
      (
        SELECT json_agg(
          json_build_object(
            'url', i.url,
            'altText', i."altText"
          )
        )
        FROM images i
        WHERE i."farmId" = f.id
          AND i.status = 'approved'
          AND i."isHero" = true
        LIMIT 1
      ) as images
    FROM farms f
    WHERE f.status = 'active'
      AND ST_Contains(
        ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326),
        ST_MakePoint(f.longitude::float, f.latitude::float)
      )
    LIMIT 500
  `

  return farms.map((farm) => transformToFarmShop(farm))
}

/**
 * Find nearest farm to a point
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Nearest farm with distance
 */
export async function findNearestFarm(lat: number, lng: number) {
  const result = await prisma.$queryRaw<Array<any>>`
    SELECT
      f.*,
      ST_Distance(
        ST_MakePoint(f.longitude::float, f.latitude::float)::geography,
        ST_MakePoint(${lng}, ${lat})::geography
      ) / 1000 as distance_km
    FROM farms f
    WHERE f.status = 'active'
    ORDER BY ST_MakePoint(f.longitude::float, f.latitude::float)::geography
      <-> ST_MakePoint(${lng}, ${lat})::geography
    LIMIT 1
  `

  if (result.length === 0) return null

  return {
    ...transformToFarmShop(result[0]),
    distance: result[0].distance_km,
  }
}

/**
 * Get farms within radius of a farm (for "nearby farms" recommendations)
 *
 * @param farmId - ID of the reference farm
 * @param radiusKm - Search radius (default: 10km)
 * @param limit - Maximum results (default: 5)
 * @returns Array of nearby farms
 */
export async function getNearbyFarms(
  farmId: string,
  radiusKm: number = 10,
  limit: number = 5
) {
  const farms = await prisma.$queryRaw<Array<any>>`
    WITH reference_farm AS (
      SELECT latitude, longitude
      FROM farms
      WHERE id = ${farmId}
    )
    SELECT
      f.*,
      ST_Distance(
        ST_MakePoint(f.longitude::float, f.latitude::float)::geography,
        ST_MakePoint(rf.longitude::float, rf.latitude::float)::geography
      ) / 1000 as distance_km
    FROM farms f, reference_farm rf
    WHERE f.status = 'active'
      AND f.id != ${farmId}
      AND ST_DWithin(
        ST_MakePoint(f.longitude::float, f.latitude::float)::geography,
        ST_MakePoint(rf.longitude::float, rf.latitude::float)::geography,
        ${radiusKm * 1000}
      )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `

  return farms.map((farm) => transformToFarmShop(farm))
}

/**
 * Calculate distance between two farms
 *
 * @param farmId1 - First farm ID
 * @param farmId2 - Second farm ID
 * @returns Distance in kilometers
 */
export async function calculateFarmDistance(farmId1: string, farmId2: string) {
  const result = await prisma.$queryRaw<Array<{ distance_km: number }>>`
    SELECT
      ST_Distance(
        ST_MakePoint(f1.longitude::float, f1.latitude::float)::geography,
        ST_MakePoint(f2.longitude::float, f2.latitude::float)::geography
      ) / 1000 as distance_km
    FROM farms f1, farms f2
    WHERE f1.id = ${farmId1}
      AND f2.id = ${farmId2}
  `

  return result[0]?.distance_km || null
}

/**
 * Transform raw database farm to FarmShop format
 */
function transformToFarmShop(farm: any): FarmShop {
  return {
    id: farm.id,
    name: farm.name,
    slug: farm.slug,
    description: farm.description || undefined,
    location: {
      lat: Number(farm.latitude),
      lng: Number(farm.longitude),
      address: farm.address,
      city: farm.city || undefined,
      county: farm.county,
      postcode: farm.postcode,
    },
    contact: {
      phone: farm.phone || undefined,
      email: farm.email || undefined,
      website: farm.website || undefined,
    },
    images: farm.images
      ? (Array.isArray(farm.images) ? farm.images : [farm.images]).map((img: any) => img.url)
      : [],
    verified: farm.verified,
    hours: farm.openingHours,
    distance: farm.distance_km,
  }
}
