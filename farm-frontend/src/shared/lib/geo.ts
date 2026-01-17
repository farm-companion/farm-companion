/**
 * Geospatial utilities (consolidated to eliminate duplication)
 */

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - Latitude of point 1 (degrees)
 * @param lng1 - Longitude of point 1 (degrees)
 * @param lat2 - Latitude of point 2 (degrees)
 * @param lng2 - Longitude of point 2 (degrees)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Format distance for human-readable display
 * @param distance - Distance in kilometers
 * @returns Formatted string (e.g., "1.5km" or "350m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

/**
 * Sort array of items by distance from a reference point
 * @param items - Array of items with location property
 * @param refLat - Reference latitude
 * @param refLng - Reference longitude
 * @returns Sorted array with distance property added
 */
export function sortByDistance<T extends { location: { lat: number; lng: number } }>(
  items: T[],
  refLat: number,
  refLng: number
): (T & { distance: number })[] {
  return items
    .map((item) => ({
      ...item,
      distance: calculateDistance(refLat, refLng, item.location.lat, item.location.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
}
