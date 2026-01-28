/**
 * Loading State Messages
 *
 * Context-specific loading messages that are more engaging than "Loading...".
 * Provides variety and personality while keeping users informed.
 *
 * Voice guidelines:
 * - Be specific about what's loading
 * - Add personality without being annoying
 * - Keep it brief
 * - Vary messages for repeated loads
 */

// =============================================================================
// TYPES
// =============================================================================

export interface LoadingMessage {
  /** Primary loading text */
  text: string
  /** Optional subtext for longer loads */
  subtext?: string
}

export type LoadingContext =
  // Page loads
  | 'page'
  | 'farms'
  | 'farm-detail'
  | 'counties'
  | 'county-detail'
  | 'seasonal'
  | 'map'
  // Actions
  | 'search'
  | 'filter'
  | 'location'
  | 'directions'
  // Forms
  | 'submitting'
  | 'uploading'
  | 'saving'
  | 'sending'
  // Data
  | 'photos'
  | 'reviews'
  | 'suggestions'
  // Auth
  | 'signing-in'
  | 'signing-out'
  // Generic
  | 'default'

// =============================================================================
// LOADING MESSAGES
// =============================================================================

const loadingMessages: Record<LoadingContext, LoadingMessage[]> = {
  // ---------------------------------------------------------------------------
  // Page loads
  // ---------------------------------------------------------------------------
  page: [
    { text: 'Loading...' },
    { text: 'Just a moment...' },
    { text: 'Getting things ready...' },
  ],
  farms: [
    { text: 'Finding farm shops...', subtext: 'Searching our directory' },
    { text: 'Loading farm shops...' },
    { text: 'Gathering local farms...' },
  ],
  'farm-detail': [
    { text: 'Loading farm details...' },
    { text: 'Getting farm information...' },
    { text: 'Fetching the latest details...' },
  ],
  counties: [
    { text: 'Loading counties...' },
    { text: 'Mapping the UK...' },
  ],
  'county-detail': [
    { text: 'Exploring this county...', subtext: 'Finding local farms' },
    { text: 'Loading county farms...' },
  ],
  seasonal: [
    { text: "Finding what's in season...", subtext: 'Checking the calendar' },
    { text: 'Loading seasonal produce...' },
  ],
  map: [
    { text: 'Loading the map...', subtext: 'Plotting farm locations' },
    { text: 'Mapping farm shops...' },
    { text: 'Preparing the map...' },
  ],

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  search: [
    { text: 'Searching...', subtext: 'Looking through our directory' },
    { text: 'Finding matches...' },
    { text: 'Searching farm shops...' },
  ],
  filter: [
    { text: 'Applying filters...' },
    { text: 'Filtering results...' },
    { text: 'Narrowing down...' },
  ],
  location: [
    { text: 'Finding your location...', subtext: 'This may take a moment' },
    { text: 'Getting your position...' },
    { text: 'Locating you...' },
  ],
  directions: [
    { text: 'Calculating route...' },
    { text: 'Finding the best way...' },
    { text: 'Getting directions...' },
  ],

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------
  submitting: [
    { text: 'Submitting...', subtext: 'Sending your information' },
    { text: 'Processing submission...' },
    { text: 'Sending your details...' },
  ],
  uploading: [
    { text: 'Uploading...', subtext: 'This may take a moment' },
    { text: 'Uploading your file...' },
    { text: 'Processing upload...' },
  ],
  saving: [
    { text: 'Saving...', subtext: 'Storing your changes' },
    { text: 'Saving changes...' },
    { text: 'Updating...' },
  ],
  sending: [
    { text: 'Sending...', subtext: 'Delivering your message' },
    { text: 'Sending message...' },
    { text: 'On its way...' },
  ],

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  photos: [
    { text: 'Loading photos...' },
    { text: 'Fetching images...' },
    { text: 'Getting photos...' },
  ],
  reviews: [
    { text: 'Loading reviews...' },
    { text: 'Fetching feedback...' },
  ],
  suggestions: [
    { text: 'Getting suggestions...' },
    { text: 'Finding recommendations...' },
  ],

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  'signing-in': [
    { text: 'Signing in...', subtext: 'Verifying your credentials' },
    { text: 'Logging you in...' },
  ],
  'signing-out': [
    { text: 'Signing out...' },
    { text: 'Logging out...' },
  ],

  // ---------------------------------------------------------------------------
  // Generic
  // ---------------------------------------------------------------------------
  default: [
    { text: 'Loading...' },
    { text: 'Just a moment...' },
    { text: 'Please wait...' },
  ],
}

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Get a loading message for a context
 *
 * Returns a random message from the pool for variety
 */
