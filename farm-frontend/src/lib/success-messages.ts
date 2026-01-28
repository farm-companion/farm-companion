/**
 * Success State Messages
 *
 * Confirmation and success messages for completed actions.
 * Provides positive feedback that confirms the user's action.
 *
 * Voice guidelines:
 * - Confirm what was done
 * - Be celebratory but not over the top
 * - Suggest next steps when appropriate
 * - Keep it brief
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
    title: 'Farm shop submitted',
    message:
      "Thanks for adding to our directory. We'll review your submission and it should appear within a few days.",
    nextStep: {
      text: 'Add another farm',
      href: '/add',
    },
  },
  'claim-submitted': {
    title: 'Claim request received',
    message:
      "We've received your ownership claim. We'll verify the details and get back to you within 48 hours.",
    nextStep: {
      text: 'Return to farm page',
      action: 'goBack',
    },
  },
  'contact-sent': {
    title: 'Message sent',
    message:
      "Thanks for getting in touch. We'll respond to your message as soon as possible, usually within 24 hours.",
  },
  'newsletter-subscribed': {
    title: "You're subscribed",
    message:
      "Welcome to the Farm Companion newsletter. You'll receive updates about new farms, seasonal highlights, and local food news.",
    nextStep: {
      text: 'Explore farm shops',
      href: '/shop',
    },
  },
  'feedback-sent': {
    title: 'Feedback received',
    message:
      'Thanks for sharing your thoughts. Your feedback helps us improve Farm Companion for everyone.',
  },

  // ---------------------------------------------------------------------------
  // Photos
  // ---------------------------------------------------------------------------
  'photo-uploaded': {
    title: 'Photo uploaded',
    message:
      "Your photo has been submitted for review. Once approved, it'll appear on the farm's page.",
    nextStep: {
      text: 'Add another photo',
      action: 'addPhoto',
    },
  },
  'photos-uploaded': {
    title: 'Photos uploaded',
    message:
      "Your photos have been submitted for review. Once approved, they'll appear on the farm's page.",
  },
  'photo-deleted': {
    title: 'Photo removed',
    message: 'The photo has been removed successfully.',
  },

  // ---------------------------------------------------------------------------
  // User actions
  // ---------------------------------------------------------------------------
  'favorite-added': {
    title: 'Added to favourites',
    message: "You can find this farm in your favourites list for easy access.",
    nextStep: {
      text: 'View favourites',
      href: '/favourites',
    },
  },
  'favorite-removed': {
    title: 'Removed from favourites',
    message: 'This farm has been removed from your favourites.',
  },
  'settings-saved': {
    title: 'Settings saved',
    message: 'Your preferences have been updated.',
  },
  'profile-updated': {
    title: 'Profile updated',
    message: 'Your profile information has been saved.',
  },

  // ---------------------------------------------------------------------------
  // Admin actions
  // ---------------------------------------------------------------------------
  'farm-approved': {
    title: 'Farm approved',
    message: 'The farm is now live and visible in the directory.',
    nextStep: {
      text: 'View farm page',
      action: 'viewFarm',
    },
  },
  'farm-rejected': {
    title: 'Farm rejected',
    message: 'The submission has been rejected. The submitter will be notified.',
  },
  'photo-approved': {
    title: 'Photo approved',
    message: "The photo is now visible on the farm's page.",
  },
  'photo-rejected': {
    title: 'Photo rejected',
    message: 'The photo has been rejected and will not be displayed.',
  },
  'claim-approved': {
    title: 'Claim approved',
    message: 'Ownership has been transferred. The owner can now manage their listing.',
  },
  'claim-rejected': {
    title: 'Claim rejected',
    message: 'The ownership claim has been rejected. The claimant will be notified.',
  },

  // ---------------------------------------------------------------------------
  // Data operations
  // ---------------------------------------------------------------------------
  'data-exported': {
    title: 'Export complete',
    message: 'Your data has been exported and downloaded.',
  },
  'data-imported': {
    title: 'Import complete',
    message: 'Data has been successfully imported.',
  },
  'changes-saved': {
    title: 'Changes saved',
    message: 'Your changes have been saved successfully.',
  },
  deleted: {
    title: 'Deleted',
    message: 'The item has been permanently deleted.',
  },

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  'signed-in': {
    title: 'Welcome back',
    message: "You're now signed in.",
  },
  'signed-out': {
    title: 'Signed out',
    message: "You've been signed out successfully.",
  },
  'password-changed': {
    title: 'Password updated',
    message: 'Your password has been changed successfully.',
  },

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------
  'link-copied': {
    title: 'Link copied',
    message: 'The link has been copied to your clipboard.',
  },
  shared: {
    title: 'Shared successfully',
    message: 'Thanks for sharing Farm Companion.',
  },

  // ---------------------------------------------------------------------------
  // Generic
  // ---------------------------------------------------------------------------
  default: {
    title: 'Done',
    message: 'Action completed successfully.',
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
    title: `${farmName} submitted`,
    message: `Thanks for adding ${farmName} to our directory. We'll review your submission and it should appear within a few days.`,
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
    title: `${count} photos uploaded`,
    message: `Your ${count} photos have been submitted for review. Once approved, they'll appear on the farm's page.`,
  }
}

/**
 * Get favorite added message with farm name
 */
export function getFavoriteAddedMessage(farmName: string): SuccessMessage {
  return {
    ...successMessages['favorite-added'],
    title: `${farmName} saved`,
    message: `${farmName} has been added to your favourites for easy access.`,
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
  saved: 'Saved',
  deleted: 'Deleted',
  copied: 'Copied to clipboard',
  shared: 'Shared',
  updated: 'Updated',
  added: 'Added',
  removed: 'Removed',
  sent: 'Sent',
  submitted: 'Submitted',
  uploaded: 'Uploaded',

  // Favorites
  favoriteAdded: 'Added to favourites',
  favoriteRemoved: 'Removed from favourites',

  // Settings
  settingsSaved: 'Settings saved',
  preferencesUpdated: 'Preferences updated',

  // Errors recovered
  reconnected: 'Connection restored',
  syncComplete: 'Sync complete',
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
    title: 'Delete this item?',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Keep it',
  },
  unsavedChanges: {
    title: 'Unsaved changes',
    message: 'You have unsaved changes. Are you sure you want to leave?',
    confirmText: 'Leave anyway',
    cancelText: 'Stay here',
  },
  removePhoto: {
    title: 'Remove this photo?',
    message: 'The photo will be permanently removed from the farm listing.',
    confirmText: 'Remove photo',
    cancelText: 'Keep photo',
  },
  cancelSubmission: {
    title: 'Cancel submission?',
    message: 'Your progress will be lost if you leave now.',
    confirmText: 'Yes, cancel',
    cancelText: 'Continue editing',
  },
  signOut: {
    title: 'Sign out?',
    message: "You'll need to sign in again to access your account.",
    confirmText: 'Sign out',
    cancelText: 'Stay signed in',
  },
}

/**
 * Get confirmation dialog content
 */
export function getConfirmation(key: keyof typeof confirmations) {
  return confirmations[key]
}
