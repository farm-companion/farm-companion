import { NextResponse } from 'next/server'
import { apiMiddleware } from '@/lib/api-middleware'
import { performanceMonitor } from '@/lib/performance-monitor'
import { cacheManager } from '@/lib/cache-manager'
import { getMemoryUsage, getCPUUsage } from '@/lib/performance-monitor'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

interface PerformanceSummary {
  avgResponseTime: number
  errorRate: number
  topSlowRoutes: Array<{ route: string }>
}

interface WebVitalsSummary {
  lcp: { p95: number }
  fid: { p95: number }
  cls: { p95: number }
}

interface CacheStats {
  hitRate: number
  hits: number
  misses: number
}

async function performanceDashboardHandler() {
  const logger = createRouteLogger('api/performance/dashboard')

  try {
    logger.info('Generating performance dashboard')
    // Get performance metrics
    const performanceSummary = await performanceMonitor.getPerformanceSummary(24)
    const webVitalsSummary = await performanceMonitor.getWebVitalsSummary(24)
    const cacheStats = cacheManager.getStats()
    const memoryUsage = getMemoryUsage()
    const cpuUsage = getCPUUsage()
    
    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage,
      cpuUsage,
      environment: process.env.NODE_ENV
    }
    
    // Calculate performance scores
    const performanceScore = calculatePerformanceScore(performanceSummary, webVitalsSummary)
    const cacheScore = calculateCacheScore(cacheStats)
    const overallScore = (performanceScore + cacheScore) / 2
    
    // Get recommendations
    const recommendations = generateRecommendations(performanceSummary, webVitalsSummary, cacheStats)

    logger.info('Performance dashboard generated successfully', {
      overallScore,
      performanceScore,
      cacheScore,
      recommendationsCount: recommendations.length
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallScore,
      performance: {
        score: performanceScore,
        summary: performanceSummary,
        webVitals: webVitalsSummary
      },
      cache: {
        score: cacheScore,
        stats: cacheStats
      },
      system: systemInfo,
      recommendations
    })
  } catch (error) {
    return handleApiError(error, 'api/performance/dashboard')
  }
}

// Calculate performance score (0-100)
function calculatePerformanceScore(
  performanceSummary: PerformanceSummary,
  webVitalsSummary: WebVitalsSummary
): number {
  let score = 100
  
  // Deduct points for slow response times
  if (performanceSummary.avgResponseTime > 1000) {
    score -= 20
  } else if (performanceSummary.avgResponseTime > 500) {
    score -= 10
  }
  
  // Deduct points for high error rates
  if (performanceSummary.errorRate > 0.05) {
    score -= 30
  } else if (performanceSummary.errorRate > 0.01) {
    score -= 15
  }
  
  // Deduct points for poor Web Vitals
  if (webVitalsSummary.lcp.p95 > 4000) {
    score -= 20
  } else if (webVitalsSummary.lcp.p95 > 2500) {
    score -= 10
  }
  
  if (webVitalsSummary.fid.p95 > 300) {
    score -= 15
  } else if (webVitalsSummary.fid.p95 > 100) {
    score -= 8
  }
  
  if (webVitalsSummary.cls.p95 > 0.25) {
    score -= 15
  } else if (webVitalsSummary.cls.p95 > 0.1) {
    score -= 8
  }
  
  return Math.max(0, score)
}

// Calculate cache score (0-100)
function calculateCacheScore(cacheStats: CacheStats): number {
  let score = 100
  
  // Deduct points for low hit rate
  if (cacheStats.hitRate < 50) {
    score -= 30
  } else if (cacheStats.hitRate < 70) {
    score -= 15
  }
  
  // Deduct points for high miss rate
  if (cacheStats.misses > cacheStats.hits) {
    score -= 20
  }
  
  return Math.max(0, score)
}

// Generate performance recommendations
function generateRecommendations(
  performanceSummary: PerformanceSummary,
  webVitalsSummary: WebVitalsSummary,
  cacheStats: CacheStats
): string[] {
  const recommendations: string[] = []
  
  // Performance recommendations
  if (performanceSummary.avgResponseTime > 500) {
    recommendations.push('Consider implementing response caching for slow API endpoints')
  }
  
  if (performanceSummary.errorRate > 0.01) {
    recommendations.push('Investigate and fix high error rate endpoints')
  }
  
  if (performanceSummary.topSlowRoutes.length > 0) {
    recommendations.push(`Optimize slow routes: ${performanceSummary.topSlowRoutes.slice(0, 3).map((r) => r.route).join(', ')}`)
  }
  
  // Web Vitals recommendations
  if (webVitalsSummary.lcp.p95 > 2500) {
    recommendations.push('Optimize Largest Contentful Paint - consider image optimization and lazy loading')
  }
  
  if (webVitalsSummary.fid.p95 > 100) {
    recommendations.push('Reduce First Input Delay - optimize JavaScript execution')
  }
  
  if (webVitalsSummary.cls.p95 > 0.1) {
    recommendations.push('Improve Cumulative Layout Shift - ensure stable layouts')
  }
  
  // Cache recommendations
  if (cacheStats.hitRate < 70) {
    recommendations.push('Improve cache hit rate - review cache keys and TTL settings')
  }
  
  if (cacheStats.misses > cacheStats.hits) {
    recommendations.push('Consider implementing more aggressive caching strategies')
  }
  
  // System recommendations
  const memoryUsage = getMemoryUsage()
  if (memoryUsage.percentage > 80) {
    recommendations.push('High memory usage detected - consider memory optimization')
  }
  
  return recommendations
}

export const GET = apiMiddleware.admin(performanceDashboardHandler)
