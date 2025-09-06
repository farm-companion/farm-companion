// Performance Optimization Middleware
// PuredgeOS 3.0 Compliant Performance Middleware

import { NextRequest, NextResponse } from 'next/server'
import { 
  trackAPIPerformance, 
  PerformanceTimer, 
  getMemoryUsage,
  getCPUUsage 
} from './performance-monitor'
import { 
  cacheManager, 
  CACHE_TTL,
  getCached,
  setCached 
} from './cache-manager'
import { extractRequestContext } from './error-handler'

// Performance middleware with caching
export function withPerformanceCache<T extends any[]>(
  namespace: string,
  keyGenerator: (request: NextRequest, ...args: T) => string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const timer = new PerformanceTimer()
      const context = extractRequestContext(request)
      
      try {
        // Generate cache key
        const cacheKey = keyGenerator(request, ...(args as unknown as T))
        
        // Try to get from cache first
        const cached = await getCached<{ data: any; headers: Record<string, string> }>(
          namespace,
          cacheKey
        )
        
        if (cached) {
          const response = NextResponse.json(cached.data)
          
          // Set cached headers
          Object.entries(cached.headers).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
          
          // Add cache hit header
          response.headers.set('X-Cache', 'HIT')
          response.headers.set('X-Cache-Key', cacheKey)
          
          // Track performance
          const responseTime = timer.end()
          trackAPIPerformance({
            route: context.route || 'unknown',
            method: context.method || 'GET',
            responseTime,
            statusCode: 200,
            timestamp: Date.now(),
            userAgent: context.userAgent,
            ip: context.ip,
            cacheHit: true,
            memoryUsage: getMemoryUsage().used,
            cpuUsage: getCPUUsage()
          })
          
          return response
        }
        
        // Execute handler
        const response = await handler(request, ...args)
        const responseTime = timer.end()
        
        // Cache successful responses
        if (response.status >= 200 && response.status < 300) {
          const responseData = await response.clone().json().catch(() => null)
          
          if (responseData) {
            // Extract relevant headers for caching
            const relevantHeaders: Record<string, string> = {}
            const headersToCache = ['content-type', 'content-encoding', 'etag']
            
            headersToCache.forEach(header => {
              const value = response.headers.get(header)
              if (value) {
                relevantHeaders[header] = value
              }
            })
            
            await setCached(
              namespace,
              cacheKey,
              { data: responseData, headers: relevantHeaders },
              { ttl }
            )
          }
        }
        
        // Add cache miss header
        response.headers.set('X-Cache', 'MISS')
        response.headers.set('X-Cache-Key', cacheKey)
        
        // Track performance
        trackAPIPerformance({
          route: context.route || 'unknown',
          method: context.method || 'GET',
          responseTime,
          statusCode: response.status,
          timestamp: Date.now(),
          userAgent: context.userAgent,
          ip: context.ip,
          cacheHit: false,
          memoryUsage: getMemoryUsage().used,
          cpuUsage: getCPUUsage()
        })
        
        return response
      } catch (error) {
        const responseTime = timer.end()
        
        // Track performance for errors
        trackAPIPerformance({
          route: context.route || 'unknown',
          method: context.method || 'GET',
          responseTime,
          statusCode: 500,
          timestamp: Date.now(),
          userAgent: context.userAgent,
          ip: context.ip,
          cacheHit: false,
          memoryUsage: getMemoryUsage().used,
          cpuUsage: getCPUUsage()
        })
        
        throw error
      }
    }
  }
}

// Response compression middleware
export function withCompression<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(request, ...args)
    
    // Add compression headers
    const acceptEncoding = request.headers.get('accept-encoding') || ''
    
    if (acceptEncoding.includes('gzip')) {
      response.headers.set('Content-Encoding', 'gzip')
    } else if (acceptEncoding.includes('deflate')) {
      response.headers.set('Content-Encoding', 'deflate')
    }
    
    // Add cache control headers
    if (!response.headers.get('Cache-Control')) {
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    }
    
    // Add ETag for caching
    if (!response.headers.get('ETag')) {
      const content = await response.clone().text()
      const etag = `"${Buffer.from(content).toString('base64').slice(0, 16)}"`
      response.headers.set('ETag', etag)
    }
    
    return response
  }
}

