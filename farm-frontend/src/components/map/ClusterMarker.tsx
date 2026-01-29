'use client'

import React, { useEffect, useRef, useCallback, memo } from 'react'
import { Marker, Map as MapLibreMapInstance } from 'maplibre-gl'
import { FarmCluster } from '@/features/map/hooks/useClusteredMarkers'
import {
  getClusterTier,
  getZoomAwareSize,
  CLUSTER_EASING,
  CLUSTER_ZOOM_THRESHOLDS,
} from '@/features/map/lib/cluster-config'

// =============================================================================
// TYPES
// =============================================================================

export interface ClusterMarkerProps {
  /** Cluster feature from Supercluster */
  cluster: FarmCluster
  /** MapLibre map instance */
  map: MapLibreMapInstance
  /** Current zoom level for size calculation */
  zoom: number
  /** Callback when cluster is clicked */
  onClick?: (clusterId: number, coordinates: [number, number], count: number) => void
  /** Callback when cluster is hovered */
  onHover?: (clusterId: number | null) => void
  /** Whether this cluster is currently hovered */
  hovered?: boolean
}

interface MarkerElement extends HTMLDivElement {
  _clusterId?: number
}

// =============================================================================
// SVG GENERATION
// =============================================================================

/**
 * Generate cluster marker SVG
 */
