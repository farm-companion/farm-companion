import { NextRequest, NextResponse } from 'next/server'
import { searchFarms, getFarmSuggestions } from '@/lib/meilisearch'

/**
 * GET /api/search
 * Fast, typo-tolerant farm search using Meilisearch
 *
 * Query params:
 * - q: search query
 * - county: filter by county
 * - city: filter by city
 * - category: filter by category
 * - verified: filter verified farms
 * - limit: results per page (default: 20)
 * - offset: pagination offset
 * - sort: sorting (e.g., googleRating:desc)
 * - suggest: return autocomplete suggestions only
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const query = searchParams.get('q') || ''
    const county = searchParams.get('county') || undefined
    const city = searchParams.get('city') || undefined
    const category = searchParams.get('category') || undefined
    const verified = searchParams.get('verified') === 'true' ? true : undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort')?.split(',') || undefined
    const suggest = searchParams.get('suggest') === 'true'

    // Return suggestions for autocomplete
    if (suggest) {
      const suggestions = await getFarmSuggestions(query, 5)

      return NextResponse.json({
        suggestions: suggestions.map(hit => ({
          id: hit.id,
          name: hit.name,
          slug: hit.slug,
          location: {
            city: hit.location?.city,
            county: hit.location?.county
          },
          highlight: hit._formatted?.name || hit.name
        }))
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      })
    }

    // Full search
    const results = await searchFarms(query, {
      county,
      city,
      category,
      verified,
      limit,
      offset,
      sort
    })

    return NextResponse.json({
      hits: results.hits,
      query: results.query,
      processingTimeMs: results.processingTimeMs,
      estimatedTotalHits: results.estimatedTotalHits,
      limit: results.limit,
      offset: results.offset,
      facets: results.facetDistribution
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })

  } catch (error: any) {
    console.error('Search error:', error)

    return NextResponse.json(
      { error: 'Search failed', message: error.message },
      { status: 500 }
    )
  }
}
