/**
 * Static Map URL Generator
 *
 * Generates static map image URLs using free providers.
 * Supports multiple providers with fallback chain.
 *
 * Free Static Map Providers:
 * 1. OpenStreetMap via Geoapify (free tier: 3000 req/day)
 * 2. Stadia Maps (free tier: 200K tiles/day)
 * 3. MapTiler (free tier: 100K tiles/month)
 * 4. Direct OSM tile (no API key, limited styling)
 */

export interface StaticMapOptions {
  /** Latitude */
  lat: number
  /** Longitude */
  lng: number
  /** Zoom level (1-18, default: 14) */
  zoom?: number
  /** Width in pixels (default: 400) */
  width?: number
  /** Height in pixels (default: 200) */
  height?: number
  /** Retina/HiDPI (default: true) */
  retina?: boolean
  /** Map style */
  style?: 'streets' | 'satellite' | 'outdoors' | 'light' | 'dark'
  /** Show marker at center (default: true) */
  showMarker?: boolean
  /** Marker color (hex without #, default: 06B6D4 - cyan) */
  markerColor?: string
  /** Preferred provider */
  provider?: 'geoapify' | 'stadia' | 'maptiler' | 'osm'
}

// Environment variables for API keys
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
const STADIA_API_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY
const MAPTILER_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY

/**
 * Generate static map URL using best available provider
 */
export function getStaticMapUrl(options: StaticMapOptions): string {
  const {
    lat,
    lng,
    zoom = 14,
    width = 400,
    height = 200,
    retina = true,
    style = 'streets',
    showMarker = true,
    markerColor = '06B6D4',
    provider,
  } = options

  // Use specified provider or auto-select based on available API keys
  const selectedProvider =
    provider ||
    (GEOAPIFY_API_KEY ? 'geoapify' : null) ||
    (STADIA_API_KEY ? 'stadia' : null) ||
    (MAPTILER_API_KEY ? 'maptiler' : null) ||
    'osm'

  switch (selectedProvider) {
    case 'geoapify':
      return getGeoapifyUrl(lat, lng, zoom, width, height, retina, style, showMarker, markerColor)
    case 'stadia':
      return getStadiaUrl(lat, lng, zoom, width, height, retina, style)
    case 'maptiler':
      return getMapTilerUrl(lat, lng, zoom, width, height, retina, style, showMarker, markerColor)
    case 'osm':
    default:
      return getOSMUrl(lat, lng, zoom, width, height)
  }
}

/**
 * Geoapify Static Maps API
 * Free tier: 3000 requests/day
 * Docs: https://www.geoapify.com/static-maps-api
 */
function getGeoapifyUrl(
  lat: number,
  lng: number,
  zoom: number,
  width: number,
  height: number,
  retina: boolean,
  style: string,
  showMarker: boolean,
  markerColor: string
): string {
  if (!GEOAPIFY_API_KEY) {
    return getOSMUrl(lat, lng, zoom, width, height)
  }

  const styleMap: Record<string, string> = {
    streets: 'osm-bright',
    satellite: 'satellite',
    outdoors: 'osm-carto',
    light: 'positron',
    dark: 'dark-matter',
  }

  const scaleFactor = retina ? 2 : 1
  const effectiveWidth = width * scaleFactor
  const effectiveHeight = height * scaleFactor

  let url = `https://maps.geoapify.com/v1/staticmap?style=${styleMap[style] || 'osm-bright'}&width=${effectiveWidth}&height=${effectiveHeight}&center=lonlat:${lng},${lat}&zoom=${zoom}&apiKey=${GEOAPIFY_API_KEY}`

  if (showMarker) {
    url += `&marker=lonlat:${lng},${lat};color:%23${markerColor};size:medium`
  }

  return url
}

/**
 * Stadia Maps Static Images
 * Free tier: 200K tiles/day (requires attribution)
 * Docs: https://docs.stadiamaps.com/raster-static-maps/
 */
