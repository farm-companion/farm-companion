/**
 * Meilisearch Integration
 *
 * Fast, typo-tolerant search powered by Meilisearch.
 * Provides instant search results with faceted filtering.
 *
 * @example
 * ```tsx
 * import { searchFarms, indexFarm } from '@/lib/search'
 *
 * // Search farms
 * const results = await searchFarms('organic', {
 *   filter: 'county = Essex',
 *   limit: 20
 * })
 *
 * // Index a new farm
 * await indexFarm(farm)
 * ```
 */

import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
})

const FARMS_INDEX = 'farms'

/**
 * Get the farms index
 */
export function getFarmsIndex() {
  return client.index(FARMS_INDEX)
}

/**
 * Setup the search index with proper configuration
 */
export async function setupSearchIndex() {
  try {
    // Create index if it doesn't exist
    await client.createIndex(FARMS_INDEX, { primaryKey: 'id' })
  } catch (error: any) {
    // Index might already exist, that's okay
    if (!error.message?.includes('already exists')) {
      throw error
    }
  }

  const index = client.index(FARMS_INDEX)

  // Configure searchable attributes (in order of importance)
  await index.updateSearchableAttributes([
    'name',
    'description',
    'county',
    'city',
    'categories',
    'postcode',
  ])

  // Configure filterable attributes
  await index.updateFilterableAttributes([
    'county',
    'city',
    'categories',
    'verified',
    'featured',
    'rating',
  ])

  // Configure sortable attributes
  await index.updateSortableAttributes(['rating', 'name', 'createdAt'])

  // Configure ranking rules
  await index.updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'rating:desc', // Prioritize higher rated farms
  ])

  // Configure typo tolerance
  await index.updateTypoTolerance({
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8,
    },
  })

  console.log('✓ Search index configured successfully')
}

/**
 * Index a single farm
 */
export async function indexFarm(farm: any) {
  const index = client.index(FARMS_INDEX)

  const document = {
    id: farm.id,
    name: farm.name,
    slug: farm.slug,
    description: farm.description || '',
    county: farm.county,
    city: farm.city || '',
    postcode: farm.postcode,
    categories: farm.categories?.map((c: any) => c.category?.name || c.name).filter(Boolean) || [],
    rating: farm.googleRating ? parseFloat(farm.googleRating.toString()) : 0,
    verified: farm.verified || false,
    featured: farm.featured || false,
    latitude: parseFloat(farm.latitude?.toString() || '0'),
    longitude: parseFloat(farm.longitude?.toString() || '0'),
    createdAt: farm.createdAt ? new Date(farm.createdAt).getTime() : Date.now(),
  }

  await index.addDocuments([document])
}

/**
 * Index multiple farms in batch
 */
export async function indexFarms(farms: any[]) {
  const index = client.index(FARMS_INDEX)

  const documents = farms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    slug: farm.slug,
    description: farm.description || '',
    county: farm.county,
    city: farm.city || '',
    postcode: farm.postcode,
    categories: farm.categories?.map((c: any) => c.category?.name || c.name).filter(Boolean) || [],
    rating: farm.googleRating ? parseFloat(farm.googleRating.toString()) : 0,
    verified: farm.verified || false,
    featured: farm.featured || false,
    latitude: parseFloat(farm.latitude?.toString() || '0'),
    longitude: parseFloat(farm.longitude?.toString() || '0'),
    createdAt: farm.createdAt ? new Date(farm.createdAt).getTime() : Date.now(),
  }))

  const task = await index.addDocuments(documents)
  return task
}

/**
 * Search farms with filters
 */
export interface SearchOptions {
  filter?: string | string[]
  sort?: string[]
  limit?: number
  offset?: number
  attributesToHighlight?: string[]
  attributesToCrop?: string[]
}

export async function searchFarms(query: string, options: SearchOptions = {}) {
  const index = client.index(FARMS_INDEX)

  const {
    filter,
    sort,
    limit = 20,
    offset = 0,
    attributesToHighlight = ['name', 'description'],
    attributesToCrop = ['description'],
  } = options

  return index.search(query, {
    filter,
    sort,
    limit,
    offset,
    attributesToHighlight,
    attributesToCrop,
    cropLength: 200,
  })
}

/**
 * Get search stats
 */
export async function getSearchStats() {
  const index = client.index(FARMS_INDEX)
  return index.getStats()
}

/**
 * Clear all documents from index
 */
export async function clearSearchIndex() {
  const index = client.index(FARMS_INDEX)
  return index.deleteAllDocuments()
}

/**
 * Delete the search index
 */
export async function deleteSearchIndex() {
  return client.deleteIndex(FARMS_INDEX)
}
