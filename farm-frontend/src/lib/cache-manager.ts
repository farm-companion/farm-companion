// Comprehensive Caching System
// PuredgeOS 3.0 Compliant Cache Management

import { kv } from '@vercel/kv'
import { trackCachePerformance } from './performance-monitor'
import { logger } from '@/lib/logger'

const cacheLogger = logger.child({ route: 'lib/cache-manager' })

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  compress?: boolean // Whether to compress the data
  version?: string // Cache version for invalidation
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  version: string
  compressed: boolean
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
  totalSize: number
}

// Cache manager class
export class CacheManager {
  private static instance: CacheManager
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    totalSize: 0
  }
  private readonly defaultTTL = 3600 // 1 hour
  private readonly maxKeyLength = 250
  private readonly compressionThreshold = 1024 // 1KB

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Generate cache key with namespace
  private generateKey(namespace: string, key: string): string {
    const fullKey = `${namespace}:${key}`
    if (fullKey.length > this.maxKeyLength) {
      // Hash long keys
      const hash = this.hashString(fullKey)
      return `${namespace}:hash:${hash}`
    }
    return fullKey
  }

  // Simple hash function for long keys
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // Compress data if needed
  private compress(data: any): { data: any; compressed: boolean } {
    if (this.compressionThreshold > 0 && JSON.stringify(data).length > this.compressionThreshold) {
      // In a real implementation, you'd use a compression library like pako
      // For now, we'll just return the data as-is
      return { data, compressed: false }
    }
    return { data, compressed: false }
  }

  // Decompress data if needed
  private decompress(data: any, compressed: boolean): any {
    if (compressed) {
      // In a real implementation, you'd decompress here
      return data
    }
    return data
  }

  // Get data from cache
  public async get<T>(namespace: string, key: string): Promise<T | null> {
    const startTime = Date.now()
    
    try {
      const cacheKey = this.generateKey(namespace, key)
      const cached = await kv.get(cacheKey)
      
      if (!cached) {
        this.stats.misses++
        this.updateHitRate()
        
        trackCachePerformance({
          key: cacheKey,
          hit: false,
          miss: true,
          ttl: 0,
          size: 0,
          timestamp: Date.now()
        })
        
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(cached as string)
      
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.delete(namespace, key)
        this.stats.misses++
        this.updateHitRate()
        
        trackCachePerformance({
          key: cacheKey,
          hit: false,
          miss: true,
          ttl: entry.ttl,
          size: JSON.stringify(entry).length,
          timestamp: Date.now()
        })
        
        return null
      }

      this.stats.hits++
      this.updateHitRate()
      
      const data = this.decompress(entry.data, entry.compressed)
      
      trackCachePerformance({
        key: cacheKey,
        hit: true,
        miss: false,
        ttl: entry.ttl,
        size: JSON.stringify(entry).length,
        timestamp: Date.now()
      })
      
      return data
    } catch (error) {
      cacheLogger.error('Cache get error', { namespace, key }, error as Error)
      this.stats.misses++
      this.updateHitRate()
      return null
    }
  }

  // Set data in cache
  public async set<T>(
    namespace: string, 
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const ttl = options.ttl || this.defaultTTL
      const tags = options.tags || []
      const version = options.version || '1.0'
      
      const { data: processedData, compressed } = this.compress(data)
      
      const entry: CacheEntry<T> = {
        data: processedData,
        timestamp: Date.now(),
        ttl,
        tags,
        version,
        compressed
      }

      const cacheKey = this.generateKey(namespace, key)
      await kv.setex(cacheKey, ttl, JSON.stringify(entry))
      
      // Store tags for invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
          const tagKey = `tag:${namespace}:${tag}`
          await kv.sadd(tagKey, cacheKey)
          await kv.expire(tagKey, ttl)
        }
      }
      
      this.stats.sets++
      this.stats.totalSize += JSON.stringify(entry).length
      
      trackCachePerformance({
        key: cacheKey,
        hit: false,
        miss: false,
        ttl,
        size: JSON.stringify(entry).length,
        timestamp: Date.now()
      })
      
      return true
    } catch (error) {
      cacheLogger.error('Cache set error', { namespace, key }, error as Error)
      return false
    }
  }

  // Delete data from cache
  public async delete(namespace: string, key: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(namespace, key)
      const result = await kv.del(cacheKey)
      
      this.stats.deletes++
      
      return result > 0
    } catch (error) {
      cacheLogger.error('Cache delete error', { namespace, key }, error as Error)
      return false
    }
  }

  // Invalidate cache by tags
  public async invalidateByTags(namespace: string, tags: string[]): Promise<number> {
    let deletedCount = 0
    
    try {
      for (const tag of tags) {
        const tagKey = `tag:${namespace}:${tag}`
        const keys = await kv.smembers(tagKey)
        
        if (keys.length > 0) {
          await kv.del(...keys)
          await kv.del(tagKey)
          deletedCount += keys.length
        }
      }
      
      return deletedCount
    } catch (error) {
      cacheLogger.error('Cache invalidation error', { namespace, tags }, error as Error)
      return deletedCount
    }
  }

  // Clear all cache for a namespace
  public async clearNamespace(namespace: string): Promise<number> {
    try {
      const pattern = `${namespace}:*`
      const keys = await kv.keys(pattern)
      
      if (keys.length > 0) {
        await kv.del(...keys)
      }
      
      return keys.length
    } catch (error) {
      cacheLogger.error('Cache clear error', { namespace }, error as Error)
      return 0
    }
  }

  // Get cache statistics
  public getStats(): CacheStats {
    return { ...this.stats }
  }

  // Update hit rate
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  // Reset statistics
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      totalSize: 0
    }
  }
}

