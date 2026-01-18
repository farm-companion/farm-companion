/**
 * Server-Side Caching for Counties
 *
 * React Server Components automatic request-level caching for county queries.
 * Gracefully returns empty results when DATABASE_URL is not configured.
 */

import { cache } from 'react'
import {
  getAllCounties,
  getFarmsByCounty,
  getCountyStats,
  getRelatedCounties,
  getTopCounties,
  searchCounties,
} from './queries/counties'
import { isDatabaseAvailable } from './prisma'

export const getCachedAllCounties = cache(async () => {
  if (!isDatabaseAvailable()) return []
  return getAllCounties()
})

export const getCachedFarmsByCounty = cache(
  async (
    countySlug: string,
    options: {
      limit?: number
      offset?: number
      category?: string
      featured?: boolean
    } = {}
  ) => {
    if (!isDatabaseAvailable()) return { farms: [], total: 0, hasMore: false, countyName: null }
    return getFarmsByCounty(countySlug, options)
  }
)

export const getCachedCountyStats = cache(async (countySlug: string) => {
  if (!isDatabaseAvailable()) return null
  return getCountyStats(countySlug)
})

export const getCachedRelatedCounties = cache(async (countySlug: string, limit = 6) => {
  if (!isDatabaseAvailable()) return []
  return getRelatedCounties(countySlug, limit)
})

export const getCachedTopCounties = cache(async (limit = 20) => {
  if (!isDatabaseAvailable()) return []
  return getTopCounties(limit)
})

export const getCachedSearchCounties = cache(async (query: string) => {
  if (!isDatabaseAvailable()) return []
  return searchCounties(query)
})
