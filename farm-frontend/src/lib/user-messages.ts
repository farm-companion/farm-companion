/**
 * User-Facing Error Messages
 *
 * Friendly, helpful error messages with consistent voice and tone.
 * These messages are designed to be shown directly to users.
 *
 * Voice guidelines:
 * - Be helpful, not blaming
 * - Be specific about what went wrong
 * - Suggest what the user can do
 * - Keep it brief but complete
 * - Use plain English, avoid jargon
 */

// =============================================================================
// TYPES
// =============================================================================

export interface UserFacingError {
  /** Short title for the error */
  title: string
  /** Detailed message explaining what happened */
  message: string
  /** Suggested action the user can take */
  suggestion?: string
  /** Optional retry capability */
  canRetry?: boolean
  /** Link to help or support */
  helpLink?: string
}

export type ErrorCode =
  // Network errors
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'OFFLINE'
  // Form errors
  | 'VALIDATION_FAILED'
  | 'REQUIRED_FIELD'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_POSTCODE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  // Auth errors
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  // Data errors
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'DATA_CONFLICT'
  // Rate limiting
  | 'RATE_LIMITED'
  | 'TOO_MANY_REQUESTS'
  // Server errors
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'MAINTENANCE'
  // Farm-specific
  | 'FARM_NOT_FOUND'
  | 'COUNTY_NOT_FOUND'
  | 'PHOTO_UPLOAD_FAILED'
  | 'CLAIM_FAILED'
  | 'SUBMISSION_FAILED'
  // Location errors
  | 'LOCATION_DENIED'
  | 'LOCATION_UNAVAILABLE'
  | 'LOCATION_TIMEOUT'
  // Generic
  | 'UNKNOWN'

// =============================================================================
// ERROR MESSAGES
// =============================================================================

const errorMessages: Record<ErrorCode, UserFacingError> = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Connection problem',
    message: "We couldn't connect to our servers. Please check your internet connection.",
    suggestion: 'Try refreshing the page or check if you are connected to the internet.',
    canRetry: true,
  },
  TIMEOUT: {
    title: 'Request timed out',
    message: 'The request took too long to complete.',
    suggestion: 'Please try again. If the problem persists, the service may be busy.',
    canRetry: true,
  },
  OFFLINE: {
    title: 'You appear to be offline',
    message: "We can't reach our servers right now.",
    suggestion: 'Please check your internet connection and try again.',
    canRetry: true,
  },

  // Form errors
  VALIDATION_FAILED: {
    title: 'Please check your details',
    message: 'Some of the information provided needs to be corrected.',
    suggestion: 'Review the highlighted fields and try again.',
  },
  REQUIRED_FIELD: {
    title: 'Required field missing',
    message: 'Please fill in all required fields.',
    suggestion: 'Look for fields marked with an asterisk (*).',
  },
  INVALID_EMAIL: {
    title: 'Invalid email address',
    message: 'Please enter a valid email address.',
    suggestion: 'Check for typos, e.g. name@example.com',
  },
  INVALID_PHONE: {
    title: 'Invalid phone number',
    message: 'Please enter a valid UK phone number.',
    suggestion: 'Use format: 01onal or 07xxx xxxxxx',
  },
  INVALID_POSTCODE: {
    title: 'Invalid postcode',
    message: 'Please enter a valid UK postcode.',
    suggestion: 'Use format: AB1 2CD or AB12 3CD',
  },
  FILE_TOO_LARGE: {
    title: 'File too large',
    message: 'The file you selected is too large to upload.',
    suggestion: 'Please choose a file smaller than 5MB.',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid file type',
    message: 'This file type is not supported.',
    suggestion: 'Please upload a JPG, PNG, or WebP image.',
  },

  // Auth errors
  SESSION_EXPIRED: {
    title: 'Session expired',
    message: 'Your session has expired for security reasons.',
    suggestion: 'Please refresh the page and try again.',
    canRetry: true,
  },
  UNAUTHORIZED: {
    title: 'Sign in required',
    message: 'You need to be signed in to do this.',
    suggestion: 'Please sign in and try again.',
  },
  FORBIDDEN: {
    title: 'Access denied',
    message: "You don't have permission to access this.",
    suggestion: 'If you think this is a mistake, please contact us.',
    helpLink: '/contact',
  },

  // Data errors
  NOT_FOUND: {
    title: 'Not found',
    message: "We couldn't find what you were looking for.",
    suggestion: 'It may have been moved or removed.',
  },
  ALREADY_EXISTS: {
    title: 'Already exists',
    message: 'This item already exists in our system.',
    suggestion: 'Try searching for the existing entry instead.',
  },
  DATA_CONFLICT: {
    title: 'Update conflict',
    message: 'Someone else may have updated this at the same time.',
    suggestion: 'Refresh the page and try your changes again.',
    canRetry: true,
  },

  // Rate limiting
  RATE_LIMITED: {
    title: 'Slow down',
    message: "You're doing that too quickly.",
    suggestion: 'Please wait a moment before trying again.',
    canRetry: true,
  },
  TOO_MANY_REQUESTS: {
    title: 'Too many requests',
    message: "You've made too many requests recently.",
    suggestion: 'Please wait a few minutes before trying again.',
    canRetry: true,
  },

  // Server errors
  SERVER_ERROR: {
    title: 'Something went wrong',
    message: "We're having trouble on our end.",
    suggestion: "Please try again later. We're working to fix this.",
    canRetry: true,
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service temporarily unavailable',
    message: 'Our servers are currently overloaded or under maintenance.',
    suggestion: 'Please try again in a few minutes.',
    canRetry: true,
  },
  MAINTENANCE: {
    title: 'Scheduled maintenance',
    message: "We're currently performing maintenance.",
    suggestion: 'Please check back shortly. This usually takes less than an hour.',
  },

  // Farm-specific errors
  FARM_NOT_FOUND: {
    title: 'Farm shop not found',
    message: "We couldn't find this farm shop.",
    suggestion: 'It may have been removed or the link may be incorrect.',
    helpLink: '/shop',
  },
  COUNTY_NOT_FOUND: {
    title: 'County not found',
    message: "We couldn't find this county.",
    suggestion: 'Try browsing our full list of counties.',
    helpLink: '/counties',
  },
  PHOTO_UPLOAD_FAILED: {
    title: 'Photo upload failed',
    message: "We couldn't upload your photo.",
    suggestion: 'Please try again with a smaller image (max 5MB, JPG or PNG).',
    canRetry: true,
  },
  CLAIM_FAILED: {
    title: 'Claim submission failed',
    message: "We couldn't process your claim request.",
    suggestion: 'Please try again or contact us for help.',
    canRetry: true,
    helpLink: '/contact',
  },
  SUBMISSION_FAILED: {
    title: 'Submission failed',
    message: "We couldn't process your submission.",
    suggestion: 'Please check your details and try again.',
    canRetry: true,
  },

  // Location errors
  LOCATION_DENIED: {
    title: 'Location access denied',
    message: "We can't access your location because permission was denied.",
    suggestion: 'Enable location access in your browser settings to use this feature.',
  },
  LOCATION_UNAVAILABLE: {
    title: 'Location unavailable',
    message: "We couldn't determine your location.",
    suggestion: 'Try searching for a location or postcode instead.',
  },
  LOCATION_TIMEOUT: {
    title: 'Location request timed out',
    message: "Getting your location took too long.",
    suggestion: 'Try again or enter your location manually.',
    canRetry: true,
  },

  // Generic fallback
  UNKNOWN: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred.',
    suggestion: 'Please try again. If the problem persists, contact us.',
    canRetry: true,
    helpLink: '/contact',
  },
}

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Get a user-facing error message by code
 */
