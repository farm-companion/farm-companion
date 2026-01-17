/**
 * Server-Side Caching Utilities
 *
 * React Server Components automatic request-level caching.
 * Ensures data is fetched once per request even if called multiple times.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getCachedFarmBySlug } from '@/lib/server-cache'
 *
 * export default async function FarmPage({ params }) {
 *   const farm = await getCachedFarmBySlug(params.slug)
 *   return <div>{farm.name}</div>
 * }
 * ```
 */

import { cache } from 'react'
import {
  getFarmBySlug,
  searchFarms,
  getFarmsByCounty,
  getFeaturedFarms,
  getFarmsNearby,
  getCountiesWithCounts,
  getFarmStats,
  type SearchFarmsParams,
} from './queries/farms'

/**
 * Cached farm by slug query
 * Multiple components can call this with the same slug and only 1 DB query executes
 */
export const getCachedFarmBySlug = cache(async (slug: string) => {
  return getFarmBySlug(slug)
})

/**
 * Cached search farms query
 * Note: Cache key is based on ALL parameters, so different params = different cache
 */
export const getCachedSearchFarms = cache(async (params: SearchFarmsParams) => {
  return searchFarms(params)
})

/**
 * Cached farms by county
 */
export const getCachedFarmsByCounty = cache(async (county: string, limit = 20) => {
  return getFarmsByCounty(county, limit)
})

/**
 * Cached featured farms
 */
export const getCachedFeaturedFarms = cache(async (limit = 6) => {
  return getFeaturedFarms(limit)
})

/**
 * Cached nearby farms
 */
export const getCachedFarmsNearby = cache(
  async (lat: number, lng: number, radiusKm = 10, limit = 20) => {
    return getFarmsNearby(lat, lng, radiusKm, limit)
  }
)

/**
 * Cached counties with counts
 */
export const getCachedCountiesWithCounts = cache(async () => {
  return getCountiesWithCounts()
})

/**
 * Cached farm statistics
 */
export const getCachedFarmStats = cache(async () => {
  return getFarmStats()
})
