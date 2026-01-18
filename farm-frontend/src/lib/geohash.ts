/**
 * Geohash Utility
 *
 * Implements geohash encoding for spatial indexing and tile-based caching.
 * Geohash precision levels and their approximate cell dimensions:
 *
 * | Precision | Width      | Height     | Use Case                    |
 * |-----------|------------|------------|-----------------------------|
 * | 1         | 5,000 km   | 5,000 km   | Global region               |
 * | 2         | 1,250 km   | 625 km     | Country                     |
 * | 3         | 156 km     | 156 km     | Large region                |
 * | 4         | 39.1 km    | 19.5 km    | County/Metro area           |
 * | 5         | 4.9 km     | 4.9 km     | City district (our default) |
 * | 6         | 1.2 km     | 610 m      | Neighborhood                |
 * | 7         | 153 m      | 153 m      | Street block                |
 * | 8         | 38.2 m     | 19.1 m     | Building                    |
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

/**
 * Encode latitude/longitude to geohash string
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 5): string {
  let latRange = { min: -90, max: 90 }
  let lngRange = { min: -180, max: 180 }
  let hash = ''
  let bit = 0
  let ch = 0
  let isLng = true

  while (hash.length < precision) {
    if (isLng) {
      const mid = (lngRange.min + lngRange.max) / 2
      if (lng >= mid) {
        ch |= 1 << (4 - bit)
        lngRange.min = mid
      } else {
        lngRange.max = mid
      }
    } else {
      const mid = (latRange.min + latRange.max) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bit)
        latRange.min = mid
      } else {
        latRange.max = mid
      }
    }

    isLng = !isLng
    bit++

    if (bit === 5) {
      hash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }

  return hash
}

/**
 * Decode geohash to bounding box
 */
export function decodeGeohashBounds(hash: string): {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
} {
  let latRange = { min: -90, max: 90 }
  let lngRange = { min: -180, max: 180 }
  let isLng = true

  for (const char of hash.toLowerCase()) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) continue

    for (let bit = 4; bit >= 0; bit--) {
      const bitValue = (idx >> bit) & 1
      if (isLng) {
        const mid = (lngRange.min + lngRange.max) / 2
        if (bitValue === 1) {
          lngRange.min = mid
        } else {
          lngRange.max = mid
        }
      } else {
        const mid = (latRange.min + latRange.max) / 2
        if (bitValue === 1) {
          latRange.min = mid
        } else {
          latRange.max = mid
        }
      }
      isLng = !isLng
    }
  }

  return {
    minLat: latRange.min,
    maxLat: latRange.max,
    minLng: lngRange.min,
    maxLng: lngRange.max,
  }
}

/**
 * Get center point of geohash
 */
export function decodeGeohashCenter(hash: string): { lat: number; lng: number } {
  const bounds = decodeGeohashBounds(hash)
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }
}

/**
 * Get all geohashes that cover a bounding box
 */
export function getGeohashesForBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  precision: number = 5
): string[] {
  const hashes = new Set<string>()

  // Get approximate cell size for this precision
  const bounds = decodeGeohashBounds('s'.repeat(precision))
  const latStep = (bounds.maxLat - bounds.minLat) * 0.8 // Overlap for safety
  const lngStep = (bounds.maxLng - bounds.minLng) * 0.8

  // Grid walk to cover the bounding box
  for (let lat = minLat; lat <= maxLat + latStep; lat += latStep) {
    for (let lng = minLng; lng <= maxLng + lngStep; lng += lngStep) {
      // Clamp to valid ranges
      const clampedLat = Math.max(-90, Math.min(90, lat))
      const clampedLng = Math.max(-180, Math.min(180, lng))
      hashes.add(encodeGeohash(clampedLat, clampedLng, precision))
    }
  }

  return Array.from(hashes)
}

/**
 * Get neighboring geohashes (8 surrounding cells)
 */
export function getNeighbors(hash: string): string[] {
  const center = decodeGeohashCenter(hash)
  const bounds = decodeGeohashBounds(hash)

  const latStep = (bounds.maxLat - bounds.minLat)
  const lngStep = (bounds.maxLng - bounds.minLng)

  const neighbors: string[] = []
  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ]

  for (const [latOff, lngOff] of offsets) {
    const newLat = center.lat + (latOff * latStep)
    const newLng = center.lng + (lngOff * lngStep)

    // Skip invalid coordinates
    if (newLat < -90 || newLat > 90 || newLng < -180 || newLng > 180) {
      continue
    }

    neighbors.push(encodeGeohash(newLat, newLng, hash.length))
  }

  return neighbors
}

/**
 * Calculate optimal precision based on viewport size
 * Returns precision that results in reasonable tile count (target: 4-16 tiles)
 */
export function getOptimalPrecision(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): number {
  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng

  // Approximate cell sizes (degrees) for each precision
  const precisionSizes = [
    { precision: 1, lat: 45, lng: 45 },
    { precision: 2, lat: 5.6, lng: 11.25 },
    { precision: 3, lat: 1.4, lng: 1.4 },
    { precision: 4, lat: 0.35, lng: 0.35 },
    { precision: 5, lat: 0.044, lng: 0.044 },
    { precision: 6, lat: 0.011, lng: 0.0055 },
  ]

  // Find precision where we get 4-16 tiles
  for (const { precision, lat, lng } of precisionSizes) {
    const latTiles = Math.ceil(latSpan / lat)
    const lngTiles = Math.ceil(lngSpan / lng)
    const totalTiles = latTiles * lngTiles

    if (totalTiles >= 4 && totalTiles <= 25) {
      return precision
    }
  }

  // Default to precision 5 (city district level)
  return 5
}

/**
 * Check if a point is within a geohash cell
 */
export function isPointInGeohash(lat: number, lng: number, hash: string): boolean {
  const bounds = decodeGeohashBounds(hash)
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  )
}
