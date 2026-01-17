import { MeiliSearch } from 'meilisearch'

/**
 * Meilisearch client for farm search
 * Provides instant, typo-tolerant search across all farms
 */

// Lazy-initialize client to ensure env vars are loaded
let client: MeiliSearch | null = null

function getClient() {
  if (!client) {
    const host = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700'
    const apiKey = process.env.MEILISEARCH_API_KEY || ''

    if (!apiKey) {
      throw new Error('MEILISEARCH_API_KEY is required')
    }

    client = new MeiliSearch({ host, apiKey })
  }
  return client
}

export const FARMS_INDEX = 'farms'

/**
 * Get or create the farms index with optimal settings
 */
export async function getFarmsIndex() {
  const meili = getClient()

  try {
    // Try to get existing index
    const index = meili.index(FARMS_INDEX)
    await index.getSettings() // Test if it exists
    return index
  } catch (error) {
    // Create index if it doesn't exist
    console.log('Creating farms index...')
    await meili.createIndex(FARMS_INDEX, { primaryKey: 'id' })
    const index = meili.index(FARMS_INDEX)

    // Configure index settings for optimal search
    await index.updateSettings({
      // Searchable attributes (in order of importance)
      searchableAttributes: [
        'name',
        'location.city',
        'location.county',
        'description',
        'categories',
        'tags',
        'location.postcode'
      ],

      // Filterable attributes (for filtering results)
      filterableAttributes: [
        'location.county',
        'location.city',
        'categories',
        'verified',
        'featured',
        'googleRating',
        'tags'
      ],

      // Sortable attributes (for sorting results)
      sortableAttributes: [
        'name',
        'googleRating',
        'location.county',
        'location.city'
      ],

      // Display attributes (what to return)
      displayedAttributes: [
        'id',
        'name',
        'slug',
        'description',
        'location',
        'contact',
        'categories',
        'googleRating',
        'googleReviewsCount',
        'verified',
        'featured',
        'images',
        'tags'
      ],

      // Ranking rules (how to rank search results)
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'googleRating:desc' // Prefer higher-rated farms
      ],

      // Typo tolerance (allows misspellings)
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8
        }
      },

      // Pagination
      pagination: {
        maxTotalHits: 1000
      }
    })

    console.log('✅ Farms index configured')
    return index
  }
}

/**
 * Search farms with filters
 */
export async function searchFarms(query: string, options: {
  county?: string
  city?: string
  category?: string
  verified?: boolean
  limit?: number
  offset?: number
  sort?: string[]
} = {}) {
  const index = await getFarmsIndex()

  // Build filter string
  const filters: string[] = []

  if (options.county) {
    filters.push(`location.county = "${options.county}"`)
  }

  if (options.city) {
    filters.push(`location.city = "${options.city}"`)
  }

  if (options.category) {
    filters.push(`categories = "${options.category}"`)
  }

  if (options.verified !== undefined) {
    filters.push(`verified = ${options.verified}`)
  }

  const filterString = filters.length > 0 ? filters.join(' AND ') : undefined

  // Execute search
  const results = await index.search(query, {
    filter: filterString,
    limit: options.limit || 20,
    offset: options.offset || 0,
    sort: options.sort,
    attributesToHighlight: ['name', 'description', 'location.city'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>'
  })

  return results
}

/**
 * Get facets for filtering UI
 */
export async function getFacets() {
  const index = await getFarmsIndex()

  const results = await index.search('', {
    facets: ['location.county', 'categories', 'verified'],
    limit: 0
  })

  return results.facetDistribution
}

/**
 * Get farm suggestions (autocomplete)
 */
export async function getFarmSuggestions(query: string, limit: number = 5) {
  if (!query || query.length < 2) return []

  const index = await getFarmsIndex()

  const results = await index.search(query, {
    limit,
    attributesToRetrieve: ['id', 'name', 'slug', 'location.city', 'location.county'],
    attributesToHighlight: ['name']
  })

  return results.hits
}

export default getClient
