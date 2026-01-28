/**
 * Map Accessibility Utilities
 *
 * Helpers for making the map accessible to all users.
 * Follows WCAG 2.1 AA guidelines.
 */

/**
 * Screen reader announcements for map events
 */
export const ANNOUNCEMENTS = {
  // Map state
  mapLoaded: 'Map loaded. Use arrow keys to pan, plus and minus to zoom.',
  mapError: 'Map failed to load. A list of farms is available below.',

  // Location
  locationFound: (accuracy: number) =>
    `Your location found with ${accuracy < 100 ? 'high' : 'approximate'} accuracy.`,
  locationDenied: 'Location access denied. You can still browse farms on the map.',
  locationUnavailable: 'Location unavailable. Using approximate location.',

  // Markers
  markerFocused: (name: string, distance?: number) =>
    distance
      ? `${name}, ${formatDistance(distance)} away. Press Enter to view details.`
      : `${name}. Press Enter to view details.`,
  markerSelected: (name: string) => `${name} selected. Details panel open.`,

  // Clusters
  clusterFocused: (count: number) =>
    `Cluster with ${count} farms. Press Enter to zoom in or view list.`,
  clusterExpanded: (count: number) =>
    `Showing ${count} farms in this area.`,

  // Navigation
  zoomIn: (level: number) => `Zoomed in to level ${level}.`,
  zoomOut: (level: number) => `Zoomed out to level ${level}.`,
  panTo: (direction: string) => `Panned ${direction}.`,

  // Search
  searchResults: (count: number, query: string) =>
    count === 0
      ? `No farms found for "${query}".`
      : `${count} farm${count === 1 ? '' : 's'} found for "${query}".`,
  searchCleared: 'Search cleared. Showing all farms.',
} as const

/**
 * Format distance for screen readers
 */
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} meters`
  }
  return `${km.toFixed(1)} kilometers`
}

/**
 * Announce to screen readers using ARIA live region
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return

  // Find or create live region
  let liveRegion = document.getElementById('map-announcements')

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'map-announcements'
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(liveRegion)
  }

  // Update priority if needed
  liveRegion.setAttribute('aria-live', priority)

  // Clear and set message (triggers announcement)
  liveRegion.textContent = ''
  requestAnimationFrame(() => {
    if (liveRegion) {
      liveRegion.textContent = message
    }
  })
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation duration based on user preferences
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs
}

/**
 * Keyboard navigation helpers
 */
export const KEYBOARD_SHORTCUTS = {
  // Map navigation
  panUp: ['ArrowUp', 'w', 'W'],
  panDown: ['ArrowDown', 's', 'S'],
  panLeft: ['ArrowLeft', 'a', 'A'],
  panRight: ['ArrowRight', 'd', 'D'],
  zoomIn: ['+', '='],
  zoomOut: ['-', '_'],
  resetView: ['r', 'R', 'Home'],

  // Marker navigation
  nextMarker: ['Tab'],
  prevMarker: ['Shift+Tab'],
  selectMarker: ['Enter', ' '],
  closePopup: ['Escape'],

  // Quick actions
  findMe: ['l', 'L'],
  search: ['/', 'f', 'F'],
  help: ['?', 'h', 'H'],
} as const

/**
 * Check if a key combination matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: readonly string[]
): boolean {
  const key = event.key
  const withShift = event.shiftKey ? `Shift+${key}` : key

  return shortcut.includes(key) || shortcut.includes(withShift)
}

/**
 * Focus trap for modal dialogs (cluster preview, farm details)
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)
  firstElement?.focus()

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Skip link for keyboard users to bypass map
 */
export function createSkipLink(targetId: string, label = 'Skip to content'): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium'
  link.textContent = label
  return link
}

/**
 * Generate accessible label for farm marker
 */
export function getFarmMarkerLabel(farm: {
  name: string
  location: { city?: string; county: string }
  isOpen?: boolean
}): string {
  const parts = [farm.name]

  if (farm.location.city) {
    parts.push(`in ${farm.location.city}`)
  } else {
    parts.push(`in ${farm.location.county}`)
  }

  if (farm.isOpen !== undefined) {
    parts.push(farm.isOpen ? 'currently open' : 'currently closed')
  }

  return parts.join(', ')
}

/**
 * Generate accessible label for cluster marker
 */
export function getClusterMarkerLabel(count: number): string {
  return `Cluster of ${count} farm${count === 1 ? '' : 's'}. Press Enter to expand.`
}