function generateClusterSVG(
  count: number,
  zoom: number,
  isHovered: boolean
): { svg: string; size: number } {
  const tier = getClusterTier(count)
  const baseSize = getZoomAwareSize(tier.baseSize, zoom)
  const size = isHovered ? Math.round(baseSize * 1.1) : baseSize
  const radius = (size / 2) - tier.borderWidth
  const center = size / 2
  const textY = center + (tier.fontSize / 3)

  // Gradient for depth effect
  const gradientId = `cluster-${tier.name}-${count}`
  const darkerColor = adjustColor(tier.color, -20)

  // Format count (99+ for large numbers)
  const displayCount = count >= 100 ? '99+' : String(count)

  // Glow filter for mega clusters or hovered state
  const showGlow = tier.pulseAnimation || isHovered
  const glowFilter = showGlow ? `
    <filter id="glow-${gradientId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  ` : ''

  const filterAttr = showGlow ? `filter="url(#glow-${gradientId})"` : ''

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${glowFilter}
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${tier.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${darkerColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="url(#${gradientId})"
        stroke="white"
        stroke-width="${tier.borderWidth}"
        ${filterAttr}
      />
      <text
        x="${center}"
        y="${textY}"
        text-anchor="middle"
        fill="white"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${tier.fontSize}"
        font-weight="600"
      >${displayCount}</text>
    </svg>
  `.trim()

  return { svg, size }
}

/**
 * Adjust hex color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Cluster Marker Component for MapLibre GL
 *
 * Renders a cluster marker with:
 * - 5-tier visual hierarchy based on farm count
 * - Zoom-aware sizing
 * - Hover effects with glow
 * - Accessible keyboard navigation
 * - Smooth animations via CSS
 *
 * @example
 * ```tsx
 * <ClusterMarker
 *   cluster={clusterFeature}
 *   map={mapInstance}
 *   zoom={currentZoom}
 *   onClick={(clusterId, coords, count) => expandCluster(clusterId)}
 *   onHover={(clusterId) => setHoveredCluster(clusterId)}
 * />
 * ```
 */
export const ClusterMarker = memo(function ClusterMarker({
  cluster,
  map,
  zoom,
  onClick,
  onHover,
  hovered = false,
}: ClusterMarkerProps) {
  const markerRef = useRef<Marker | null>(null)
  const elementRef = useRef<MarkerElement | null>(null)

  const clusterId = cluster.properties.cluster_id
  const count = cluster.properties.point_count
  const [lng, lat] = cluster.geometry.coordinates

  // Update marker SVG when state changes
  const updateMarker = useCallback(() => {
    if (!elementRef.current) return

    const { svg, size } = generateClusterSVG(count, zoom, hovered)
    elementRef.current.innerHTML = svg
    elementRef.current.style.width = `${size}px`
    elementRef.current.style.height = `${size}px`
    elementRef.current.style.marginLeft = `-${size / 2}px`
    elementRef.current.style.marginTop = `-${size / 2}px`

    // Z-index: hovered clusters on top
    elementRef.current.style.zIndex = hovered ? '100' : '10'
  }, [count, zoom, hovered])

  // Initialize marker
  useEffect(() => {
    if (!map) return

    // Create marker element
    const el = document.createElement('div') as MarkerElement
    el._clusterId = clusterId
    el.className = 'cluster-marker'
    el.style.cursor = 'pointer'
    el.style.transition = `transform ${CLUSTER_EASING.DURATION.HOVER}ms ${CLUSTER_EASING.HOVER}`
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', `Cluster of ${count} farm shops. Click to expand.`)
    el.setAttribute('tabindex', '0')

    elementRef.current = el

    // Create MapLibre marker
    const marker = new Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([lng, lat])
      .addTo(map)

    markerRef.current = marker

    // Event handlers
    const handleClick = (e: Event) => {
      e.stopPropagation()
      onClick?.(clusterId, [lng, lat], count)
    }

    const handleMouseEnter = () => {
      onHover?.(clusterId)
    }

    const handleMouseLeave = () => {
      onHover?.(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.(clusterId, [lng, lat], count)
      }
    }

    // Touch handlers - must capture touchstart to prevent map pan
    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onClick?.(clusterId, [lng, lat], count)
    }

    el.addEventListener('click', handleClick)
    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)
    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Initial render
    updateMarker()

    // Cleanup
    return () => {
      el.removeEventListener('click', handleClick)
      el.removeEventListener('mouseenter', handleMouseEnter)
      el.removeEventListener('mouseleave', handleMouseLeave)
      el.removeEventListener('keydown', handleKeyDown)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
      marker.remove()
      markerRef.current = null
      elementRef.current = null
    }
  }, [map, clusterId, lng, lat, count, onClick, onHover])

  // Update visual state when zoom or hover changes
  useEffect(() => {
    updateMarker()
  }, [updateMarker])

  // Update aria-label when count changes
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.setAttribute(
        'aria-label',
        `Cluster of ${count} farm shops. Click to expand.`
      )
    }
  }, [count])

  // This component manages a MapLibre Marker imperatively
  return null
})

// =============================================================================
// CLUSTER LAYER COMPONENT
// =============================================================================

export interface ClusterMarkerLayerProps {
  /** Array of cluster features */
  clusters: FarmCluster[]
  /** MapLibre map instance */
  map: MapLibreMapInstance | null
  /** Current zoom level */
  zoom: number
  /** Currently hovered cluster ID */
  hoveredClusterId?: number | null
  /** Callback when a cluster is clicked */
  onClusterClick?: (clusterId: number, coordinates: [number, number], count: number) => void
  /** Callback when a cluster is hovered */
  onClusterHover?: (clusterId: number | null) => void
}

/**
 * Cluster Marker Layer
 *
 * Manages a collection of ClusterMarker components for efficient rendering.
 * Handles hover state propagation.
 */
export function ClusterMarkerLayer({
  clusters,
  map,
  zoom,
  hoveredClusterId,
  onClusterClick,
  onClusterHover,
}: ClusterMarkerLayerProps) {
  if (!map) return null

  return (
    <>
      {clusters.map((cluster) => (
        <ClusterMarker
          key={`cluster-${cluster.properties.cluster_id}`}
          cluster={cluster}
          map={map}
          zoom={zoom}
          hovered={hoveredClusterId === cluster.properties.cluster_id}
          onClick={onClusterClick}
          onHover={onClusterHover}
        />
      ))}
    </>
  )
}

export default ClusterMarker
