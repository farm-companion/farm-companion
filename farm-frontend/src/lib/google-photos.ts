/**
 * Google Places Photo URL Fetcher
 *
 * Handles on-demand fetching of Google Places photo URLs.
 * Photo references are stored in the database; URLs are fetched when needed.
 *
 * Note: Google photo URLs expire after ~24 hours, so we cache with TTL.
 */

// In-memory cache for photo URLs (server-side)
const photoUrlCache = new Map<string, { url: string; expiresAt: number }>()

// Cache TTL: 23 hours (Google URLs last ~24h)
const CACHE_TTL_MS = 23 * 60 * 60 * 1000

/**
 * Get a Google Places photo URL from a photo reference.
 *
 * @param photoReference - The photo_reference from Google Places API
 * @param maxWidth - Maximum width of the image (default 800px)
 * @returns The photo URL or null if unavailable
 */
export function getGooglePhotoUrl(
  photoReference: string,
  maxWidth: number = 800
): string | null {
  if (!photoReference) return null

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.warn('[google-photos] GOOGLE_PLACES_API_KEY not configured')
    return null
  }

  // Check cache
  const cached = photoUrlCache.get(photoReference)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  // Build the photo URL
  // This URL will redirect to the actual image when accessed
  const url = `https://maps.googleapis.com/maps/api/place/photo?` +
    `maxwidth=${maxWidth}&` +
    `photo_reference=${encodeURIComponent(photoReference)}&` +
    `key=${apiKey}`

  // Cache the URL
  photoUrlCache.set(photoReference, {
    url,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return url
}

/**
 * Batch fetch photo URLs for multiple references.
 *
 * @param photoReferences - Array of photo references
 * @param maxWidth - Maximum width of images
 * @returns Map of reference to URL
 */
export function getGooglePhotoUrls(
  photoReferences: string[],
  maxWidth: number = 800
): Map<string, string> {
  const result = new Map<string, string>()

  for (const ref of photoReferences) {
    const url = getGooglePhotoUrl(ref, maxWidth)
    if (url) {
      result.set(ref, url)
    }
  }

  return result
}

/**
 * Clear expired entries from the cache.
 * Called periodically to prevent memory leaks.
 */
export function cleanupPhotoCache(): void {
  const now = Date.now()
  for (const [key, value] of photoUrlCache.entries()) {
    if (value.expiresAt <= now) {
      photoUrlCache.delete(key)
    }
  }
}

// Cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupPhotoCache, 60 * 60 * 1000)
}
