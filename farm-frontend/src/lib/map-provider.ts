/**
 * Map Provider Configuration
 *
 * Supports free map providers only. Google Maps is no longer used.
 *
 * Provider Options:
 * - 'leaflet': Lightweight, reliable Leaflet with OSM tiles (recommended)
 * - 'maplibre': Free, open-source MapLibre GL with Stadia Maps tiles
 * - 'auto': Prefers MapLibre if WebGL available, otherwise Leaflet
 *
 * Environment Variables:
 * - NEXT_PUBLIC_MAP_PROVIDER: 'leaflet' | 'maplibre' | 'auto' (default: 'auto')
 * - NEXT_PUBLIC_STADIA_API_KEY: Optional, for higher Stadia Maps limits
 * - NEXT_PUBLIC_MAPTILER_API_KEY: Optional, for MapTiler tiles
 * - NEXT_PUBLIC_GEOAPIFY_API_KEY: Optional, for Geoapify static maps
 */

export type MapProvider = 'leaflet' | 'maplibre' | 'auto'

/**
 * Get the configured map provider
 */
export function getMapProvider(): MapProvider {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProvider | undefined
  return provider || 'auto'
}

/**
 * Check if MapLibre should be used (requires WebGL)
 */
export function useMapLibre(): boolean {
  const provider = getMapProvider()

  if (provider === 'maplibre') return true
  if (provider === 'leaflet') return false

  // Auto mode: prefer MapLibre, check for WebGL support
  if (typeof window === 'undefined') return true // SSR default to MapLibre

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

/**
 * Get the effective map provider based on configuration and capabilities.
 * Google Maps is no longer offered as a runtime option.
 */
export function getEffectiveProvider(): 'leaflet' | 'maplibre' {
  const provider = getMapProvider()

  if (provider === 'leaflet') {
    return 'leaflet'
  }

  if (provider === 'maplibre') {
    return 'maplibre'
  }

  // Auto mode: prefer MapLibre for vector rendering and smooth animations
  if (useMapLibre()) {
    return 'maplibre'
  }

  return 'leaflet'
}

/**
 * Map provider feature comparison
 */
export const PROVIDER_FEATURES = {
  leaflet: {
    name: 'Leaflet',
    cost: 'Free (OSM tiles)',
    clustering: 'Leaflet.markercluster (client-side)',
    geocoding: 'Nominatim + Postcodes.io (free)',
    staticMaps: 'Geoapify/MapTiler (free tiers)',
    offline: 'Possible with tile caching',
    customStyles: 'Limited (tile provider dependent)',
    attribution: 'Required: OpenStreetMap',
    browserSupport: 'All browsers (no WebGL required)',
    bundleSize: '~40KB',
  },
  maplibre: {
    name: 'MapLibre GL',
    cost: 'Free (Stadia Maps free tier: 200K tiles/day)',
    clustering: 'Supercluster (client-side)',
    geocoding: 'Nominatim + Postcodes.io (free)',
    staticMaps: 'Geoapify/Stadia/MapTiler (free tiers)',
    offline: 'Possible with tile caching',
    customStyles: 'Full control via style JSON',
    attribution: 'Required: Stadia Maps, OpenMapTiles, OpenStreetMap',
    browserSupport: 'Modern browsers with WebGL',
    bundleSize: '~200KB',
  },
} as const
