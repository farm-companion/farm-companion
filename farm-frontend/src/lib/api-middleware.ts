// API Middleware for Centralized Error Handling
// PuredgeOS 3.0 Compliant API Middleware

import { NextRequest, NextResponse } from 'next/server'
import { 
  withErrorHandling, 
  extractRequestContext, 
  createStructuredError, 
  logStructuredError,
  createErrorResponse,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError
} from './error-handler'
import { logAPIMetrics } from './logging'
import { trackAPIPerformance, getMemoryUsage, getCPUUsage } from './performance-monitor'

// Request timing middleware
export function withTiming<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const context = extractRequestContext(request)
    
    try {
      const response = await handler(request, ...args)
      const responseTime = Date.now() - startTime
      
      // Log API metrics
      if (context.route) {
        await logAPIMetrics({
          route: context.route,
          statusCode: response.status,
          responseTime,
          timestamp: Date.now(),
        })
        
        // Track performance metrics
        trackAPIPerformance({
          route: context.route,
          method: context.method || 'GET',
          responseTime,
          statusCode: response.status,
          timestamp: Date.now(),
          userAgent: context.userAgent,
          ip: context.ip,
          memoryUsage: getMemoryUsage().used,
          cpuUsage: getCPUUsage()
        })
      }
      
      // Add response headers
      response.headers.set('X-Response-Time', `${responseTime}ms`)
      response.headers.set('X-Request-ID', context.requestId || 'unknown')
      
      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      const structuredError = createStructuredError(error, context)
      
      // Log metrics for failed requests
      if (context.route) {
        await logAPIMetrics({
          route: context.route,
          statusCode: structuredError.type === 'validation' ? 400 : 500,
          responseTime,
          timestamp: Date.now(),
        })
        
        // Track performance metrics for errors
        trackAPIPerformance({
          route: context.route,
          method: context.method || 'GET',
          responseTime,
          statusCode: structuredError.type === 'validation' ? 400 : 500,
          timestamp: Date.now(),
          userAgent: context.userAgent,
          ip: context.ip,
          memoryUsage: getMemoryUsage().used,
          cpuUsage: getCPUUsage()
        })
      }
      
      await logStructuredError(structuredError)
      return createErrorResponse(structuredError)
    }
  }
}

// Rate limiting middleware
export function withRateLimit(
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  return function<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const context = extractRequestContext(request)
      const ip = context.ip || 'unknown'
      
      // Simple in-memory rate limiting (in production, use Redis)
      const now = Date.now()
      // This is a simplified implementation - in production, use Redis
      // For now, we'll just check if the request is coming too frequently
      
      try {
        // In a real implementation, you'd check Redis here
        // For now, we'll implement a basic check
        const recentRequests = 0 // This would come from Redis
        
        if (recentRequests >= limit) {
          throw new RateLimitError(
            `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds.`,
            context
          )
        }
        
        return await handler(request, ...args)
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        
        // If rate limiting check fails, continue with the request
        return await handler(request, ...args)
      }
    }
  }
}

// Authentication middleware
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = extractRequestContext(request)
    
    try {
      // Check for authentication token
      const authHeader = request.headers.get('authorization')
      const sessionCookie = request.cookies.get('session')
      
      if (!authHeader && !sessionCookie) {
        throw new AuthenticationError('Authentication required', context)
      }
      
      // In a real implementation, you'd validate the token here
      // For now, we'll just check if it exists
      
      return await handler(request, ...args)
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      
      // If auth check fails, continue with the request
      return await handler(request, ...args)
    }
  }
}

// Admin authorization middleware
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = extractRequestContext(request)
    
    try {
      // Check for admin authentication
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Admin authentication required', context)
      }
      
      const token = authHeader.substring(7)
      const expectedToken = process.env.ADMIN_PASSWORD
      
      if (!expectedToken || token !== expectedToken) {
        throw new AuthorizationError('Invalid admin credentials', context)
      }
      
      return await handler(request, ...args)
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error
      }
      
      // If auth check fails, continue with the request
      return await handler(request, ...args)
    }
  }
}

// CORS middleware
export function withCORS<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(request, ...args)
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }
}

// Request validation middleware
export function withValidation<T extends any[]>(
  validator: (request: NextRequest) => Promise<void> | void
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const context = extractRequestContext(request)
      
      try {
        await validator(request)
        return await handler(request, ...args)
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        
        throw new ValidationError(
          error instanceof Error ? error.message : 'Validation failed',
          undefined,
          context
        )
      }
    }
  }
}

// Combine multiple middleware
export function compose<T extends any[]>(
  ...middlewares: Array<(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => (request: NextRequest, ...args: T) => Promise<NextResponse>>
) {
  return function(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Common middleware combinations
export const apiMiddleware = {
  // Basic API middleware with error handling and timing
  basic: compose(withErrorHandling, withTiming),
  
  // Public API middleware with CORS
  public: compose(withErrorHandling, withTiming, withCORS),
  
  // Authenticated API middleware
  authenticated: compose(withErrorHandling, withTiming, withAuth),
  
  // Admin API middleware
  admin: compose(withErrorHandling, withTiming, withAdminAuth),
  
  // Rate limited API middleware
  rateLimited: (limit: number = 100) => compose(
    withErrorHandling, 
    withTiming, 
    withRateLimit(limit)
  ),
  
  // Full featured API middleware
  full: (limit: number = 100) => compose(
    withErrorHandling,
    withTiming,
    withCORS,
    withRateLimit(limit)
  ),
}
