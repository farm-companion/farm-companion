/**
 * Smart Cluster Configuration
 *
 * Provides zoom-aware cluster sizing with 5-tier visual hierarchy.
 * Clusters dynamically scale based on farm count and current zoom level.
 * Includes animation easing for smooth transitions.
 */

/**
 * Animation easing functions for cluster transitions
 */
export const CLUSTER_EASING = {
  // Smooth ease-out for appearing clusters
  APPEAR: 'cubic-bezier(0.22, 1, 0.36, 1)', // ease-out-quint
  // Gentle ease for zoom transitions
  ZOOM: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design standard
  // Snappy ease for hover states
  HOVER: 'cubic-bezier(0.2, 0, 0, 1)', // Fast out, slow in
  // Duration in milliseconds
  DURATION: {
    APPEAR: 300,
    ZOOM: 400,
    HOVER: 150,
  },
}

export interface ClusterTier {
  name: 'tiny' | 'small' | 'medium' | 'large' | 'mega'
  minCount: number
  baseSize: number
  fontSize: number
  /** Hedgerow fill-opacity. Denser cluster = more opaque. Single brand colour. */
  opacity: number
  borderWidth: number
}

// 5-tier cluster hierarchy — single Field Edition Hedgerow base, opacity ladder.
// Density visualised through saturation rather than hue: denser = more opaque.
export const CLUSTER_TIERS: ClusterTier[] = [
  { name: 'mega',   minCount: 50, baseSize: 64, fontSize: 16, opacity: 1.00, borderWidth: 0 },
  { name: 'large',  minCount: 20, baseSize: 56, fontSize: 15, opacity: 0.88, borderWidth: 0 },
  { name: 'medium', minCount: 10, baseSize: 48, fontSize: 14, opacity: 0.78, borderWidth: 0 },
  { name: 'small',  minCount:  5, baseSize: 40, fontSize: 14, opacity: 0.65, borderWidth: 0 },
  { name: 'tiny',   minCount:  2, baseSize: 32, fontSize: 13, opacity: 0.55, borderWidth: 0 },
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

export interface ClusterBrandStyle {
  size: number
  fill: string
  textColor: string
  borderColor: string
}

// Sea Ink density ramp: denser clusters are larger and deeper. Monochrome by
// design (replaces the old 5-hue rainbow) so the map stays calm and the
// selected Vermilion pin remains the only chromatic accent (M1 palette law).
// Paper-white text clears AA-large on every navy here.
const CLUSTER_BRAND_RAMP: Array<{ minCount: number } & ClusterBrandStyle> = [
  { minCount: 50, size: 56, fill: '#162E47', textColor: '#F4F1EA', borderColor: '#FFFFFF' },
  { minCount: 20, size: 50, fill: '#213F5C', textColor: '#F4F1EA', borderColor: '#FFFFFF' },
  { minCount: 10, size: 44, fill: '#2E4D6C', textColor: '#F4F1EA', borderColor: '#FFFFFF' },
  { minCount: 5, size: 38, fill: '#3D5C7E', textColor: '#F4F1EA', borderColor: '#FFFFFF' },
  { minCount: 0, size: 34, fill: '#4F6E90', textColor: '#F4F1EA', borderColor: '#FFFFFF' },
]

/**
 * Brand cluster style (size + Sea Ink fill + text/border) for a farm count.
 * Shared by MapLibreShell and LeafletShell so the two providers stay identical.
 */
export function getClusterBrandStyle(count: number): ClusterBrandStyle {
  const tier =
    CLUSTER_BRAND_RAMP.find((t) => count >= t.minCount) ??
    CLUSTER_BRAND_RAMP[CLUSTER_BRAND_RAMP.length - 1]
  return {
    size: tier.size,
    fill: tier.fill,
    textColor: tier.textColor,
    borderColor: tier.borderColor,
  }
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
 * Generate Field Edition cluster SVG: rounded-square (rx=8) over a single
 * Hedgerow base with per-tier fill-opacity. No gradient, no pulse, no scale(0)
 * entry — opacity-only fade.
 */
export function generateClusterSVG(count: number, zoom: number = 10): {
  svg: string
  size: number
  anchor: number
  width: number
  height: number
} {
  const tier = getClusterTier(count)
  const displayText = formatClusterCount(count)

  // Square-by-default; grow horizontally only for long text ("99+").
  const baseSize = getZoomAwareSize(tier.baseSize, zoom)
  const charWidth = tier.fontSize * 0.65
  const textWidth = displayText.length * charWidth
  const padding = 16
  const height = baseSize
  const width = Math.max(baseSize, Math.round(textWidth + padding))
  const rx = 8

  const anchor = height / 2
  const textY = height / 2 + tier.fontSize * 0.35

  const animationStyles = `
    <style>
      @keyframes clusterAppear {
        0%   { opacity: 0; }
        100% { opacity: 1; }
      }
      .cluster-group {
        animation: clusterAppear 0.2s ${CLUSTER_EASING.APPEAR} forwards;
        transform-origin: center;
      }
    </style>
  `

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${animationStyles}
      <defs>
        <filter id="cs" x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.18"/>
        </filter>
      </defs>
      <g class="cluster-group" filter="url(#cs)">
        <rect
          x="0" y="0"
          width="${width}" height="${height}"
          rx="${rx}" ry="${rx}"
          style="fill: var(--brand, #14532D); fill-opacity: ${tier.opacity};"
        />
        <text
          x="${width / 2}"
          y="${textY}"
          text-anchor="middle"
          style="fill: var(--brand-text, #FFFFFF);"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="${tier.fontSize}"
          font-weight="600"
        >${displayText}</text>
      </g>
    </svg>
  `.trim()

  return { svg, size: height, anchor, width, height }
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

/**
 * Get animation class for cluster state changes
 */
export function getClusterAnimationClass(state: 'appear' | 'hover' | 'active'): string {
  const classes = {
    appear: 'animate-cluster-appear',
    hover: 'animate-cluster-hover',
    active: 'animate-cluster-active',
  }
  return classes[state]
}

// =============================================================================
// MAPLIBRE GL ANIMATION UTILITIES
// =============================================================================

import type { Map as MapLibreMapInstance } from 'maplibre-gl'

/**
 * Smooth zoom animation to target level (MapLibre GL)
 * Uses MapLibre's built-in flyTo for smooth easing
 */
export function animateMapLibreZoomTo(
  map: MapLibreMapInstance,
  targetZoom: number,
  targetCenter?: [number, number],
  options: {
    duration?: number
    prefersReducedMotion?: boolean
  } = {}
): Promise<void> {
  const { duration = CLUSTER_EASING.DURATION.ZOOM, prefersReducedMotion = false } = options

  return new Promise((resolve) => {
    const currentCenter = map.getCenter()

    map.flyTo({
      center: targetCenter || [currentCenter.lng, currentCenter.lat],
      zoom: targetZoom,
      duration: prefersReducedMotion ? 0 : duration,
      essential: true, // Animation runs even if user has reduced motion preference (handled by prefersReducedMotion)
    })

    // Resolve after animation completes
    if (prefersReducedMotion || duration === 0) {
      resolve()
    } else {
      const onMoveEnd = () => {
        map.off('moveend', onMoveEnd)
        resolve()
      }
      map.on('moveend', onMoveEnd)
    }
  })
}

/**
 * Expand cluster with smooth animation (MapLibre GL)
 * Calculates optimal zoom and animates to reveal cluster contents
 */
export function expandClusterAnimated(
  map: MapLibreMapInstance,
  expansionZoom: number,
  clusterCenter: [number, number],
  options: {
    maxZoom?: number
    prefersReducedMotion?: boolean
  } = {}
): Promise<void> {
  const { maxZoom = CLUSTER_ZOOM_THRESHOLDS.MAX_ZOOM, prefersReducedMotion = false } = options

  const targetZoom = Math.min(expansionZoom, maxZoom)

  return animateMapLibreZoomTo(map, targetZoom, clusterCenter, {
    duration: CLUSTER_EASING.DURATION.ZOOM,
    prefersReducedMotion,
  })
}