export function getLoadingMessage(context: LoadingContext = 'default'): LoadingMessage {
  const messages = loadingMessages[context] || loadingMessages.default
  const index = Math.floor(Math.random() * messages.length)
  return messages[index]
}

/**
 * Get the primary loading message for a context (first in list)
 *
 * Use when consistency is more important than variety
 */
export function getPrimaryLoadingMessage(context: LoadingContext = 'default'): LoadingMessage {
  const messages = loadingMessages[context] || loadingMessages.default
  return messages[0]
}

/**
 * Get all loading messages for a context
 *
 * Useful for cycling through messages during long loads
 */
export function getAllLoadingMessages(context: LoadingContext = 'default'): LoadingMessage[] {
  return loadingMessages[context] || loadingMessages.default
}

// =============================================================================
// PROGRESS MESSAGES
// =============================================================================

/**
 * Messages for multi-step processes
 */
export const progressMessages = {
  upload: {
    preparing: 'Preparing upload...',
    uploading: 'Uploading...',
    processing: 'Processing...',
    complete: 'Upload complete!',
  },
  submission: {
    validating: 'Validating your details...',
    submitting: 'Submitting...',
    processing: 'Processing your submission...',
    complete: 'Submission received!',
  },
  photo: {
    reading: 'Reading file...',
    resizing: 'Optimizing image...',
    uploading: 'Uploading photo...',
    complete: 'Photo uploaded!',
  },
}

/**
 * Get progress message for a step
 */
export function getProgressMessage(
  process: keyof typeof progressMessages,
  step: string
): string {
  const messages = progressMessages[process]
  return (messages as Record<string, string>)[step] || 'Processing...'
}

// =============================================================================
// SKELETON LABELS
// =============================================================================

/**
 * Accessible labels for skeleton loaders
 *
 * Screen readers will announce these while content loads
 */
export const skeletonLabels = {
  farmCard: 'Loading farm shop information',
  farmList: 'Loading list of farm shops',
  farmDetail: 'Loading farm shop details',
  photo: 'Loading photo',
  photoGallery: 'Loading photo gallery',
  map: 'Loading map',
  countyList: 'Loading counties',
  searchResults: 'Loading search results',
  reviews: 'Loading reviews',
  openingHours: 'Loading opening hours',
  contact: 'Loading contact information',
}

/**
 * Get skeleton label
 */
export function getSkeletonLabel(type: keyof typeof skeletonLabels): string {
  return skeletonLabels[type]
}

// =============================================================================
// LONG LOAD MESSAGES
// =============================================================================

/**
 * Messages for when loading takes longer than expected
 */
export const longLoadMessages = {
  stillWorking: "Still working on it...",
  takingLonger: "This is taking longer than usual...",
  almostThere: "Almost there...",
  hangTight: "Hang tight, nearly done...",
  thanks: "Thanks for your patience...",
}

/**
 * Get a message for long loads based on elapsed time
 *
 * @param elapsedMs - Time elapsed since loading started (in milliseconds)
 */
export function getLongLoadMessage(elapsedMs: number): string | null {
  if (elapsedMs < 3000) return null // No message for first 3 seconds
  if (elapsedMs < 5000) return longLoadMessages.stillWorking
  if (elapsedMs < 8000) return longLoadMessages.takingLonger
  if (elapsedMs < 12000) return longLoadMessages.almostThere
  if (elapsedMs < 15000) return longLoadMessages.hangTight
  return longLoadMessages.thanks
}

// =============================================================================
// BUTTON LOADING STATES
// =============================================================================

/**
 * Loading text for common button actions
 */
export const buttonLoadingText = {
  submit: 'Submitting...',
  save: 'Saving...',
  send: 'Sending...',
  upload: 'Uploading...',
  delete: 'Deleting...',
  update: 'Updating...',
  create: 'Creating...',
  add: 'Adding...',
  remove: 'Removing...',
  confirm: 'Confirming...',
  cancel: 'Cancelling...',
  search: 'Searching...',
  filter: 'Filtering...',
  load: 'Loading...',
  refresh: 'Refreshing...',
  sync: 'Syncing...',
  connect: 'Connecting...',
  signIn: 'Signing in...',
  signOut: 'Signing out...',
  subscribe: 'Subscribing...',
  unsubscribe: 'Unsubscribing...',
}

/**
 * Get loading text for a button action
 */
export function getButtonLoadingText(action: keyof typeof buttonLoadingText): string {
  return buttonLoadingText[action]
}
