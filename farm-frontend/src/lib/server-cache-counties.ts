/**
 * Server-Side Caching for Counties
 *
 * React Server Components automatic request-level caching for county queries.
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

export const getCachedAllCounties = cache(async () => {
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
    return getFarmsByCounty(countySlug, options)
  }
)

export const getCachedCountyStats = cache(async (countySlug: string) => {
  return getCountyStats(countySlug)
})

export const getCachedRelatedCounties = cache(async (countySlug: string, limit = 6) => {
  return getRelatedCounties(countySlug, limit)
})

export const getCachedTopCounties = cache(async (limit = 20) => {
  return getTopCounties(limit)
})

export const getCachedSearchCounties = cache(async (query: string) => {
  return searchCounties(query)
})
