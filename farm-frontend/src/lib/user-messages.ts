/**
 * User-Facing Error Messages
 *
 * Uses the "Knowledgeable Neighbor" voice: warm, specific to farming and
 * local food, avoiding generic error-speak.
 *
 * Voice guidelines:
 * - Use farming and weather metaphors naturally
 * - Be warm and helpful, like a neighbor who knows the land
 * - "Lost in the fields" not "404 Not Found"
 * - Always suggest a path forward
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
    title: 'The line went down',
    message: "We've lost connection to the farm. Could be the weather.",
    suggestion: 'Check your signal and try again.',
    canRetry: true,
  },
  TIMEOUT: {
    title: 'That took too long',
    message: 'The request wandered off. Sometimes the countryside is slow.',
    suggestion: 'Give it another go. If it keeps happening, we may be busy.',
    canRetry: true,
  },
  OFFLINE: {
    title: "You're off the grid",
    message: "Can't reach the farm right now.",
    suggestion: 'Check your connection and try again.',
    canRetry: true,
  },

  // Form errors
  VALIDATION_FAILED: {
    title: 'Something needs adjusting',
    message: 'A few details need another look.',
    suggestion: 'Check the highlighted fields and try again.',
  },
  REQUIRED_FIELD: {
    title: 'Missing a piece',
    message: 'This field needs filling in.',
    suggestion: 'Look for fields marked with an asterisk (*).',
  },
  INVALID_EMAIL: {
    title: "That email doesn't look right",
    message: 'We need a valid email to stay in touch.',
    suggestion: 'Check for typos, e.g. name@example.com',
  },
  INVALID_PHONE: {
    title: "That number won't ring",
    message: 'Please enter a valid UK phone number.',
    suggestion: 'Try 01onal or 07xxx xxxxxx format.',
  },
  INVALID_POSTCODE: {
    title: "Can't find that postcode",
    message: 'Please enter a valid UK postcode.',
    suggestion: 'Use format like AB1 2CD or AB12 3CD.',
  },
  FILE_TOO_LARGE: {
    title: "That's a heavy load",
    message: 'The file is too large to carry.',
    suggestion: 'Please choose something under 5MB.',
  },
  INVALID_FILE_TYPE: {
    title: "Can't open that one",
    message: 'We only accept certain file types.',
    suggestion: 'Try a JPG, PNG, or WebP image.',
  },

  // Auth errors
  SESSION_EXPIRED: {
    title: 'The gate closed',
    message: 'Your session timed out for safety.',
    suggestion: 'Refresh the page and sign in again.',
    canRetry: true,
  },
  UNAUTHORIZED: {
    title: 'Members only',
    message: 'You need to sign in first.',
    suggestion: 'Sign in and try again.',
  },
  FORBIDDEN: {
    title: 'Private land',
    message: "You don't have access to this area.",
    suggestion: 'If you think this is wrong, get in touch.',
    helpLink: '/contact',
  },

  // Data errors
  NOT_FOUND: {
    title: 'Lost in the fields',
    message: "We can't find that page. It may have wandered off.",
    suggestion: 'Try searching or head back to the main path.',
  },
  ALREADY_EXISTS: {
    title: 'Already planted',
    message: 'This one is already in our records.',
    suggestion: 'Search for the existing entry instead.',
  },
  DATA_CONFLICT: {
    title: 'Two hands on the same tool',
    message: 'Someone else was editing at the same time.',
    suggestion: 'Refresh the page and try your changes again.',
    canRetry: true,
  },

  // Rate limiting
  RATE_LIMITED: {
    title: 'Easy there',
    message: "You're moving faster than the tractor can keep up.",
    suggestion: 'Take a breath and try again shortly.',
    canRetry: true,
  },
  TOO_MANY_REQUESTS: {
    title: 'Wearing out the welcome',
    message: "That's a lot of knocks on the door.",
    suggestion: 'Give us a few minutes and try again.',
    canRetry: true,
  },

  // Server errors
  SERVER_ERROR: {
    title: 'Something broke',
    message: "There's trouble in the barn. We're on it.",
    suggestion: 'Try again in a bit.',
    canRetry: true,
  },
  SERVICE_UNAVAILABLE: {
    title: 'Farm is busy',
    message: 'The servers are overworked or resting.',
    suggestion: 'Give it a few minutes and try again.',
    canRetry: true,
  },
  MAINTENANCE: {
    title: 'Fixing the fences',
    message: "We're doing some planned maintenance.",
    suggestion: "Check back shortly. This won't take long.",
  },

  // Farm-specific errors
  FARM_NOT_FOUND: {
    title: 'Farm not on the map',
    message: "We can't find this farm. It may have closed or the link may be off.",
    suggestion: 'Try searching or browse all farms.',
    helpLink: '/shop',
  },
  COUNTY_NOT_FOUND: {
    title: 'County not charted',
    message: "We can't find this county.",
    suggestion: 'Browse our full list of counties.',
    helpLink: '/counties',
  },
  PHOTO_UPLOAD_FAILED: {
    title: 'Photo dropped',
    message: "The upload didn't make it.",
    suggestion: 'Try a smaller image (under 5MB, JPG or PNG).',
    canRetry: true,
  },
  CLAIM_FAILED: {
    title: 'Claim hit a snag',
    message: "We couldn't process your ownership claim.",
    suggestion: 'Try again or get in touch for help.',
    canRetry: true,
    helpLink: '/contact',
  },
  SUBMISSION_FAILED: {
    title: "Didn't go through",
    message: "Your submission got stuck in the mud.",
    suggestion: 'Check your details and try again.',
    canRetry: true,
  },

  // Location errors
  LOCATION_DENIED: {
    title: "Can't see where you are",
    message: 'Location access was denied.',
    suggestion: 'Enable location in your browser settings, or search by postcode.',
  },
  LOCATION_UNAVAILABLE: {
    title: 'Lost your bearings',
    message: "We couldn't work out where you are.",
    suggestion: 'Try searching by place name or postcode instead.',
  },
  LOCATION_TIMEOUT: {
    title: 'Location took too long',
    message: 'Finding you is taking a while.',
    suggestion: 'Try again or enter your location manually.',
    canRetry: true,
  },

  // Generic fallback
  UNKNOWN: {
    title: 'Something went sideways',
    message: 'An unexpected hiccup. These things happen.',
    suggestion: 'Try again. If it keeps happening, let us know.',
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
  submitting: 'Planting your submission...',
  saving: 'Preserving your changes...',
  loading: 'Harvesting latest updates...',
  success: 'Safely stored!',
  error: 'Something went sideways. Try again.',
  unsavedChanges: 'You have unsaved changes. Sure you want to leave?',
  confirmDelete: 'Once gone, it cannot be brought back. Are you sure?',
}
