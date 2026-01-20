/**
 * Standardized Error Handling for API Routes
 * Provides consistent error responses and classification
 */

import { NextResponse } from 'next/server'
import { createRouteLogger } from './logger'

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * Error types for classification
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Map error types to HTTP status codes
 */
function getStatusCodeForErrorType(type: ErrorType): number {
  const statusMap: Record<ErrorType, number> = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.EXTERNAL_API]: 502,
    [ErrorType.DATABASE]: 503,
    [ErrorType.INTERNAL]: 500,
  }

  return statusMap[type] || 500
}

/**
 * Format error response
 */
function formatErrorResponse(
  error: Error | AppError,
  statusCode: number,
  code?: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    error: error.name,
    message: error.message,
    code,
    details,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Handle errors in API routes with consistent format and logging
 */
export function handleApiError(error: unknown, route: string, context?: Record<string, any>): NextResponse {
  const logger = createRouteLogger(route)

  // Handle AppError instances
  if (error instanceof AppError) {
    logger.error(error.message, { ...context, type: error.type }, error)

    return NextResponse.json(
      formatErrorResponse(error, error.statusCode, error.type, error.details),
      { status: error.statusCode }
    )
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    logger.error('Unhandled error', { ...context, errorName: error.name }, error)

    return NextResponse.json(
      formatErrorResponse(error, 500, ErrorType.INTERNAL),
      { status: 500 }
    )
  }

  // Handle unknown error types
  const unknownError = new Error(String(error))
  logger.error('Unknown error type', { ...context, errorValue: error })

  return NextResponse.json(
    formatErrorResponse(unknownError, 500, ErrorType.INTERNAL),
    { status: 500 }
  )
}

/**
 * Pre-defined error factories for common scenarios
 */
export const errors = {
  validation: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorType.VALIDATION, 400, details),

  authentication: (message: string = 'Authentication required') =>
    new AppError(message, ErrorType.AUTHENTICATION, 401),

  authorization: (message: string = 'Access denied') =>
    new AppError(message, ErrorType.AUTHORIZATION, 403),

  notFound: (resource: string) => new AppError(`${resource} not found`, ErrorType.NOT_FOUND, 404),

  rateLimit: (message: string = 'Too many requests. Please try again later.') =>
    new AppError(message, ErrorType.RATE_LIMIT, 429),

  externalApi: (service: string, details?: Record<string, any>) =>
    new AppError(`External service error: ${service}`, ErrorType.EXTERNAL_API, 502, details),

  database: (message: string, details?: Record<string, any>) =>
    new AppError(message, ErrorType.DATABASE, 503, details),

  internal: (message: string = 'Internal server error', details?: Record<string, any>) =>
    new AppError(message, ErrorType.INTERNAL, 500, details),
}

/**
 * Wrap async route handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  route: string,
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error, route)
    }
  }
}

/**
 * Validate required environment variables at startup
 */
export function validateEnv(vars: string[]): void {
  const missing = vars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
