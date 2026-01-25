/**
 * Smart Cluster Configuration
 *
 * Provides zoom-aware cluster sizing with 5-tier visual hierarchy.
 * Clusters dynamically scale based on farm count and current zoom level.
 */

export interface ClusterTier {
  name: 'tiny' | 'small' | 'medium' | 'large' | 'mega'
  minCount: number
  baseSize: number
  fontSize: number
  color: string
  borderWidth: number
  pulseAnimation: boolean
}

// 5-tier cluster hierarchy
export const CLUSTER_TIERS: ClusterTier[] = [
  { name: 'mega', minCount: 50, baseSize: 64, fontSize: 20, color: '#009688', borderWidth: 3, pulseAnimation: true },
  { name: 'large', minCount: 20, baseSize: 56, fontSize: 18, color: '#00A99D', borderWidth: 3, pulseAnimation: false },
  { name: 'medium', minCount: 10, baseSize: 48, fontSize: 16, color: '#00B8A9', borderWidth: 2, pulseAnimation: false },
  { name: 'small', minCount: 5, baseSize: 40, fontSize: 14, color: '#00C2B2', borderWidth: 2, pulseAnimation: false },
  { name: 'tiny', minCount: 2, baseSize: 32, fontSize: 12, color: '#00CCBB', borderWidth: 2, pulseAnimation: false },
]

/**
 * Get cluster tier based on farm count
 */
export function getClusterTier(count: number): ClusterTier {
  for (const tier of CLUSTER_TIERS) {
    if (count >= tier.minCount) {
      return tier
    }
  }
  return CLUSTER_TIERS[CLUSTER_TIERS.length - 1]
}

/**
 * Calculate zoom-aware cluster size
 * Clusters shrink slightly at higher zoom levels for better marker visibility
 */
export function getZoomAwareSize(baseSize: number, zoom: number): number {
  // At zoom 5-8 (UK overview): full size
  // At zoom 9-12 (regional): 90% size
  // At zoom 13-16 (local): 80% size
  // At zoom 17+: 70% size

  if (zoom <= 8) return baseSize
  if (zoom <= 12) return Math.round(baseSize * 0.9)
  if (zoom <= 16) return Math.round(baseSize * 0.8)
  return Math.round(baseSize * 0.7)
}

/**
 * Generate cluster SVG with smart sizing
 */
export function generateClusterSVG(count: number, zoom: number = 10): {
  svg: string
  size: number
  anchor: number
} {
  const tier = getClusterTier(count)
  const size = getZoomAwareSize(tier.baseSize, zoom)
  const anchor = size / 2
  const radius = (size / 2) - tier.borderWidth
  const textY = (size / 2) + (tier.fontSize / 3)

  // Gradient ID unique per tier for proper rendering
  const gradientId = `cluster-gradient-${tier.name}`

  // Pulse animation for mega clusters
  const pulseFilter = tier.pulseAnimation ? `
    <defs>
      <filter id="glow-${tier.name}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  ` : ''

  const filterAttr = tier.pulseAnimation ? `filter="url(#glow-${tier.name})"` : ''

  // Create gradient for depth effect
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${pulseFilter}
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${tier.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(tier.color, -20)};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle
        cx="${anchor}"
        cy="${anchor}"
        r="${radius}"
        fill="url(#${gradientId})"
        stroke="white"
        stroke-width="${tier.borderWidth}"
        ${filterAttr}
      />
      <text
        x="${anchor}"
        y="${textY}"
        text-anchor="middle"
        fill="white"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${tier.fontSize}"
        font-weight="600"
      >${formatClusterCount(count)}</text>
    </svg>
  `.trim()

  return { svg, size, anchor }
}

/**
 * Format cluster count for display
 * 100+ shows as "99+"
 */
function formatClusterCount(count: number): string {
  if (count >= 100) return '99+'
  return String(count)
}

/**
 * Adjust hex color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Create cluster renderer for MarkerClusterer
 * This is a factory function that creates a zoom-aware renderer
 */
export function createSmartClusterRenderer(getZoom: () => number) {
  return {
    render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
      const zoom = getZoom()
      const { svg, size, anchor } = generateClusterSVG(count, zoom)
      const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

      return new google.maps.Marker({
        position,
        icon: {
          url: svgUrl,
          scaledSize: new google.maps.Size(size, size),
          anchor: new google.maps.Point(anchor, anchor),
        },
        zIndex: google.maps.Marker.MAX_ZINDEX + 2,
        // Add title for accessibility
        title: `Cluster of ${count} farm shops`,
      })
    }
  }
}

/**
 * Optimal zoom levels for cluster interaction
 */
export const CLUSTER_ZOOM_THRESHOLDS = {
  // Show preview sheet for clusters at these counts
  PREVIEW_MAX_COUNT: 8,

  // Target zoom levels when clicking clusters
  ZOOM_TARGETS: {
    mega: 10,    // 50+ farms -> zoom to 10
    large: 12,   // 20+ farms -> zoom to 12
    medium: 13,  // 10+ farms -> zoom to 13
    small: 14,   // 5+ farms -> zoom to 14
    tiny: 15,    // 2+ farms -> zoom to 15
  } as Record<ClusterTier['name'], number>,

  // Maximum zoom to prevent over-zooming
  MAX_ZOOM: 16,
}

/**
 * Get target zoom level for a cluster
 */
export function getClusterTargetZoom(count: number): number {
  const tier = getClusterTier(count)
  return CLUSTER_ZOOM_THRESHOLDS.ZOOM_TARGETS[tier.name]
}
