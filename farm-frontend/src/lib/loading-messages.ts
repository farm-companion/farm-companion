/**
 * Loading State Messages
 *
 * Context-specific loading messages that are more engaging than "Loading...".
 * Uses the "Knowledgeable Neighbor" voice: warm, specific to farming and
 * local food, avoiding generic directory-speak.
 *
 * Voice guidelines:
 * - Use farming and seasonal metaphors naturally
 * - Be warm and helpful, like a neighbor who knows the land
 * - Keep it brief but evocative
 * - "Harvesting" not "Loading", "fields" not "database"
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
    { text: 'Harvesting latest updates...' },
    { text: 'Just a moment...' },
    { text: 'Preparing the harvest...' },
  ],
  farms: [
    { text: 'Finding real food near you...', subtext: 'Checking the fields' },
    { text: 'Gathering local farms...' },
    { text: 'Rounding up the farms...' },
  ],
  'farm-detail': [
    { text: 'Gathering farm details...' },
    { text: 'Picking the freshest info...' },
    { text: 'Opening the farm gate...' },
  ],
  counties: [
    { text: 'Mapping the countryside...' },
    { text: 'Surveying the land...' },
  ],
  'county-detail': [
    { text: 'Exploring the local fields...', subtext: 'Finding nearby farms' },
    { text: 'Scouting the county...' },
  ],
  seasonal: [
    { text: "Checking what's ripe...", subtext: 'Reading the seasons' },
    { text: 'Following the harvest calendar...' },
  ],
  map: [
    { text: 'Charting the farmland...', subtext: 'Plotting the fields' },
    { text: 'Mapping the countryside...' },
    { text: 'Preparing your field guide...' },
  ],

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  search: [
    { text: 'Searching the fields...', subtext: 'Checking every corner' },
    { text: 'Finding your match...' },
    { text: 'Scouring the countryside...' },
  ],
  filter: [
    { text: 'Sifting through the harvest...' },
    { text: 'Sorting the bounty...' },
    { text: 'Narrowing down...' },
  ],
  location: [
    { text: 'Finding you on the map...', subtext: 'This may take a moment' },
    { text: 'Pinpointing your spot...' },
    { text: 'Working out where you are...' },
  ],
  directions: [
    { text: 'Plotting your route...' },
    { text: 'Finding the country lanes...' },
    { text: 'Mapping the way...' },
  ],

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------
  submitting: [
    { text: 'Planting your submission...', subtext: 'Sending to the farm' },
    { text: 'Sending your story...' },
    { text: 'Putting down roots...' },
  ],
  uploading: [
    { text: 'Uploading...', subtext: 'This may take a moment' },
    { text: 'Carrying to the barn...' },
    { text: 'Storing away...' },
  ],
  saving: [
    { text: 'Preserving your changes...', subtext: 'Storing safely' },
    { text: 'Saving changes...' },
    { text: 'Putting it in the cellar...' },
  ],
  sending: [
    { text: 'Sending your message...', subtext: 'On its way' },
    { text: 'Dispatching...' },
    { text: 'Flying over the fields...' },
  ],

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  photos: [
    { text: 'Developing the snapshots...' },
    { text: 'Gathering the views...' },
    { text: 'Framing the farm...' },
  ],
  reviews: [
    { text: 'Gathering voices from the field...' },
    { text: 'Collecting the harvest of reviews...' },
  ],
  suggestions: [
    { text: 'Picking recommendations...' },
    { text: 'Handpicking suggestions...' },
  ],

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  'signing-in': [
    { text: 'Opening the gate...', subtext: 'Checking your credentials' },
    { text: 'Welcoming you in...' },
  ],
  'signing-out': [
    { text: 'Closing the gate...' },
    { text: 'See you next harvest...' },
  ],

  // ---------------------------------------------------------------------------
  // Generic
  // ---------------------------------------------------------------------------
  default: [
    { text: 'Harvesting latest updates...' },
    { text: 'Just a moment...' },
    { text: 'Tending to your request...' },
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
    preparing: 'Preparing the load...',
    uploading: 'Carrying to the barn...',
    processing: 'Sorting the delivery...',
    complete: 'Safely stored!',
  },
  submission: {
    validating: 'Checking your details...',
    submitting: 'Planting your submission...',
    processing: 'Tending to your request...',
    complete: 'Your story has been received!',
  },
  photo: {
    reading: 'Opening the frame...',
    resizing: 'Cropping for the gallery...',
    uploading: 'Hanging on the wall...',
    complete: 'Picture perfect!',
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
  farmCard: 'Gathering farm details',
  farmList: 'Rounding up the farms',
  farmDetail: 'Opening the farm gate',
  photo: 'Developing photo',
  photoGallery: 'Preparing the gallery',
  map: 'Charting the farmland',
  countyList: 'Mapping the counties',
  searchResults: 'Harvesting search results',
  reviews: 'Collecting voices from the field',
  openingHours: 'Checking the schedule',
  contact: 'Finding contact details',
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
  stillWorking: "Still tending to it...",
  takingLonger: "The harvest is taking a bit longer...",
  almostThere: "Nearly ready to pick...",
  hangTight: "Just a few more rows to go...",
  thanks: "Thanks for waiting through the weather...",
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