// Request deduplication middleware
export function withDeduplication<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  const pendingRequests = new Map<string, Promise<NextResponse>>()
  
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = extractRequestContext(request)
    const dedupeKey = `${context.method}:${context.route}:${context.ip}`
    
    // Check if request is already pending
    if (pendingRequests.has(dedupeKey)) {
      return pendingRequests.get(dedupeKey)!
    }
    
    // Execute handler and store promise
    const promise = handler(request, ...args)
    pendingRequests.set(dedupeKey, promise)
    
    try {
      const response = await promise
      return response
    } finally {
      // Clean up pending request
      pendingRequests.delete(dedupeKey)
    }
  }
}

// Rate limiting with performance tracking
export function withPerformanceRateLimit(
  limit: number = 100,
  windowMs: number = 60000
) {
  return function<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const context = extractRequestContext(request)
      const ip = context.ip || 'unknown'
      const rateLimitKey = `rate_limit:${ip}:${context.route}`
      
      try {
        // Check rate limit
        const currentCount = await cacheManager.get<number>('rate_limit', rateLimitKey) || 0
        
        if (currentCount >= limit) {
          const response = NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
          
          response.headers.set('X-RateLimit-Limit', limit.toString())
          response.headers.set('X-RateLimit-Remaining', '0')
          response.headers.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString())
          
          return response
        }
        
        // Increment rate limit counter
        await cacheManager.set('rate_limit', rateLimitKey, currentCount + 1, {
          ttl: Math.ceil(windowMs / 1000)
        })
        
        // Execute handler
        const response = await handler(request, ...args)
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', limit.toString())
        response.headers.set('X-RateLimit-Remaining', (limit - currentCount - 1).toString())
        response.headers.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString())
        
        return response
      } catch (error) {
        throw error
      }
    }
  }
}

// Memory usage monitoring middleware
export function withMemoryMonitoring<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      const response = await handler(request, ...args)
      
      const endMemory = getMemoryUsage()
      const endTime = Date.now()
      
      // Add memory usage headers
      response.headers.set('X-Memory-Used', endMemory.used.toString())
      response.headers.set('X-Memory-Total', endMemory.total.toString())
      response.headers.set('X-Memory-Percentage', endMemory.percentage.toFixed(2))
      response.headers.set('X-Processing-Time', (endTime - startTime).toString())
      
      // Log memory usage if it's high
      if (endMemory.percentage > 80) {
        console.warn(`High memory usage: ${endMemory.percentage.toFixed(2)}%`)
      }
      
      return response
    } catch (error) {
      const endMemory = getMemoryUsage()
      const endTime = Date.now()
      
      console.error(`Memory usage during error: ${endMemory.percentage.toFixed(2)}%`)
      console.error(`Processing time: ${endTime - startTime}ms`)
      
      throw error
    }
  }
}

// Combine multiple performance middleware
export function composePerformance<T extends any[]>(
  ...middlewares: Array<(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => (request: NextRequest, ...args: T) => Promise<NextResponse>>
) {
  return function(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Pre-configured performance middleware combinations
export const performanceMiddleware = {
  // Basic performance monitoring
  basic: composePerformance(withMemoryMonitoring),
  
  // Performance with caching
  cached: (namespace: string, keyGenerator: (request: NextRequest) => string, ttl?: number) =>
    composePerformance(
      withMemoryMonitoring,
      withPerformanceCache(namespace, keyGenerator, ttl)
    ),
  
  // Performance with compression
  compressed: composePerformance(
    withMemoryMonitoring,
    withCompression
  ),
  
  // Performance with rate limiting
  rateLimited: (limit?: number, windowMs?: number) =>
    composePerformance(
      withMemoryMonitoring,
      withPerformanceRateLimit(limit, windowMs)
    ),
  
  // Full performance stack
  full: (namespace: string, keyGenerator: (request: NextRequest) => string, ttl?: number, rateLimit?: number) =>
    composePerformance(
      withMemoryMonitoring,
      withCompression,
      withDeduplication,
      withPerformanceCache(namespace, keyGenerator, ttl),
      withPerformanceRateLimit(rateLimit)
    )
}

// Performance optimization utilities
export function optimizeResponse(response: NextResponse): NextResponse {
  // Add performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Add caching headers if not present
  if (!response.headers.get('Cache-Control')) {
    response.headers.set('Cache-Control', 'public, max-age=3600')
  }
  
  // Add ETag if not present
  if (!response.headers.get('ETag')) {
    const timestamp = Date.now()
    response.headers.set('ETag', `"${timestamp}"`)
  }
  
  return response
}

// Performance monitoring for static content
export function withStaticOptimization<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(request, ...args)
    
    // Add long-term caching for static content
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    response.headers.set('Expires', new Date(Date.now() + 31536000000).toUTCString())
    
    return response
  }
}
