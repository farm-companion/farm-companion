/**
 * Geocoding Abstraction Layer
 *
 * Provides geocoding services using free providers (Nominatim/OpenStreetMap).
 * Replaces Google Geocoding for zero-cost address lookups.
 *
 * Features:
 * - Forward geocoding (address -> coordinates)
 * - Reverse geocoding (coordinates -> address)
 * - UK-biased search results
 * - Postcode lookup via Postcodes.io
 * - Rate limiting (Nominatim: 1 req/sec)
 * - Caching for repeated lookups
 *
 * @see https://nominatim.org/release-docs/latest/api/Overview/
 * @see https://postcodes.io/
 */

// =============================================================================
// TYPES
// =============================================================================

export interface GeocodingResult {
  /** Latitude */
  lat: number
  /** Longitude */
  lng: number
  /** Formatted display name */
  displayName: string
  /** Address components */
  address: {
    street?: string
    city?: string
    county?: string
    postcode?: string
    country?: string
  }
  /** Confidence score (0-1) */
  confidence: number
  /** Source of the result */
  source: 'nominatim' | 'postcodes.io'
}

export interface GeocodingOptions {
  /** Limit results to UK only (default: true) */
  ukOnly?: boolean
  /** Maximum number of results (default: 5) */
  limit?: number
  /** Bias results toward this location */
  viewbox?: {
    minLon: number
    minLat: number
    maxLon: number
    maxLat: number
  }
}

export interface ReverseGeocodingResult {
  /** Formatted address */
  displayName: string
  /** Address components */
  address: {
    street?: string
    city?: string
    county?: string
    postcode?: string
    country?: string
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const POSTCODES_IO_BASE_URL = 'https://api.postcodes.io'

// UK bounding box for biased searches
const UK_VIEWBOX = {
  minLon: -8.65,
  minLat: 49.86,
  maxLon: 1.77,
  maxLat: 60.86,
}

// Rate limiting: track last request time
let lastNominatimRequest = 0
const NOMINATIM_MIN_INTERVAL = 1100 // 1.1 seconds between requests

// Simple in-memory cache
const geocodeCache = new Map<string, { result: GeocodingResult[]; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Wait for rate limit before making Nominatim request
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastNominatimRequest

  if (timeSinceLastRequest < NOMINATIM_MIN_INTERVAL) {
    const waitTime = NOMINATIM_MIN_INTERVAL - timeSinceLastRequest
    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }

  lastNominatimRequest = Date.now()
}

// =============================================================================
// POSTCODE LOOKUP (UK-specific, fast)
// =============================================================================

/**
 * Check if a string looks like a UK postcode
 */
export function isUKPostcode(query: string): boolean {
  // UK postcode pattern (loose match)
  const postcodePattern = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i
  return postcodePattern.test(query.trim())
}

/**
 * Lookup a UK postcode using Postcodes.io (no rate limit, fast)
 */
export async function lookupPostcode(postcode: string): Promise<GeocodingResult | null> {
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()

  try {
    const response = await fetch(
      `${POSTCODES_IO_BASE_URL}/postcodes/${encodeURIComponent(cleanPostcode)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.status !== 200 || !data.result) {
      return null
    }

    const result = data.result

    return {
      lat: result.latitude,
      lng: result.longitude,
      displayName: `${result.postcode}, ${result.admin_district || result.region}, UK`,
      address: {
        postcode: result.postcode,
        city: result.admin_district || result.parish,
        county: result.admin_county || result.region,
        country: 'United Kingdom',
      },
      confidence: 1.0,
      source: 'postcodes.io',
    }
  } catch (error) {
    console.warn('[geocoding] Postcode lookup failed:', error)
    return null
  }
}

/**
 * Autocomplete postcodes (for search suggestions)
 */
export async function autocompletePostcode(
  partial: string,
  limit = 5
): Promise<Array<{ postcode: string; displayName: string }>> {
  const clean = partial.replace(/\s+/g, '').toUpperCase()

  if (clean.length < 2) {
    return []
  }

  try {
    const response = await fetch(
      `${POSTCODES_IO_BASE_URL}/postcodes/${encodeURIComponent(clean)}/autocomplete?limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (data.status !== 200 || !data.result) {
      return []
    }

    return data.result.map((postcode: string) => ({
      postcode,
      displayName: postcode,
    }))
  } catch (error) {
    console.warn('[geocoding] Postcode autocomplete failed:', error)
    return []
  }
}

// =============================================================================
// NOMINATIM GEOCODING
// =============================================================================

/**
 * Forward geocode an address using Nominatim
 */
export async function geocodeAddress(
  query: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult[]> {
  const { ukOnly = true, limit = 5, viewbox } = options

  // Check cache first
  const cacheKey = `geocode:${query}:${ukOnly}:${limit}`
  const cached = geocodeCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  // Check if it's a UK postcode - use Postcodes.io instead
  if (isUKPostcode(query)) {
    const postcodeResult = await lookupPostcode(query)
    if (postcodeResult) {
      const results = [postcodeResult]
      geocodeCache.set(cacheKey, { result: results, timestamp: Date.now() })
      return results
    }
  }

  // Rate limit for Nominatim
  await waitForRateLimit()

  // Build URL
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: limit.toString(),
  })

  // Add UK country code if UK-only
  if (ukOnly) {
    params.append('countrycodes', 'gb')
  }

  // Add viewbox for biased results
  const box = viewbox || (ukOnly ? UK_VIEWBOX : undefined)
  if (box) {
    params.append('viewbox', `${box.minLon},${box.maxLat},${box.maxLon},${box.minLat}`)
    params.append('bounded', '0') // Prefer but don't require results in viewbox
  }

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FarmCompanion/1.0 (https://farmcompanion.co.uk)',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`)
    }

    const data = await response.json()

    const results: GeocodingResult[] = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        street: item.address?.road || item.address?.street,
        city: item.address?.city || item.address?.town || item.address?.village,
        county: item.address?.county || item.address?.state,
        postcode: item.address?.postcode,
        country: item.address?.country,
      },
      confidence: calculateConfidence(item),
      source: 'nominatim' as const,
    }))

    // Cache results
    geocodeCache.set(cacheKey, { result: results, timestamp: Date.now() })

    return results
  } catch (error) {
    console.error('[geocoding] Nominatim geocode failed:', error)
    return []
  }
}

