// Comprehensive Error Handling System
// PuredgeOS 3.0 Compliant Error Management

import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { logSecurityEvent } from './logging'
import { logger } from '@/lib/logger'

const errorHandlerLogger = logger.child({ route: 'lib/error-handler' })

export interface ErrorContext {
  requestId?: string
  userId?: string
  route?: string
  method?: string
  ip?: string
  userAgent?: string
  timestamp?: string
}

export interface StructuredError {
  id: string
  type: 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'network' | 'database' | 'external' | 'internal'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context: ErrorContext
  stack?: string
  metadata?: Record<string, any>
  timestamp: string
}

export class AppError extends Error {
  public readonly type: StructuredError['type']
  public readonly severity: StructuredError['severity']
  public readonly statusCode: number
  public readonly context: ErrorContext
  public readonly metadata?: Record<string, any>
  public readonly isOperational: boolean

  constructor(
    message: string,
    type: StructuredError['type'] = 'internal',
    severity: StructuredError['severity'] = 'medium',
    statusCode: number = 500,
    context: ErrorContext = {},
    metadata?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.statusCode = statusCode
    this.context = context
    this.metadata = metadata
    this.isOperational = isOperational

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Generate unique error ID
export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Extract request context
export function extractRequestContext(request: NextRequest): ErrorContext {
  const url = new URL(request.url)
  return {
    requestId: request.headers.get('x-request-id') || generateErrorId(),
    route: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
  }
}

// Log structured error
export async function logStructuredError(error: StructuredError): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_KV_REST_API_URL) {
      // Store in KV with TTL based on severity
      const ttl = error.severity === 'critical' ? 86400 * 7 : // 7 days for critical
                  error.severity === 'high' ? 86400 * 3 :     // 3 days for high
                  error.severity === 'medium' ? 86400 :       // 1 day for medium
                  3600 // 1 hour for low

      await kv.setex(`error:${error.id}`, ttl, error)

      // Increment error counters
      const counterKey = `errors:${error.type}:${error.severity}:${Math.floor(Date.now() / (60 * 60 * 1000))}`
      await kv.incr(counterKey)
      await kv.expire(counterKey, 86400)

      // Log security events for certain error types
      if (['authentication', 'authorization', 'rate_limit'].includes(error.type)) {
        await logSecurityEvent({
          type: error.type === 'rate_limit' ? 'rate_limit' : 'error',
          ip: error.context.ip || 'unknown',
          userAgent: error.context.userAgent,
          path: error.context.route || 'unknown',
          method: error.context.method || 'unknown',
          details: {
            errorId: error.id,
            severity: error.severity,
            message: error.message,
          },
        })
      }
    }

    // Always log with structured logger
    errorHandlerLogger.error('Structured error occurred', {
      id: error.id,
      type: error.type,
      severity: error.severity,
      route: error.context.route,
      method: error.context.method,
      timestamp: error.timestamp
    }, new Error(error.message))
  } catch (logError) {
    errorHandlerLogger.error('Failed to log structured error', {}, logError as Error)
  }
}

// Convert any error to structured error
export function createStructuredError(
  error: unknown,
  context: ErrorContext = {},
  type: StructuredError['type'] = 'internal'
): StructuredError {
  const errorId = generateErrorId()
  const timestamp = new Date().toISOString()

  if (error instanceof AppError) {
    return {
      id: errorId,
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: { ...context, ...error.context },
      stack: error.stack,
      metadata: error.metadata,
      timestamp,
    }
  }

  if (error instanceof Error) {
    // Determine severity based on error type
    let severity: StructuredError['severity'] = 'medium'
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      severity = 'low'
    } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      severity = 'high'
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      severity = 'high'
    }

    return {
      id: errorId,
      type,
      severity,
      message: error.message,
      context,
      stack: error.stack,
      timestamp,
    }
  }

  return {
    id: errorId,
    type,
    severity: 'medium',
    message: String(error),
    context,
    timestamp,
  }
}

// Create standardized error response
export function createErrorResponse(
  error: StructuredError,
  includeDetails: boolean = false
): NextResponse {
  const response: any = {
    error: {
      id: error.id,
      type: error.type,
      message: error.message,
      timestamp: error.timestamp,
    },
  }

  // Include additional details in development or for certain error types
  if (includeDetails || process.env.NODE_ENV === 'development') {
    response.error.details = {
      severity: error.severity,
      context: error.context,
      metadata: error.metadata,
    }
  }

  // Determine status code
  let statusCode = 500
  switch (error.type) {
    case 'validation':
      statusCode = 400
      break
    case 'authentication':
      statusCode = 401
      break
    case 'authorization':
      statusCode = 403
      break
    case 'rate_limit':
      statusCode = 429
      break
    case 'network':
    case 'external':
      statusCode = 502
      break
    case 'database':
      statusCode = 503
      break
    default:
      statusCode = 500
  }

  return NextResponse.json(response, { status: statusCode })
}

// Error handling wrapper for API routes
export function withErrorHandling<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const context = extractRequestContext(request)
    
    try {
      return await handler(request, ...args)
    } catch (error) {
      const structuredError = createStructuredError(error, context)
      await logStructuredError(structuredError)
      return createErrorResponse(structuredError)
    }
  }
}

// Validation error helpers
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context: ErrorContext = {}) {
    super(
      message,
      'validation',
      'low',
      400,
      context,
      field ? { field } : undefined
    )
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context: ErrorContext = {}) {
    super(message, 'authentication', 'high', 401, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context: ErrorContext = {}) {
    super(message, 'authorization', 'high', 403, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context: ErrorContext = {}) {
    super(message, 'rate_limit', 'medium', 429, context)
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error', context: ErrorContext = {}) {
    super(message, 'network', 'medium', 502, context)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', context: ErrorContext = {}) {
    super(message, 'database', 'high', 503, context)
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', context: ErrorContext = {}) {
    super(message, 'external', 'medium', 502, context)
  }
}

// Error recovery helpers
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const backoffDelay = delay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
    }
  }
  
  throw lastError!
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new AppError('Circuit breaker is open', 'external', 'high', 503)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }
}

// Global circuit breaker instances
export const circuitBreakers = {
  database: new CircuitBreaker(3, 30000),
  external: new CircuitBreaker(5, 60000),
  redis: new CircuitBreaker(3, 30000),
}
