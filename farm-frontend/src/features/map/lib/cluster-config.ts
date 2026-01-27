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

  // Animation styles for smooth appearance and pulse
  const animationStyles = `
    <style>
      @keyframes clusterAppear {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes clusterPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .cluster-group {
        animation: clusterAppear 0.3s ${CLUSTER_EASING.APPEAR} forwards;
        transform-origin: center;
      }
      ${tier.pulseAnimation ? `
      .cluster-circle {
        animation: clusterPulse 2s ease-in-out infinite;
        transform-origin: center;
      }
      ` : ''}
    </style>
  `

  // Glow filter for mega clusters
  const glowFilter = tier.pulseAnimation ? `
    <filter id="glow-${tier.name}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  ` : ''

  const filterAttr = tier.pulseAnimation ? `filter="url(#glow-${tier.name})"` : ''

  // Create gradient for depth effect with animation
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${animationStyles}
      <defs>
        ${glowFilter}
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${tier.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(tier.color, -20)};stop-opacity:1" />
        </linearGradient>
      </defs>
      <g class="cluster-group">
        <circle
          class="cluster-circle"
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
      </g>
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
