/**
 * Multi-Tier Caching Strategy
 *
 * Implements 3-tier caching for optimal performance:
 * 1. In-Memory Cache (L1): Ultra-fast, per-instance, 100ms TTL
 * 2. Redis Cache (L2): Fast, shared across instances, configurable TTL
 * 3. CDN/Browser Cache (L3): HTTP cache headers, edge caching
 *
 * Performance:
 * - L1 Hit: <1ms
 * - L2 Hit: 5-15ms
 * - L3 Hit: 50-100ms (CDN)
 * - Miss: 100-500ms (database query)
 */

import { NextResponse } from 'next/server'
import { cacheManager, CACHE_TTL, type CacheOptions } from './cache-manager'
import { invalidateTilesForLocation, invalidateAllTiles } from './viewport-cache'

// ===========================================================================
// IN-MEMORY CACHE (L1)
// ===========================================================================

interface MemoryCacheEntry<T> {
  data: T
  expiry: number
}

class MemoryCache {
  private cache = new Map<string, MemoryCacheEntry<any>>()
  private readonly maxSize = 100 // Max 100 entries
  private readonly defaultTTL = 60000 // 60 seconds

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

const memoryCache = new MemoryCache()

// ===========================================================================
// MULTI-TIER CACHE WRAPPER
// ===========================================================================

export interface CacheStrategyOptions extends CacheOptions {
  /**
   * Enable L1 in-memory cache (default: true)
   */
  useMemoryCache?: boolean

  /**
   * L1 cache TTL in milliseconds (default: 60000 = 1 minute)
   */
  memoryCacheTTL?: number

  /**
   * Enable L3 HTTP caching (default: true)
   */
  useHTTPCache?: boolean

  /**
   * HTTP cache max-age in seconds (default: 300 = 5 minutes)
   */
  httpCacheMaxAge?: number

