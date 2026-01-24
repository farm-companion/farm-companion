// Comprehensive Performance Monitoring System
// PuredgeOS 3.0 Compliant Performance Monitoring

import { kv } from '@vercel/kv'
import { logger } from '@/lib/logger'

const perfLogger = logger.child({ route: 'lib/performance-monitor' })

export interface PerformanceMetrics {
  route: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: number
  userAgent?: string
  ip?: string
  cacheHit?: boolean
  memoryUsage?: number
  cpuUsage?: number
}

export interface WebVitalsMetrics {
  route: string
  timestamp: number
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  inp?: number // Interaction to Next Paint
}

export interface CacheMetrics {
  key: string
  hit: boolean
  miss: boolean
  ttl: number
  size: number
  timestamp: number
}

export interface DatabaseMetrics {
  operation: string
  table?: string
  duration: number
  rowsAffected?: number
  cacheHit?: boolean
  timestamp: number
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metricsBuffer: PerformanceMetrics[] = []
  private webVitalsBuffer: WebVitalsMetrics[] = []
  private cacheMetricsBuffer: CacheMetrics[] = []
  private databaseMetricsBuffer: DatabaseMetrics[] = []
  private readonly bufferSize = 100
  private readonly flushInterval = 30000 // 30 seconds

  private constructor() {
    // Start periodic flush
    if (typeof window === 'undefined') {
      setInterval(() => this.flushMetrics(), this.flushInterval)
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track API performance
  public trackAPIPerformance(metrics: PerformanceMetrics): void {
    this.metricsBuffer.push(metrics)
    
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flushMetrics()
    }
  }

  // Track Web Vitals
  public trackWebVitals(metrics: WebVitalsMetrics): void {
    this.webVitalsBuffer.push(metrics)
    
    if (this.webVitalsBuffer.length >= this.bufferSize) {
      this.flushWebVitals()
    }
  }

  // Track cache performance
  public trackCachePerformance(metrics: CacheMetrics): void {
    this.cacheMetricsBuffer.push(metrics)
    
    if (this.cacheMetricsBuffer.length >= this.bufferSize) {
      this.flushCacheMetrics()
    }
  }

  // Track database performance
  public trackDatabasePerformance(metrics: DatabaseMetrics): void {
    this.databaseMetricsBuffer.push(metrics)
    
    if (this.databaseMetricsBuffer.length >= this.bufferSize) {
      this.flushDatabaseMetrics()
    }
  }

  // Flush API metrics to storage
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
        const timestamp = Date.now()
        const bucketKey = `perf:api:${Math.floor(timestamp / (60 * 1000))}` // Minute bucket
        
        // Store metrics in Redis
        for (const metric of metrics) {
          await kv.lpush(bucketKey, JSON.stringify(metric))
        }
        
        // Set TTL for the bucket (1 hour)
        await kv.expire(bucketKey, 3600)
        
        // Update aggregated stats
        await this.updateAggregatedStats(metrics)
      }
    } catch (error) {
      perfLogger.error('Failed to flush performance metrics', {}, error as Error)
    }
  }

  // Flush Web Vitals to storage
  private async flushWebVitals(): Promise<void> {
    if (this.webVitalsBuffer.length === 0) return

    const metrics = [...this.webVitalsBuffer]
    this.webVitalsBuffer = []

    try {
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
        const timestamp = Date.now()
        const bucketKey = `perf:webvitals:${Math.floor(timestamp / (60 * 1000))}` // Minute bucket
        
        // Store metrics in Redis
        for (const metric of metrics) {
          await kv.lpush(bucketKey, JSON.stringify(metric))
        }
        
        // Set TTL for the bucket (1 hour)
        await kv.expire(bucketKey, 3600)
      }
    } catch (error) {
      perfLogger.error('Failed to flush Web Vitals metrics', {}, error as Error)
    }
  }

  // Flush cache metrics to storage
  private async flushCacheMetrics(): Promise<void> {
    if (this.cacheMetricsBuffer.length === 0) return

    const metrics = [...this.cacheMetricsBuffer]
    this.cacheMetricsBuffer = []

    try {
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
        const timestamp = Date.now()
        const bucketKey = `perf:cache:${Math.floor(timestamp / (60 * 1000))}` // Minute bucket
        
        // Store metrics in Redis
        for (const metric of metrics) {
          await kv.lpush(bucketKey, JSON.stringify(metric))
        }
        
        // Set TTL for the bucket (1 hour)
        await kv.expire(bucketKey, 3600)
      }
    } catch (error) {
      perfLogger.error('Failed to flush cache metrics', {}, error as Error)
    }
  }

  // Flush database metrics to storage
  private async flushDatabaseMetrics(): Promise<void> {
    if (this.databaseMetricsBuffer.length === 0) return

    const metrics = [...this.databaseMetricsBuffer]
    this.databaseMetricsBuffer = []

    try {
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
        const timestamp = Date.now()
        const bucketKey = `perf:db:${Math.floor(timestamp / (60 * 1000))}` // Minute bucket
        
        // Store metrics in Redis
        for (const metric of metrics) {
          await kv.lpush(bucketKey, JSON.stringify(metric))
        }
        
        // Set TTL for the bucket (1 hour)
        await kv.expire(bucketKey, 3600)
      }
    } catch (error) {
      perfLogger.error('Failed to flush database metrics', {}, error as Error)
    }
  }

  // Update aggregated performance statistics
  private async updateAggregatedStats(metrics: PerformanceMetrics[]): Promise<void> {
    try {
      const now = Date.now()
      const hourBucket = Math.floor(now / (60 * 60 * 1000))
      
      // Calculate aggregated stats
      const routeStats: Record<string, { count: number; totalTime: number; errors: number }> = {}
      
      for (const metric of metrics) {
        if (!routeStats[metric.route]) {
          routeStats[metric.route] = { count: 0, totalTime: 0, errors: 0 }
        }
        
        routeStats[metric.route].count++
        routeStats[metric.route].totalTime += metric.responseTime
        
        if (metric.statusCode >= 400) {
          routeStats[metric.route].errors++
        }
      }
      
      // Store aggregated stats
      for (const [route, stats] of Object.entries(routeStats)) {
        const avgResponseTime = stats.totalTime / stats.count
        const errorRate = stats.errors / stats.count
        
        const statsKey = `perf:stats:${route}:${hourBucket}`
        const statsData = {
          route,
          count: stats.count,
          avgResponseTime,
          errorRate,
          timestamp: now
        }
        
        await kv.setex(statsKey, 86400, JSON.stringify(statsData)) // 24 hour TTL
      }
    } catch (error) {
      perfLogger.error('Failed to update aggregated stats', {}, error as Error)
    }
  }

  // Get performance summary
  public async getPerformanceSummary(hours: number = 24): Promise<{
    totalRequests: number
    avgResponseTime: number
    errorRate: number
    topSlowRoutes: Array<{ route: string; avgResponseTime: number; count: number }>
    topErrorRoutes: Array<{ route: string; errorRate: number; count: number }>
  }> {
    try {
      if (!process.env.VERCEL_KV_REST_API_URL) {
        return {
          totalRequests: 0,
          avgResponseTime: 0,
          errorRate: 0,
          topSlowRoutes: [],
          topErrorRoutes: []
        }
      }

      const now = Date.now()
      const startTime = now - (hours * 60 * 60 * 1000)
      
      let totalRequests = 0
      let totalResponseTime = 0
      let totalErrors = 0
      const routeStats: Record<string, { count: number; totalTime: number; errors: number }> = {}
      
      // Collect stats from recent hour buckets
      for (let i = 0; i < hours; i++) {
        const bucketTime = Math.floor((now - (i * 60 * 60 * 1000)) / (60 * 60 * 1000))
        
        // Get all route stats for this hour
        const keys = await kv.keys(`perf:stats:*:${bucketTime}`)
        
        for (const key of keys) {
          const statsData = await kv.get(key)
          if (statsData) {
            const stats = JSON.parse(statsData as string)
            const route = stats.route
            
            if (!routeStats[route]) {
              routeStats[route] = { count: 0, totalTime: 0, errors: 0 }
            }
            
            routeStats[route].count += stats.count
            routeStats[route].totalTime += stats.avgResponseTime * stats.count
            routeStats[route].errors += stats.errorRate * stats.count
            
            totalRequests += stats.count
            totalResponseTime += stats.avgResponseTime * stats.count
            totalErrors += stats.errorRate * stats.count
          }
        }
      }
      
      // Calculate top slow routes
      const topSlowRoutes = Object.entries(routeStats)
        .map(([route, stats]) => ({
          route,
          avgResponseTime: stats.totalTime / stats.count,
          count: stats.count
        }))
        .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
        .slice(0, 10)
      
      // Calculate top error routes
      const topErrorRoutes = Object.entries(routeStats)
        .map(([route, stats]) => ({
          route,
          errorRate: stats.errors / stats.count,
          count: stats.count
        }))
        .filter(route => route.errorRate > 0)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 10)
      
      return {
        totalRequests,
        avgResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
        topSlowRoutes,
        topErrorRoutes
      }
    } catch (error) {
      perfLogger.error('Failed to get performance summary', { hours }, error as Error)
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        topSlowRoutes: [],
        topErrorRoutes: []
      }
    }
  }

  // Get Web Vitals summary
  public async getWebVitalsSummary(hours: number = 24): Promise<{
    lcp: { p50: number; p75: number; p95: number }
    fid: { p50: number; p75: number; p95: number }
    cls: { p50: number; p75: number; p95: number }
    fcp: { p50: number; p75: number; p95: number }
    ttfb: { p50: number; p75: number; p95: number }
  }> {
    try {
      if (!process.env.VERCEL_KV_REST_API_URL) {
        return {
          lcp: { p50: 0, p75: 0, p95: 0 },
          fid: { p50: 0, p75: 0, p95: 0 },
          cls: { p50: 0, p75: 0, p95: 0 },
          fcp: { p50: 0, p75: 0, p95: 0 },
          ttfb: { p50: 0, p75: 0, p95: 0 }
        }
      }

      const now = Date.now()
      const startTime = now - (hours * 60 * 60 * 1000)
      
      const webVitals: { lcp: number[]; fid: number[]; cls: number[]; fcp: number[]; ttfb: number[] } = {
        lcp: [],
        fid: [],
        cls: [],
        fcp: [],
        ttfb: []
      }
      
      // Collect Web Vitals from recent minute buckets
      for (let i = 0; i < hours * 60; i++) {
        const bucketTime = Math.floor((now - (i * 60 * 1000)) / (60 * 1000))
        const bucketKey = `perf:webvitals:${bucketTime}`
        
        const metrics = await kv.lrange(bucketKey, 0, -1)
        
        for (const metricStr of metrics) {
          try {
            const metric = JSON.parse(metricStr) as WebVitalsMetrics
            if (metric.timestamp >= startTime) {
              if (metric.lcp) webVitals.lcp.push(metric.lcp)
              if (metric.fid) webVitals.fid.push(metric.fid)
              if (metric.cls) webVitals.cls.push(metric.cls)
              if (metric.fcp) webVitals.fcp.push(metric.fcp)
              if (metric.ttfb) webVitals.ttfb.push(metric.ttfb)
            }
          } catch {
            // Skip invalid metrics
          }
        }
      }
      
      // Calculate percentiles
      const calculatePercentile = (values: number[], percentile: number): number => {
        if (values.length === 0) return 0
        const sorted = values.sort((a, b) => a - b)
        const index = Math.ceil((percentile / 100) * sorted.length) - 1
        return sorted[Math.max(0, index)]
      }
      
      return {
        lcp: {
          p50: calculatePercentile(webVitals.lcp, 50),
          p75: calculatePercentile(webVitals.lcp, 75),
          p95: calculatePercentile(webVitals.lcp, 95)
        },
        fid: {
          p50: calculatePercentile(webVitals.fid, 50),
          p75: calculatePercentile(webVitals.fid, 75),
          p95: calculatePercentile(webVitals.fid, 95)
        },
        cls: {
          p50: calculatePercentile(webVitals.cls, 50),
          p75: calculatePercentile(webVitals.cls, 75),
          p95: calculatePercentile(webVitals.cls, 95)
        },
        fcp: {
          p50: calculatePercentile(webVitals.fcp, 50),
          p75: calculatePercentile(webVitals.fcp, 75),
          p95: calculatePercentile(webVitals.fcp, 95)
        },
        ttfb: {
          p50: calculatePercentile(webVitals.ttfb, 50),
          p75: calculatePercentile(webVitals.ttfb, 75),
          p95: calculatePercentile(webVitals.ttfb, 95)
        }
      }
    } catch (error) {
      perfLogger.error('Failed to get Web Vitals summary', { hours }, error as Error)
      return {
        lcp: { p50: 0, p75: 0, p95: 0 },
        fid: { p50: 0, p75: 0, p95: 0 },
        cls: { p50: 0, p75: 0, p95: 0 },
        fcp: { p50: 0, p75: 0, p95: 0 },
        ttfb: { p50: 0, p75: 0, p95: 0 }
      }
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Utility functions for easy usage
export function trackAPIPerformance(metrics: PerformanceMetrics): void {
  performanceMonitor.trackAPIPerformance(metrics)
}

export function trackWebVitals(metrics: WebVitalsMetrics): void {
  performanceMonitor.trackWebVitals(metrics)
}

export function trackCachePerformance(metrics: CacheMetrics): void {
  performanceMonitor.trackCachePerformance(metrics)
}

export function trackDatabasePerformance(metrics: DatabaseMetrics): void {
  performanceMonitor.trackDatabasePerformance(metrics)
}

// Performance timing utilities
export class PerformanceTimer {
  private startTime: number
  private endTime?: number

  constructor() {
    this.startTime = Date.now()
  }

  public end(): number {
    this.endTime = Date.now()
    return this.endTime - this.startTime
  }

  public getElapsed(): number {
    return (this.endTime || Date.now()) - this.startTime
  }
}

// Memory usage tracking
export function getMemoryUsage(): { used: number; total: number; percentage: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const total = usage.heapTotal
    const used = usage.heapUsed
    return {
      used,
      total,
      percentage: (used / total) * 100
    }
  }
  
  return { used: 0, total: 0, percentage: 0 }
}

// CPU usage tracking (simplified)
export function getCPUUsage(): number {
  // This is a simplified implementation
  // In production, you'd use a more sophisticated CPU monitoring library
  return 0
}
