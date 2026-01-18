/**
 * Viewport Tile Cache
 *
 * Implements geohash-based tile caching for map viewport queries.
 * Instead of caching arbitrary bounding box queries, we cache by
 * geohash tiles which can be reused across similar viewport queries.
 *
 * Benefits:
 * - High cache hit rate due to discrete tile boundaries
 * - Efficient invalidation (only invalidate affected tiles)
 * - Predictable memory usage
 * - Fast lookups with O(n) where n = number of tiles
 */

import { cacheManager, CACHE_TTL } from './cache-manager'
import {
  encodeGeohash,
  getGeohashesForBounds,
  getOptimalPrecision,
  decodeGeohashBounds,
} from './geohash'

// Tile cache namespace
const TILE_NAMESPACE = 'viewport-tiles'

// Default precision for UK (precision 5 = ~5km cells)
const DEFAULT_PRECISION = 5

// Cache TTL for tiles (5 minutes for frequently changing data)
const TILE_TTL = CACHE_TTL.SHORT

export interface TileCacheEntry<T> {
  geohash: string
  data: T[]
  bounds: {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  }
  timestamp: number
  farmCount: number
}

export interface ViewportQuery {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
  filters?: {
    category?: string | null
    produce?: string | null
    county?: string | null
    openNow?: boolean
  }
}

export interface TileCacheStats {
  hits: number
  misses: number
  partialHits: number
  tilesRequested: number
  tilesFromCache: number
}

// In-memory stats for monitoring
let stats: TileCacheStats = {
  hits: 0,
  misses: 0,
  partialHits: 0,
  tilesRequested: 0,
  tilesFromCache: 0,
}

/**
 * Generate cache key for a tile
 * Includes filters to ensure different filter combinations are cached separately
 */
function getTileKey(geohash: string, filters?: ViewportQuery['filters']): string {
  const filterParts: string[] = [geohash]

  if (filters) {
    if (filters.category) filterParts.push(`c:${filters.category}`)
    if (filters.produce) filterParts.push(`p:${filters.produce}`)
    if (filters.county) filterParts.push(`co:${filters.county}`)
    if (filters.openNow) filterParts.push('on:1')
  }

  return filterParts.join('|')
}

/**
 * Get cached farms for a single tile
 */
export async function getTileCached<T>(
  geohash: string,
  filters?: ViewportQuery['filters']
): Promise<TileCacheEntry<T> | null> {
  const key = getTileKey(geohash, filters)
  return cacheManager.get<TileCacheEntry<T>>(TILE_NAMESPACE, key)
}

/**
 * Cache farms for a single tile
 */
export async function setTileCached<T>(
  geohash: string,
  data: T[],
  filters?: ViewportQuery['filters']
): Promise<void> {
  const key = getTileKey(geohash, filters)
  const bounds = decodeGeohashBounds(geohash)

  const entry: TileCacheEntry<T> = {
    geohash,
    data,
    bounds,
    timestamp: Date.now(),
    farmCount: data.length,
  }

  await cacheManager.set(TILE_NAMESPACE, key, entry, {
    ttl: TILE_TTL,
    tags: ['viewport', `tile:${geohash}`],
  })
}

/**
 * Get farms for a viewport using tile cache
 *
 * Returns:
 * - cachedFarms: Farms from cache
 * - uncachedTiles: Geohashes that need to be fetched
 * - allTiles: All tiles covering the viewport
 */
export async function getViewportCached<T>(
  query: ViewportQuery
): Promise<{
  cachedFarms: T[]
  uncachedTiles: string[]
  allTiles: string[]
  cacheHitRate: number
}> {
  const { minLat, maxLat, minLng, maxLng, filters } = query

  // Get optimal precision for this viewport size
  const precision = getOptimalPrecision(minLat, maxLat, minLng, maxLng)

  // Get all geohashes that cover the viewport
  const tiles = getGeohashesForBounds(minLat, maxLat, minLng, maxLng, precision)

  stats.tilesRequested += tiles.length

  // Check cache for each tile
  const cacheResults = await Promise.all(
    tiles.map(async (geohash) => {
      const cached = await getTileCached<T>(geohash, filters)
      return { geohash, cached }
    })
  )

  const cachedFarms: T[] = []
  const uncachedTiles: string[] = []

  for (const { geohash, cached } of cacheResults) {
    if (cached) {
      cachedFarms.push(...cached.data)
      stats.tilesFromCache++
    } else {
      uncachedTiles.push(geohash)
    }
  }

  // Update stats
  if (uncachedTiles.length === 0) {
    stats.hits++
  } else if (cachedFarms.length > 0) {
    stats.partialHits++
  } else {
    stats.misses++
  }

  const cacheHitRate = tiles.length > 0
    ? ((tiles.length - uncachedTiles.length) / tiles.length) * 100
    : 0

  return {
    cachedFarms,
    uncachedTiles,
    allTiles: tiles,
    cacheHitRate,
  }
}