  /**
   * HTTP stale-while-revalidate in seconds (default: 3600 = 1 hour)
   */
  httpCacheStaleWhileRevalidate?: number
}

/**
 * Multi-tier cache get with fallback through all layers
 */
export async function getCachedWithStrategy<T>(
  namespace: string,
  key: string,
  fetcher: () => Promise<T>,
  options: CacheStrategyOptions = {}
): Promise<T> {
  const {
    useMemoryCache = true,
    memoryCacheTTL = 60000,
    ttl = CACHE_TTL.MEDIUM,
  } = options

  const cacheKey = `${namespace}:${key}`

  // L1: Check memory cache
  if (useMemoryCache) {
    const memCached = memoryCache.get<T>(cacheKey)
    if (memCached !== null) {
      return memCached
    }
  }

  // L2: Check Redis cache
  const redisCached = await cacheManager.get<T>(namespace, key)
  if (redisCached !== null) {
    // Populate L1 cache
    if (useMemoryCache) {
      memoryCache.set(cacheKey, redisCached, memoryCacheTTL)
    }
    return redisCached
  }

  // Cache miss: Fetch data
  const data = await fetcher()

  // Populate L2 cache
  await cacheManager.set(namespace, key, data, { ttl, ...options })

  // Populate L1 cache
  if (useMemoryCache) {
    memoryCache.set(cacheKey, data, memoryCacheTTL)
  }

  return data
}

/**
 * Create Next.js Response with optimal HTTP cache headers
 */
export function createCachedResponse<T>(
  data: T,
  options: CacheStrategyOptions = {}
): NextResponse<T> {
  const {
    httpCacheMaxAge = 300, // 5 minutes
    httpCacheStaleWhileRevalidate = 3600, // 1 hour
    useHTTPCache = true,
  } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (useHTTPCache) {
    // Public caching: Can be cached by CDN and browsers
    headers['Cache-Control'] = [
      'public',
      `s-maxage=${httpCacheMaxAge}`, // CDN cache
      `max-age=${Math.floor(httpCacheMaxAge / 2)}`, // Browser cache (half of CDN)
      `stale-while-revalidate=${httpCacheStaleWhileRevalidate}`, // Serve stale during revalidation
    ].join(', ')

    // Vary header for proper caching with different accept headers
    headers['Vary'] = 'Accept-Encoding'

    // ETag for conditional requests (Next.js handles this automatically)
    const etag = generateETag(data)
    headers['ETag'] = etag
  } else {
    // No caching
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
  }

  return NextResponse.json(data, { headers })
}

/**
 * Generate ETag for response data
 */
function generateETag(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `"${Math.abs(hash).toString(36)}"`
}

// ===========================================================================
// CACHE WARMING
// ===========================================================================

/**
 * Warm cache with frequently accessed data
 * Should be called on application startup or periodically
 */
export async function warmCache() {
  console.log('🔥 Warming cache...')

  const warmingTasks = [
    // Warm top categories
    async () => {
      const { getTopCategories } = await import('./queries/categories')
      const categories = await getTopCategories(12)
      await cacheManager.set('categories', 'top', categories, {
        ttl: CACHE_TTL.LONG,
        tags: ['categories'],
      })
      console.log(`  ✓ Cached top ${categories.length} categories`)
    },

    // Warm top counties
    async () => {
      const { getTopCounties } = await import('./queries/counties')
      const counties = await getTopCounties(20)
      await cacheManager.set('counties', 'top', counties, {
        ttl: CACHE_TTL.LONG,
        tags: ['counties'],
      })
      console.log(`  ✓ Cached top ${counties.length} counties`)
    },

    // Warm featured farms
    async () => {
      const { prisma } = await import('./prisma')
      const featured = await prisma.farm.findMany({
        where: { featured: true, status: 'active' },
        take: 10,
        include: {
          images: { where: { isHero: true }, take: 1 },
          categories: { include: { category: true } },
        },
      })
      await cacheManager.set('farms', 'featured', featured, {
        ttl: CACHE_TTL.MEDIUM,
        tags: ['farms', 'featured'],
      })
      console.log(`  ✓ Cached ${featured.length} featured farms`)
    },

    // Warm total farm count
    async () => {
      const { prisma } = await import('./prisma')
      const count = await prisma.farm.count({ where: { status: 'active' } })
      await cacheManager.set('stats', 'total-farms', count, {
        ttl: CACHE_TTL.LONG,
        tags: ['stats'],
      })
      console.log(`  ✓ Cached total farm count: ${count}`)
    },
  ]

  // Run all warming tasks in parallel
  const results = await Promise.allSettled(warmingTasks.map((task) => task()))

  const successful = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`\n🔥 Cache warming complete: ${successful} successful, ${failed} failed`)
}

// ===========================================================================
// CACHE INVALIDATION STRATEGIES
// ===========================================================================

/**
 * Invalidate all farm-related caches
 * Call after creating, updating, or deleting a farm
 */
export async function invalidateFarmCaches(farmId?: string, location?: { lat: number; lng: number }) {
  const tasks = []

  if (farmId) {
    // Invalidate specific farm
    tasks.push(cacheManager.delete('farms', farmId))
    tasks.push(cacheManager.delete('farms', `slug:${farmId}`))
  }

  // Invalidate farm lists
  tasks.push(cacheManager.invalidateByTags('farms', ['farms', 'featured']))

  // Invalidate related caches
  tasks.push(cacheManager.invalidateByTags('stats', ['stats']))
  tasks.push(cacheManager.invalidateByTags('search', ['search']))

  // Invalidate viewport tiles for this location
  if (location) {
    tasks.push(invalidateTilesForLocation(location.lat, location.lng))
  } else {
    // If no location provided, invalidate all tiles (e.g., bulk update)
    tasks.push(invalidateAllTiles())
  }

  await Promise.all(tasks)

  // Clear L1 memory cache
  memoryCache.clear()

  console.log(`✓ Invalidated farm caches${farmId ? ` for farm ${farmId}` : ''}${location ? ` at (${location.lat}, ${location.lng})` : ''}`)
}

