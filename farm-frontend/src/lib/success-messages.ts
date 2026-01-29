/**
 * Success State Messages
 *
 * Uses the "Knowledgeable Neighbor" voice: warm, specific to farming and
 * local food, avoiding generic success-speak.
 *
 * Voice guidelines:
 * - Use harvest and growth metaphors naturally
 * - Be warm but not saccharine
 * - "Your story has been received" not "Submission successful"
 * - Suggest next steps in a neighborly way
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SuccessMessage {
  /** Main success title */
  title: string
  /** Detailed message */
  message: string
  /** Optional next step suggestion */
  nextStep?: {
    text: string
    href?: string
    action?: string
  }
}

export type SuccessContext =
  // Form submissions
  | 'farm-submitted'
  | 'claim-submitted'
  | 'contact-sent'
  | 'newsletter-subscribed'
  | 'feedback-sent'
  // Photos
  | 'photo-uploaded'
  | 'photos-uploaded'
  | 'photo-deleted'
  // User actions
  | 'favorite-added'
  | 'favorite-removed'
  | 'settings-saved'
  | 'profile-updated'
  // Admin actions
  | 'farm-approved'
  | 'farm-rejected'
  | 'photo-approved'
  | 'photo-rejected'
  | 'claim-approved'
  | 'claim-rejected'
  // Data operations
  | 'data-exported'
  | 'data-imported'
  | 'changes-saved'
  | 'deleted'
  // Auth
  | 'signed-in'
  | 'signed-out'
  | 'password-changed'
  // Sharing
  | 'link-copied'
  | 'shared'
  // Generic
  | 'default'

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

const successMessages: Record<SuccessContext, SuccessMessage> = {
  // ---------------------------------------------------------------------------
  // Form submissions
  // ---------------------------------------------------------------------------
  'farm-submitted': {
    title: 'Your farm story is planted',
    message:
      "Thanks for sharing. We'll tend to your submission and it should sprout in the directory within a few days.",
    nextStep: {
      text: 'Plant another',
      href: '/add',
    },
  },
  'claim-submitted': {
    title: 'Claim received',
    message:
      "We've got your ownership claim. We'll check the deeds and get back to you within 48 hours.",
    nextStep: {
      text: 'Back to the farm',
      action: 'goBack',
    },
  },
  'contact-sent': {
    title: 'Message on its way',
    message:
      "Thanks for reaching out. We'll get back to you as soon as we can, usually within a day.",
  },
  'newsletter-subscribed': {
    title: 'Welcome to the harvest',
    message:
      "You're in. Expect seasonal highlights, new farm discoveries, and local food news.",
    nextStep: {
      text: 'Explore farms',
      href: '/shop',
    },
  },
  'feedback-sent': {
    title: 'Heard and noted',
    message:
      'Thanks for your thoughts. Every bit helps us make Farm Companion better for everyone.',
  },

  // ---------------------------------------------------------------------------
  // Photos
  // ---------------------------------------------------------------------------
  'photo-uploaded': {
    title: 'Picture captured',
    message:
      "Your photo is in for review. Once approved, it'll hang in the farm's gallery.",
    nextStep: {
      text: 'Add another',
      action: 'addPhoto',
    },
  },
  'photos-uploaded': {
    title: 'Pictures captured',
    message:
      "Your photos are in for review. Once approved, they'll appear in the gallery.",
  },
  'photo-deleted': {
    title: 'Photo taken down',
    message: 'The photo has been removed.',
  },

  // ---------------------------------------------------------------------------
  // User actions
  // ---------------------------------------------------------------------------
  'favorite-added': {
    title: 'Farm saved',
    message: "It's in your basket now. Find it anytime in your favourites.",
    nextStep: {
      text: 'View basket',
      href: '/favourites',
    },
  },
  'favorite-removed': {
    title: 'Farm removed',
    message: "Taken out of your basket.",
  },
  'settings-saved': {
    title: 'Preferences stored',
    message: 'Your settings are saved.',
  },
  'profile-updated': {
    title: 'Profile updated',
    message: 'Your details are safely stored.',
  },

  // ---------------------------------------------------------------------------
  // Admin actions
  // ---------------------------------------------------------------------------
  'farm-approved': {
    title: 'Farm is live',
    message: "It's on the map now, ready for visitors.",
    nextStep: {
      text: 'Visit the farm',
      action: 'viewFarm',
    },
  },
  'farm-rejected': {
    title: 'Farm not approved',
    message: "The submission didn't make the cut. The submitter will be told.",
  },
  'photo-approved': {
    title: 'Photo on display',
    message: "It's now hanging in the farm's gallery.",
  },
  'photo-rejected': {
    title: 'Photo not approved',
    message: "This one won't be shown.",
  },
  'claim-approved': {
    title: 'Ownership transferred',
    message: 'The deeds are signed. The owner can now manage their listing.',
  },
  'claim-rejected': {
    title: 'Claim not approved',
    message: "The ownership claim didn't go through. The claimant will be told.",
  },

  // ---------------------------------------------------------------------------
  // Data operations
  // ---------------------------------------------------------------------------
  'data-exported': {
    title: 'Harvest packed',
    message: 'Your data is bundled and downloaded.',
  },
  'data-imported': {
    title: 'Seeds planted',
    message: 'Data has been imported successfully.',
  },
  'changes-saved': {
    title: 'Safely stored',
    message: 'Your changes are preserved.',
  },
  deleted: {
    title: 'Cleared away',
    message: "It's gone for good.",
  },

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  'signed-in': {
    title: 'Welcome back',
    message: "The gate's open. You're in.",
  },
  'signed-out': {
    title: 'Gate closed',
    message: "You've signed out. See you next time.",
  },
  'password-changed': {
    title: 'New key cut',
    message: 'Your password has been changed.',
  },

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------
  'link-copied': {
    title: 'Link snagged',
    message: 'Copied to your clipboard, ready to share.',
  },
  shared: {
    title: 'Word spread',
    message: 'Thanks for telling others about Farm Companion.',
  },

  // ---------------------------------------------------------------------------
  // Generic
  // ---------------------------------------------------------------------------
  default: {
    title: 'Done',
    message: 'All sorted.',
  },
}

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Get success message by context
 */
