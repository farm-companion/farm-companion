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
  APPEAR: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Slightly bouncy
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
  color: string
  borderWidth: number
  pulseAnimation: boolean
}

// 5-tier cluster hierarchy -- brand green (#2D5016) palette
export const CLUSTER_TIERS: ClusterTier[] = [
  { name: 'mega', minCount: 50, baseSize: 64, fontSize: 16, color: '#1A3A0A', borderWidth: 0, pulseAnimation: true },
  { name: 'large', minCount: 20, baseSize: 56, fontSize: 15, color: '#234012', borderWidth: 0, pulseAnimation: false },
  { name: 'medium', minCount: 10, baseSize: 48, fontSize: 14, color: '#2D5016', borderWidth: 0, pulseAnimation: false },
  { name: 'small', minCount: 5, baseSize: 40, fontSize: 14, color: '#3A6420', borderWidth: 0, pulseAnimation: false },
  { name: 'tiny', minCount: 2, baseSize: 32, fontSize: 13, color: '#4A7A2E', borderWidth: 0, pulseAnimation: false },
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
 * Generate cluster SVG with rounded-rectangle shape and brand green palette.
 * Shape: pill/rounded-rect instead of circle for modern look.
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

  // Dynamic width based on text length
  const charWidth = tier.fontSize * 0.65
  const textWidth = displayText.length * charWidth
  const padding = 20
  const height = getZoomAwareSize(tier.baseSize * 0.55, zoom)
  const minWidth = getZoomAwareSize(count < 10 ? 28 : count < 100 ? 36 : 44, zoom)
  const width = Math.max(minWidth, textWidth + padding)
  const rx = 8 // border-radius

  const anchor = height / 2
  const textY = height / 2 + tier.fontSize * 0.35

  const animationStyles = `
    <style>
      @keyframes clusterAppear {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      ${tier.pulseAnimation ? `
      @keyframes clusterPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.85; }
      }
      .cluster-rect { animation: clusterPulse 2.5s ease-in-out infinite; }
      ` : ''}
      .cluster-group {
        animation: clusterAppear 0.3s ${CLUSTER_EASING.APPEAR} forwards;
        transform-origin: center;
      }
    </style>
  `

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${animationStyles}
      <defs>
        <filter id="cs" x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.2"/>
        </filter>
      </defs>
      <g class="cluster-group" filter="url(#cs)">
        <rect
          class="cluster-rect"
          x="0" y="0"
          width="${width}" height="${height}"
          rx="${rx}" ry="${rx}"
          fill="${tier.color}"
        />
        <text
          x="${width / 2}"
          y="${textY}"
          text-anchor="middle"
          fill="white"
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
      const { svg, width, height, anchor } = generateClusterSVG(count, zoom)
      const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

      return new google.maps.Marker({
        position,
        icon: {
          url: svgUrl,
          scaledSize: new google.maps.Size(width, height),
          anchor: new google.maps.Point(width / 2, anchor),
        },
        zIndex: google.maps.Marker.MAX_ZINDEX + 2,
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

/**
 * Smooth zoom animation to target level
 * Uses eased interpolation for natural feel
 */
export function animateZoomTo(
  map: google.maps.Map,
  targetZoom: number,
  targetCenter?: google.maps.LatLng,
  duration: number = CLUSTER_EASING.DURATION.ZOOM
): Promise<void> {
  return new Promise((resolve) => {
    const startZoom = map.getZoom() || 10
    const startCenter = map.getCenter()
    const startTime = performance.now()

    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      // Interpolate zoom
      const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress
      map.setZoom(currentZoom)

      // Interpolate center if provided
      if (targetCenter && startCenter) {
        const lat = startCenter.lat() + (targetCenter.lat() - startCenter.lat()) * easedProgress
        const lng = startCenter.lng() + (targetCenter.lng() - startCenter.lng()) * easedProgress
        map.setCenter(new google.maps.LatLng(lat, lng))
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(animate)
  })
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