/**
 * Cache fetched farms by their tiles
 *
 * Groups farms by their geohash and caches each tile separately.
 * This enables efficient reuse of cached data.
 */
export async function cacheViewportFarms<T extends { location: { lat: number; lng: number } }>(
  farms: T[],
  tiles: string[],
  filters?: ViewportQuery['filters'],
  precision: number = DEFAULT_PRECISION
): Promise<void> {
  // Group farms by tile
  const farmsByTile = new Map<string, T[]>()

  // Initialize all tiles (even empty ones need caching)
  for (const tile of tiles) {
    farmsByTile.set(tile, [])
  }

  // Assign each farm to its tile
  for (const farm of farms) {
    const geohash = encodeGeohash(farm.location.lat, farm.location.lng, precision)

    // Find matching tile (might be slightly different due to precision)
    const matchingTile = tiles.find(tile =>
      geohash.startsWith(tile) || tile.startsWith(geohash)
    ) || geohash

    const existing = farmsByTile.get(matchingTile) || []
    existing.push(farm)
    farmsByTile.set(matchingTile, existing)
  }

  // Cache each tile
  await Promise.all(
    Array.from(farmsByTile.entries()).map(([geohash, tileFarms]) =>
      setTileCached(geohash, tileFarms, filters)
    )
  )
}

/**
 * Invalidate tiles that contain a specific location
 * Call this when a farm is updated or deleted
 */
export async function invalidateTilesForLocation(
  lat: number,
  lng: number
): Promise<void> {
  // Invalidate at multiple precision levels
  const precisions = [3, 4, 5, 6]

  for (const precision of precisions) {
    const geohash = encodeGeohash(lat, lng, precision)
    await cacheManager.invalidateByTags(TILE_NAMESPACE, [`tile:${geohash}`])
  }
}

/**
 * Invalidate all viewport tiles
 * Call this after major data updates
 */
export async function invalidateAllTiles(): Promise<void> {
  await cacheManager.invalidateByTags(TILE_NAMESPACE, ['viewport'])
}

/**
 * Get cache statistics
 */
export function getTileCacheStats(): TileCacheStats & { hitRate: number } {
  const total = stats.hits + stats.misses + stats.partialHits
  return {
    ...stats,
    hitRate: total > 0 ? (stats.hits / total) * 100 : 0,
  }
}

/**
 * Reset cache statistics
 */
export function resetTileCacheStats(): void {
  stats = {
    hits: 0,
    misses: 0,
    partialHits: 0,
    tilesRequested: 0,
    tilesFromCache: 0,
  }
}

/**
 * Warm cache for UK region
 * Pre-caches tiles for high-traffic areas
 */
export async function warmUKTileCache<T>(
  fetchFarmsForTile: (geohash: string) => Promise<T[]>
): Promise<void> {
  // UK bounding box (approximate)
  const ukBounds = {
    minLat: 49.9,
    maxLat: 58.7,
    minLng: -8.2,
    maxLng: 1.8,
  }

  // Get precision 4 tiles (county-level, ~40km cells)
  const tiles = getGeohashesForBounds(
    ukBounds.minLat,
    ukBounds.maxLat,
    ukBounds.minLng,
    ukBounds.maxLng,
    4
  )

  console.log(`Warming ${tiles.length} UK tiles...`)

  // Warm in batches to avoid overwhelming the database
  const batchSize = 10
  for (let i = 0; i < tiles.length; i += batchSize) {
    const batch = tiles.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (geohash) => {
        try {
          const farms = await fetchFarmsForTile(geohash)
          await setTileCached(geohash, farms)
        } catch (err) {
          console.error(`Failed to warm tile ${geohash}:`, err)
        }
      })
    )
  }

  console.log('UK tile cache warming complete')
}