export function getSuccessMessage(context: SuccessContext): SuccessMessage {
  return successMessages[context] || successMessages.default
}

/**
 * Get success message with custom details
 */
export function getCustomSuccessMessage(
  context: SuccessContext,
  overrides: Partial<SuccessMessage>
): SuccessMessage {
  const base = successMessages[context] || successMessages.default
  return { ...base, ...overrides }
}

/**
 * Get farm submission success with farm name
 */
export function getFarmSubmittedMessage(farmName: string): SuccessMessage {
  return {
    ...successMessages['farm-submitted'],
    title: `${farmName} is planted`,
    message: `Thanks for sharing ${farmName}. We'll tend to it and it should appear in the directory soon.`,
  }
}

/**
 * Get photo upload success with count
 */
export function getPhotoUploadedMessage(count: number): SuccessMessage {
  if (count === 1) {
    return successMessages['photo-uploaded']
  }
  return {
    ...successMessages['photos-uploaded'],
    title: `${count} pictures captured`,
    message: `Your ${count} photos are in for review. Once approved, they'll hang in the gallery.`,
  }
}

/**
 * Get favorite added message with farm name
 */
export function getFavoriteAddedMessage(farmName: string): SuccessMessage {
  return {
    ...successMessages['favorite-added'],
    title: `${farmName} saved`,
    message: `${farmName} is in your basket for easy finding.`,
  }
}

// =============================================================================
// TOAST MESSAGES
// =============================================================================

/**
 * Short toast messages for quick confirmations
 */
export const toastMessages = {
  // Actions
  saved: 'Stored',
  deleted: 'Cleared',
  copied: 'Snagged',
  shared: 'Spread',
  updated: 'Freshened',
  added: 'Added',
  removed: 'Taken out',
  sent: 'On its way',
  submitted: 'Planted',
  uploaded: 'Stowed',

  // Favorites
  favoriteAdded: 'In your basket',
  favoriteRemoved: 'Out of basket',

  // Settings
  settingsSaved: 'Preferences stored',
  preferencesUpdated: 'Settings freshened',

  // Errors recovered
  reconnected: 'Back online',
  syncComplete: 'All caught up',
}

/**
 * Get short toast message
 */
export function getToastMessage(key: keyof typeof toastMessages): string {
  return toastMessages[key]
}

// =============================================================================
// CONFIRMATION PROMPTS
// =============================================================================

/**
 * Confirmation dialog messages
 */
export const confirmations = {
  delete: {
    title: 'Clear this away?',
    message: "Once gone, it can't be brought back.",
    confirmText: 'Clear it',
    cancelText: 'Keep it',
  },
  unsavedChanges: {
    title: 'Unsaved work',
    message: "You've got changes that aren't stored. Leave anyway?",
    confirmText: 'Leave',
    cancelText: 'Stay',
  },
  removePhoto: {
    title: 'Take down this photo?',
    message: "It'll be removed from the farm's gallery for good.",
    confirmText: 'Take it down',
    cancelText: 'Keep it up',
  },
  cancelSubmission: {
    title: 'Abandon this?',
    message: "Your work so far will be lost.",
    confirmText: 'Yes, leave',
    cancelText: 'Keep going',
  },
  signOut: {
    title: 'Close the gate?',
    message: "You'll need to sign in again next time.",
    confirmText: 'Sign out',
    cancelText: 'Stay in',
  },
}

/**
 * Get confirmation dialog content
 */
export function getConfirmation(key: keyof typeof confirmations) {
  return confirmations[key]
}