export function getErrorMessage(code: ErrorCode): UserFacingError {
  return errorMessages[code] || errorMessages.UNKNOWN
}

/**
 * Get error message from HTTP status code
 */
export function getErrorFromStatus(status: number): UserFacingError {
  const statusMap: Record<number, ErrorCode> = {
    400: 'VALIDATION_FAILED',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    408: 'TIMEOUT',
    409: 'DATA_CONFLICT',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    502: 'SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
    504: 'TIMEOUT',
  }

  const code = statusMap[status] || 'UNKNOWN'
  return getErrorMessage(code)
}

/**
 * Get error message from Error object
 *
 * Attempts to classify the error and return appropriate message
 */
export function getErrorFromException(error: unknown): UserFacingError {
  // Check for network errors
  if (error instanceof TypeError) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return getErrorMessage('NETWORK_ERROR')
    }
  }

  // Check for abort/timeout
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return getErrorMessage('TIMEOUT')
    }
  }

  // Check for Response errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status
    if (typeof status === 'number') {
      return getErrorFromStatus(status)
    }
  }

  // Fallback
  return getErrorMessage('UNKNOWN')
}

/**
 * Format validation errors from Zod or similar
 */
export function formatValidationErrors(
  errors: Array<{ path: string[]; message: string }>
): string {
  if (errors.length === 0) return 'Please check your input.'

  if (errors.length === 1) {
    const field = errors[0].path.join('.')
    return `${field}: ${errors[0].message}`
  }

  return `Please fix the following: ${errors.map((e) => e.path.join('.')).join(', ')}`
}

/**
 * Create a custom user-facing error
 */
export function createUserError(
  title: string,
  message: string,
  options: Partial<Omit<UserFacingError, 'title' | 'message'>> = {}
): UserFacingError {
  return {
    title,
    message,
    ...options,
  }
}

// =============================================================================
// FIELD-SPECIFIC MESSAGES
// =============================================================================

/**
 * Field validation messages
 */
export const fieldErrors = {
  required: (fieldName: string) => `${fieldName} is required`,
  minLength: (fieldName: string, min: number) =>
    `${fieldName} must be at least ${min} characters`,
  maxLength: (fieldName: string, max: number) =>
    `${fieldName} must be no more than ${max} characters`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid UK phone number',
  postcode: 'Please enter a valid UK postcode',
  url: 'Please enter a valid website URL (starting with http:// or https://)',
  number: (fieldName: string) => `${fieldName} must be a number`,
  min: (fieldName: string, min: number) => `${fieldName} must be at least ${min}`,
  max: (fieldName: string, max: number) => `${fieldName} must be no more than ${max}`,
  date: 'Please enter a valid date',
  futureDate: 'Please enter a date in the future',
  pastDate: 'Please enter a date in the past',
  pattern: (fieldName: string) => `${fieldName} is not in the correct format`,
}

/**
 * Form-level messages
 */
export const formMessages = {
  submitting: 'Submitting...',
  saving: 'Saving...',
  loading: 'Loading...',
  success: 'Successfully saved!',
  error: 'Something went wrong. Please try again.',
  unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
  confirmDelete: 'Are you sure you want to delete this? This cannot be undone.',
}
