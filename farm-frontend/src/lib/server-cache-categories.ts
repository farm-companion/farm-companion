/**
 * Server-Side Caching for Categories
 *
 * React Server Components automatic request-level caching for category queries.
 * Gracefully returns empty results when DATABASE_URL is not configured.
 */

import { cache } from 'react'
import {
  getAllCategories,
  getCategoryBySlug,
  getFarmsByCategory,
  getCategoryStats,
  getRelatedCategories,
  getTopCategories,
} from './queries/categories'
import { isDatabaseAvailable } from './prisma'

export const getCachedAllCategories = cache(async () => {
  if (!isDatabaseAvailable()) return []
  return getAllCategories()
})

export const getCachedCategoryBySlug = cache(async (slug: string) => {
  if (!isDatabaseAvailable()) return null
  return getCategoryBySlug(slug)
})

export const getCachedFarmsByCategory = cache(
  async (
    categorySlug: string,
    options: {
      limit?: number
      offset?: number
      county?: string
      featured?: boolean
    } = {}
  ) => {
    if (!isDatabaseAvailable()) return { farms: [], total: 0, hasMore: false }
    return getFarmsByCategory(categorySlug, options)
  }
)

export const getCachedCategoryStats = cache(async (categorySlug: string) => {
  if (!isDatabaseAvailable()) return null
  return getCategoryStats(categorySlug)
})

export const getCachedRelatedCategories = cache(async (categorySlug: string, limit = 6) => {
  if (!isDatabaseAvailable()) return []
  return getRelatedCategories(categorySlug, limit)
})

export const getCachedTopCategories = cache(async (limit = 12) => {
  if (!isDatabaseAvailable()) return []
  return getTopCategories(limit)
})
