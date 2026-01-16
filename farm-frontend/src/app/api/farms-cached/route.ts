/**
 * Farms API with Multi-Tier Caching
 *
 * Demonstrates optimal caching strategy for farm listings:
 * - L1 (Memory): 60s TTL, per-instance
 * - L2 (Redis): 5min TTL, shared across instances
 * - L3 (HTTP): CDN caching with stale-while-revalidate
 *
 * Performance:
 * - Cold start (no cache): ~200-400ms
 * - Warm Redis: ~15-30ms
 * - Warm memory: <1ms
 * - CDN hit: ~50-100ms (no server load)
 */

import { NextRequest } from 'next/server'
import {
  getCachedWithStrategy,
  createCachedResponse,
  DYNAMIC_CACHE_OPTIONS,
  STATIC_CACHE_OPTIONS,
} from '@/lib/cache-strategy'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const county = searchParams.get('county')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Generate cache key from query parameters
  const cacheKey = [
    county && `county:${county}`,
    category && `category:${category}`,
    `limit:${limit}`,
    `offset:${offset}`,
  ]
    .filter(Boolean)
    .join(':')

  // Determine if this is a static or dynamic query
  // Static: No filters, first page (most common, highly cacheable)
  // Dynamic: Filters applied (less cacheable, shorter TTL)
  const isStaticQuery = !county && !category && offset === 0
  const cacheOptions = isStaticQuery ? STATIC_CACHE_OPTIONS : DYNAMIC_CACHE_OPTIONS

  try {
    // Fetch with multi-tier caching
    const data = await getCachedWithStrategy(
      'farms',
      cacheKey,
      async () => {
        // This fetcher only runs on cache miss
        console.log(`⚠️  Cache miss: ${cacheKey}`)

        const where: any = { status: 'active' }

        if (county) where.county = county
        if (category) {
          where.categories = {
            some: { category: { slug: category } },
          }
        }

        const [farms, total] = await Promise.all([
          prisma.farm.findMany({
            where,
            include: {
              categories: { include: { category: true } },
              images: { where: { status: 'approved', isHero: true }, take: 1 },
            },
            take: limit,
            skip: offset,
            orderBy: [
              { featured: 'desc' },
              { verified: 'desc' },
              { googleRating: { sort: 'desc', nulls: 'last' } },
            ],
          }),
          prisma.farm.count({ where }),
        ])

        return {
          farms,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + farms.length < total,
          },
        }
      },
      {
        ...cacheOptions,
        tags: ['farms', county && 'county', category && 'category'].filter(Boolean) as string[],
      }
    )

    // Return with optimal HTTP cache headers
    return createCachedResponse(data, cacheOptions)
  } catch (error) {
    console.error('Error fetching farms:', error)

    return createCachedResponse(
      { error: 'Failed to fetch farms' },
      { useHTTPCache: false }
    )
  }
}

// Revalidate this route every 5 minutes (ISR)
export const revalidate = 300
