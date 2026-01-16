/**
 * Server-Side Caching for Categories
 *
 * React Server Components automatic request-level caching for category queries.
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

export const getCachedAllCategories = cache(async () => {
  return getAllCategories()
})

export const getCachedCategoryBySlug = cache(async (slug: string) => {
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
    return getFarmsByCategory(categorySlug, options)
  }
)

export const getCachedCategoryStats = cache(async (categorySlug: string) => {
  return getCategoryStats(categorySlug)
})

export const getCachedRelatedCategories = cache(async (categorySlug: string, limit = 6) => {
  return getRelatedCategories(categorySlug, limit)
})

export const getCachedTopCategories = cache(async (limit = 12) => {
  return getTopCategories(limit)
})