// Global cache manager instance
export const cacheManager = CacheManager.getInstance()

// Cache decorator for functions
export function cached<T extends any[], R>(
  namespace: string,
  keyGenerator: (...args: T) => string,
  options: CacheOptions = {}
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function(...args: T): Promise<R> {
      const key = keyGenerator(...args)
      const cached = await cacheManager.get<R>(namespace, key)
      
      if (cached !== null) {
        return cached
      }

      const result = await method.apply(this, args)
      await cacheManager.set(namespace, key, result, options)
      
      return result
    }

    return descriptor
  }
}

// Cache utility functions
export async function getCached<T>(
  namespace: string,
  key: string
): Promise<T | null> {
  return cacheManager.get<T>(namespace, key)
}

export async function setCached<T>(
  namespace: string,
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<boolean> {
  return cacheManager.set(namespace, key, data, options)
}

export async function deleteCached(
  namespace: string,
  key: string
): Promise<boolean> {
  return cacheManager.delete(namespace, key)
}

export async function invalidateCacheByTags(
  namespace: string,
  tags: string[]
): Promise<number> {
  return cacheManager.invalidateByTags(namespace, tags)
}

export async function clearCacheNamespace(
  namespace: string
): Promise<number> {
  return cacheManager.clearNamespace(namespace)
}

// Predefined cache namespaces
export const CACHE_NAMESPACES = {
  FARMS: 'farms',
  PRODUCE: 'produce',
  IMAGES: 'images',
  API_RESPONSES: 'api',
  USER_SESSIONS: 'sessions',
  SEARCH_RESULTS: 'search',
  STATIC_CONTENT: 'static',
  COMPUTED_DATA: 'computed'
} as const

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour
  LONG: 86400, // 24 hours
  VERY_LONG: 604800, // 7 days
  PERMANENT: 31536000 // 1 year
} as const

// Cache tags for invalidation
export const CACHE_TAGS = {
  FARMS: 'farms',
  PRODUCE: 'produce',
  IMAGES: 'images',
  USER_DATA: 'user_data',
  SEARCH: 'search',
  STATIC: 'static'
} as const