/**
 * Reverse geocode coordinates to address using Nominatim
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodingResult | null> {
  // Rate limit
  await waitForRateLimit()

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'jsonv2',
    addressdetails: '1',
  })

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FarmCompanion/1.0 (https://farmcompanion.co.uk)',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      return null
    }

    return {
      displayName: data.display_name,
      address: {
        street: data.address?.road || data.address?.street,
        city: data.address?.city || data.address?.town || data.address?.village,
        county: data.address?.county || data.address?.state,
        postcode: data.address?.postcode,
        country: data.address?.country,
      },
    }
  } catch (error) {
    console.error('[geocoding] Nominatim reverse failed:', error)
    return null
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate confidence score based on Nominatim result properties
 */
function calculateConfidence(item: any): number {
  // Nominatim provides importance (0-1) and type info
  let confidence = item.importance || 0.5

  // Boost confidence for more specific result types
  const type = item.type || ''
  if (['house', 'building', 'shop', 'farm'].includes(type)) {
    confidence = Math.min(confidence + 0.2, 1.0)
  } else if (['street', 'road'].includes(type)) {
    confidence = Math.min(confidence + 0.1, 1.0)
  }

  // Reduce confidence for very generic results
  if (['county', 'state', 'country'].includes(type)) {
    confidence = Math.max(confidence - 0.3, 0.1)
  }

  return confidence
}

/**
 * Search for places (combines postcode and address search)
 */
export async function searchPlaces(
  query: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult[]> {
  // If it looks like a postcode, prioritize postcode lookup
  if (isUKPostcode(query)) {
    const postcodeResult = await lookupPostcode(query)
    if (postcodeResult) {
      return [postcodeResult]
    }
  }

  // Otherwise use standard geocoding
  return geocodeAddress(query, options)
}

/**
 * Get the user's approximate location from IP (fallback when GPS unavailable)
 * Uses a free IP geolocation service
 */
export async function getApproximateLocation(): Promise<{
  lat: number
  lng: number
  city?: string
  country?: string
} | null> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.latitude || !data.longitude) {
      return null
    }

    return {
      lat: data.latitude,
      lng: data.longitude,
      city: data.city,
      country: data.country_name,
    }
  } catch (error) {
    console.warn('[geocoding] IP geolocation failed:', error)
    return null
  }
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear()
}
