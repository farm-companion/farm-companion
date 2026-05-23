/**
 * Pure helpers for map screen-reader announcements.
 * Extracted so the announcement wording is testable under node:test
 * (no React Testing Library needed) and reused across selection,
 * and — in a future slice — cluster expansion.
 */

/** Minimal shape needed to phrase a selection announcement. */
type AnnounceableFarm = {
  name: string
  location: { county: string }
}

/**
 * Phrase the polite live-region message announced when a farm is selected
 * (via marker click, keyboard activation, or the list). County is appended
 * only when present, so a farm with no county still reads cleanly.
 */
export function buildSelectionAnnouncement(farm: AnnounceableFarm): string {
  const county = farm.location.county?.trim()
  return county ? `Selected: ${farm.name} in ${county}` : `Selected: ${farm.name}`
}
