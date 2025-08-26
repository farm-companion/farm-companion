// Utility for handling HTTP errors gracefully

interface ErrorLogData {
  statusCode: number
  url: string
  method: string
  timestamp: string
  error?: string
}

// Log HTTP errors to monitoring service
export async function logHttpError(data: ErrorLogData): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/log-http-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
  } catch (error) {
    // Silently fail if logging fails
    console.warn('Failed to log HTTP error:', error)
  }
}

// Enhanced fetch with error handling
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // const startTime = Date.now() // Unused for now
  
  try {
    const response = await fetch(url, options)
    
    // Log non-2xx responses
    if (!response.ok) {
      await logHttpError({
        statusCode: response.status,
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })
    }
    
    return response
  } catch (error) {
    // Log network errors
    await logHttpError({
      statusCode: 0, // Network error
      url,
      method: options.method || 'GET',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    
    throw error
  }
}

// Handle specific error types with user-friendly messages
export function getErrorMessage(error: unknown, context?: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'Network connection issue. Please check your internet connection and try again.'
    }
    
    // Geolocation errors
    if (message.includes('geolocation') || message.includes('location')) {
      return 'Location access is required. Please enable location services in your browser.'
    }
    
    // Map/tile errors
    if (message.includes('tile') || message.includes('map')) {
      return 'Map loading error. Please refresh the page and try again.'
    }
    
    // Data parsing errors
    if (message.includes('json') || message.includes('parse')) {
      return 'Data loading error. Please try again.'
    }
    
    // Rate limiting
    if (message.includes('rate') || message.includes('429')) {
      return 'Too many requests. Please wait a moment before trying again.'
    }
    
    // Generic error with context
    return context 
      ? `Failed to ${context}. Please try again.`
      : 'Something went wrong. Please try again.'
  }
  
  return 'An unexpected error occurred. Please try again.'
}

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
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
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Network errors are retryable
    if (message.includes('fetch') || message.includes('network')) {
      return true
    }
    
    // 5xx server errors are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return true
    }
    
    // Rate limiting (429) is retryable
    if (message.includes('429')) {
      return true
    }
  }
  
  return false
}

// Create a user-friendly error boundary fallback
export function createErrorFallback(
  error: Error,
  retryFn?: () => void,
  context?: string
) {
  const message = getErrorMessage(error, context)
  
  return {
    title: 'Something went wrong',
    message,
    isRetryable: isRetryableError(error),
    retryFn,
  }
}
