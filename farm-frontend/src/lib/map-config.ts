/**
 * MapLibre GL Configuration
 *
 * Tile providers and map settings for the farm directory map.
 * Uses free tier providers with proper attribution.
 */

// =============================================================================
// TILE PROVIDERS
// =============================================================================

/**
 * Stadia Maps - Primary provider
 * Free tier: 200K tiles/day, no credit card required
 * Styles: Alidade Smooth, Outdoors, OSM Bright
 * https://stadiamaps.com/
 */
export const STADIA_STYLES = {
  // Clean, minimal style - good for data visualization
  alidadeSmooth: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
  alidadeSmoothDark: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
  // Outdoor/terrain focused
  outdoors: 'https://tiles.stadiamaps.com/styles/outdoors.json',
  // Classic OSM look
  osmBright: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
} as const

/**
 * MapTiler - Fallback provider
 * Free tier: 100K tiles/month
 * Requires API key for higher limits
 * https://www.maptiler.com/
 */
export const MAPTILER_STYLES = {
  streets: (apiKey: string) =>
    `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
  outdoor: (apiKey: string) =>
    `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${apiKey}`,
  satellite: (apiKey: string) =>
    `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`,
} as const

/**
 * OpenStreetMap Raster - Emergency fallback
 * Unlimited, but raster (not vector) so less performant
 */
export const OSM_RASTER_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster' as const,
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

export interface MapConfig {
  /** Map style URL or style object */
  style: string | object
  /** Initial center coordinates [lng, lat] */
  center: [number, number]
  /** Initial zoom level */
  zoom: number
  /** Minimum zoom level */
  minZoom: number
  /** Maximum zoom level */
  maxZoom: number
  /** Attribution HTML */
  attribution: string
  /** Whether to show attribution control */
  showAttribution: boolean
  /** Bounds to restrict panning [[sw_lng, sw_lat], [ne_lng, ne_lat]] */
  maxBounds?: [[number, number], [number, number]]
}

/**
 * Default map configuration for UK farm directory
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  style: STADIA_STYLES.alidadeSmooth,
  // Center of UK (roughly Birmingham)
  center: [-1.8, 52.5],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
  attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  showAttribution: true,
  // Restrict to UK and Ireland with some padding
  maxBounds: [
    [-12, 49], // Southwest: west of Ireland, south of England
    [4, 61],   // Northeast: east of England, north of Scotland
  ],
}

/**
 * Dark mode map configuration
 */
export const DARK_MAP_CONFIG: MapConfig = {
  ...DEFAULT_MAP_CONFIG,
  style: STADIA_STYLES.alidadeSmoothDark,
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get map style based on theme
 */
export function getMapStyle(isDarkMode: boolean): string {
  return isDarkMode
    ? STADIA_STYLES.alidadeSmoothDark
    : STADIA_STYLES.alidadeSmooth
}

/**
 * Get map config with environment overrides
 */
export function getMapConfig(options?: {
  isDarkMode?: boolean
  maptilerKey?: string
}): MapConfig {
  const { isDarkMode = false, maptilerKey } = options || {}

  // If MapTiler key is provided, use MapTiler (higher quality)
  if (maptilerKey) {
    return {
      ...DEFAULT_MAP_CONFIG,
      style: isDarkMode
        ? MAPTILER_STYLES.streets(maptilerKey)
        : MAPTILER_STYLES.streets(maptilerKey),
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }
  }

  // Default to Stadia Maps (free, no key required)
  return isDarkMode ? DARK_MAP_CONFIG : DEFAULT_MAP_CONFIG
}

/**
 * Validate coordinates are within UK bounds
 */
export function isWithinUKBounds(lng: number, lat: number): boolean {
  const bounds = DEFAULT_MAP_CONFIG.maxBounds
  if (!bounds) return true

  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}

/**
 * Clamp coordinates to UK bounds
 */
export function clampToUKBounds(lng: number, lat: number): [number, number] {
  const bounds = DEFAULT_MAP_CONFIG.maxBounds
  if (!bounds) return [lng, lat]

  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  return [
    Math.max(minLng, Math.min(maxLng, lng)),
    Math.max(minLat, Math.min(maxLat, lat)),
  ]
}
