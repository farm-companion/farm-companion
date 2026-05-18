/**
 * Pure helpers for FarmPreviewCard.
 * Extracted so the card itself can stay presentational and these
 * rules are testable under node:test (no React Testing Library needed).
 */

/**
 * Truncate a farm's description to a hook-length string suitable for the
 * preview card. Returns undefined for empty/whitespace input so callers
 * can branch with `{hook && ...}`.
 */
export function truncateHook(description: string | undefined, max = 120): string | undefined {
  if (!description) return undefined
  const trimmed = description.trim()
  if (!trimmed) return undefined
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max)
}

/**
 * Tri-state open/closed/unknown tone for the status badge.
 * Drives token selection in FarmPreviewCard.
 */
export type OpeningTone = 'open' | 'closed' | 'unknown'

export function getOpeningTone(isOpen: boolean | null | undefined): OpeningTone {
  if (isOpen === true) return 'open'
  if (isOpen === false) return 'closed'
  return 'unknown'
}

/**
 * Build a Google Maps directions URL for a lat/lng pair.
 * Used by both the desktop and mobile preview layouts.
 */
export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/**
 * Build the canonical in-app /shop/<slug> URL from an origin.
 * Strips a trailing slash from origin so we never produce double-slashes.
 */
export function buildShopUrl(origin: string, slug: string): string {
  const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin
  return `${cleanOrigin}/shop/${slug}`
}
