'use client'

import React, { useEffect, useRef, useCallback, memo } from 'react'
import { Marker, Map as MapLibreMapInstance } from 'maplibre-gl'
import { FarmCluster } from '@/features/map/hooks/useClusteredMarkers'
import {
  generateClusterSVG,
  CLUSTER_EASING,
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
// COMPONENT
// =============================================================================

/**
 * Cluster Marker Component for MapLibre GL
 *
 * Renders a Field Edition rounded-square cluster (rx=8) over a single Hedgerow
 * brand colour with per-tier fill-opacity. Hover scale and active press feedback
 * are CSS-driven (see map.css .cluster-marker rules).
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

    const { svg, width, height } = generateClusterSVG(count, zoom)
    elementRef.current.innerHTML = svg
    elementRef.current.style.width = `${width}px`
    elementRef.current.style.height = `${height}px`
    elementRef.current.style.marginLeft = `-${width / 2}px`
    elementRef.current.style.marginTop = `-${height / 2}px`

    // Hover scale is CSS-driven (.cluster-marker:hover in map.css) so we only
    // toggle z-index and a data attribute for state targeting.
    elementRef.current.dataset.hovered = hovered ? 'true' : 'false'
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