function getStadiaUrl(
  lat: number,
  lng: number,
  zoom: number,
  width: number,
  height: number,
  retina: boolean,
  style: string
): string {
  if (!STADIA_API_KEY) {
    return getOSMUrl(lat, lng, zoom, width, height)
  }

  const styleMap: Record<string, string> = {
    streets: 'alidade_smooth',
    satellite: 'alidade_satellite',
    outdoors: 'outdoors',
    light: 'alidade_smooth',
    dark: 'alidade_smooth_dark',
  }

  const retinaStr = retina ? '@2x' : ''

  // Stadia static image API format
  return `https://tiles.stadiamaps.com/static/${styleMap[style] || 'alidade_smooth'}/${lng},${lat},${zoom}/${width}x${height}${retinaStr}.png?api_key=${STADIA_API_KEY}`
}

/**
 * MapTiler Static Images
 * Free tier: 100K tiles/month
 * Docs: https://docs.maptiler.com/cloud/api/static-maps/
 */
function getMapTilerUrl(
  lat: number,
  lng: number,
  zoom: number,
  width: number,
  height: number,
  retina: boolean,
  style: string,
  showMarker: boolean,
  markerColor: string
): string {
  if (!MAPTILER_API_KEY) {
    return getOSMUrl(lat, lng, zoom, width, height)
  }

  const styleMap: Record<string, string> = {
    streets: 'streets-v2',
    satellite: 'satellite',
    outdoors: 'outdoor-v2',
    light: 'basic-v2-light',
    dark: 'basic-v2-dark',
  }

  const retinaStr = retina ? '@2x' : ''
  let url = `https://api.maptiler.com/maps/${styleMap[style] || 'streets-v2'}/static/${lng},${lat},${zoom}/${width}x${height}${retinaStr}.png?key=${MAPTILER_API_KEY}`

  if (showMarker) {
    // MapTiler marker format: pin-s-marker+color(lng,lat)
    url = `https://api.maptiler.com/maps/${styleMap[style] || 'streets-v2'}/static/pin-s+${markerColor}(${lng},${lat})/${lng},${lat},${zoom}/${width}x${height}${retinaStr}.png?key=${MAPTILER_API_KEY}`
  }

  return url
}

/**
 * Direct OpenStreetMap Tile
 * Free, no API key, but limited to single tile (no markers, fixed zoom)
 * Use as fallback only
 */
function getOSMUrl(
  lat: number,
  lng: number,
  zoom: number,
  width: number,
  height: number
): string {
  // Calculate tile coordinates
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  )

  // Return a single tile (256x256) - not ideal but works without API key
  // For better results, use one of the API providers
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}

/**
 * Generate a placeholder URL when no map is available
 * Uses a simple colored placeholder with a map icon
 */
export function getPlaceholderMapUrl(width: number = 400, height: number = 200): string {
  // Return a simple placeholder - this could be a local asset or a data URL
  // Using a neutral gradient that works for light/dark mode
  return `/images/map-placeholder.svg`
}

/**
 * Check if static maps are available (any provider configured)
 */
export function hasStaticMapProvider(): boolean {
  return Boolean(GEOAPIFY_API_KEY || STADIA_API_KEY || MAPTILER_API_KEY)
}

/**
 * Get attribution text for the static map provider
 */
export function getStaticMapAttribution(provider?: string): string {
  const selectedProvider =
    provider ||
    (GEOAPIFY_API_KEY ? 'geoapify' : null) ||
    (STADIA_API_KEY ? 'stadia' : null) ||
    (MAPTILER_API_KEY ? 'maptiler' : null) ||
    'osm'

  switch (selectedProvider) {
    case 'geoapify':
      return 'Powered by Geoapify | © OpenMapTiles © OpenStreetMap'
    case 'stadia':
      return '© Stadia Maps © OpenMapTiles © OpenStreetMap'
    case 'maptiler':
      return '© MapTiler © OpenStreetMap'
    case 'osm':
    default:
      return '© OpenStreetMap contributors'
  }
}