/**
 * Invalidate category-related caches
 */
export async function invalidateCategoryCaches(categoryId?: string) {
  const tasks = []

  if (categoryId) {
    tasks.push(cacheManager.delete('categories', categoryId))
  }

  tasks.push(cacheManager.invalidateByTags('categories', ['categories']))
  tasks.push(cacheManager.invalidateByTags('stats', ['stats']))

  await Promise.all(tasks)
  memoryCache.clear()

  console.log(`✓ Invalidated category caches${categoryId ? ` for category ${categoryId}` : ''}`)
}

/**
 * Invalidate county-related caches
 */
export async function invalidateCountyCaches(county?: string) {
  const tasks = []

  if (county) {
    tasks.push(cacheManager.delete('counties', county))
  }

  tasks.push(cacheManager.invalidateByTags('counties', ['counties']))

  await Promise.all(tasks)
  memoryCache.clear()

  console.log(`✓ Invalidated county caches${county ? ` for ${county}` : ''}`)
}

// ===========================================================================
// CACHE UTILITIES
// ===========================================================================

/**
 * Get cache statistics across all layers
 */
export function getCacheStats() {
  const redisStats = cacheManager.getStats()

  return {
    redis: redisStats,
    memory: {
      size: memoryCache['cache'].size,
      maxSize: memoryCache['maxSize'],
    },
  }
}

/**
 * Clear all caches (L1 + L2)
 * Use sparingly - only for major data updates
 */
export async function clearAllCaches() {
  memoryCache.clear()

  await Promise.all([
    cacheManager.clearNamespace('farms'),
    cacheManager.clearNamespace('categories'),
    cacheManager.clearNamespace('counties'),
    cacheManager.clearNamespace('stats'),
    cacheManager.clearNamespace('search'),
  ])

  console.log('✓ Cleared all caches')
}

// ===========================================================================
// PRESETS FOR COMMON SCENARIOS
// ===========================================================================

/**
 * Cache settings for static content (rarely changes)
 * Example: Site configuration, static pages
 */
export const STATIC_CACHE_OPTIONS: CacheStrategyOptions = {
  ttl: CACHE_TTL.VERY_LONG, // 7 days Redis
  useMemoryCache: true,
  memoryCacheTTL: 300000, // 5 minutes memory
  useHTTPCache: true,
  httpCacheMaxAge: 3600, // 1 hour CDN
  httpCacheStaleWhileRevalidate: 86400, // 24 hours stale-while-revalidate
}

/**
 * Cache settings for dynamic content that changes frequently
 * Example: Farm listings, search results
 */
export const DYNAMIC_CACHE_OPTIONS: CacheStrategyOptions = {
  ttl: CACHE_TTL.SHORT, // 5 minutes Redis
  useMemoryCache: true,
  memoryCacheTTL: 60000, // 1 minute memory
  useHTTPCache: true,
  httpCacheMaxAge: 60, // 1 minute CDN
  httpCacheStaleWhileRevalidate: 300, // 5 minutes stale-while-revalidate
}

/**
 * Cache settings for personalized content (user-specific)
 * Example: User profiles, saved farms
 */
export const PERSONALIZED_CACHE_OPTIONS: CacheStrategyOptions = {
  ttl: CACHE_TTL.SHORT, // 5 minutes Redis
  useMemoryCache: false, // Don't cache in memory (varies per user)
  useHTTPCache: false, // Don't use HTTP cache (private data)
}

/**
 * Cache settings for real-time content (frequently updates)
 * Example: Live availability, current events
 */
export const REALTIME_CACHE_OPTIONS: CacheStrategyOptions = {
  ttl: 60, // 1 minute Redis
  useMemoryCache: true,
  memoryCacheTTL: 10000, // 10 seconds memory
  useHTTPCache: false, // No HTTP cache (too dynamic)
}
