'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, Compass, Locate, LocateFixed, LocateOff, Loader2 } from 'lucide-react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { computeScaleBar, type ScaleBarResult } from '../lib/scale'
import { getAnimationDuration } from '../lib/accessibility'
import type { UseMapLocationResult } from '../hooks/useMapLocation'

interface MapControlClusterProps {
  /** MapLibre map instance */
  map: MapLibreMap
  /** Location state + actions (owned by the shell's useMapLocation call) */
  location: UseMapLocationResult
  /** Pixels between cluster and viewport bottom (lifts above the mobile sheet) */
  bottomOffset: number
  /** Pixels between cluster and viewport right (clears the desktop panel) */
  rightOffset: number
}

// One skin for every button in the cluster: Pitti surface, ink icon, brand
// focus ring, 44px touch target (px, not rem: the 14px root font would
// shrink w-11 to 38.5px).
const clusterButton = `
  flex items-center justify-center w-[44px] h-[44px]
  bg-surface text-ink
  hover:bg-surface-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-150
  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset
`

/**
 * MapControlCluster - the single bottom-right map control surface (Komoot S3).
 *
 * One vertical stack: compass (only when rotated), locate, zoom segment,
 * scale bar. Replaces MapControls + LocationControl + ScaleBar.
 */
export default function MapControlCluster({
  map,
  location,
  bottomOffset,
  rightOffset,
}: MapControlClusterProps) {
  const [bearing, setBearing] = useState(0)
  const [scale, setScale] = useState<ScaleBarResult | null>(null)

  // Track rotation for the compass and viewport for the scale bar.
  useEffect(() => {
    const updateBearing = () => setBearing(map.getBearing())
    const updateScale = () => setScale(computeScaleBar(map.getCenter().lat, map.getZoom()))

    updateBearing()
    updateScale()

    map.on('rotate', updateBearing)
    map.on('move', updateScale)
    map.on('zoom', updateScale)
    return () => {
      map.off('rotate', updateBearing)
      map.off('move', updateScale)
      map.off('zoom', updateScale)
    }
  }, [map])

  const handleZoomIn = useCallback(() => {
    map.zoomIn({ duration: getAnimationDuration(300) })
  }, [map])

  const handleZoomOut = useCallback(() => {
    map.zoomOut({ duration: getAnimationDuration(300) })
  }, [map])

  const handleResetNorth = useCallback(() => {
    map.easeTo({ bearing: 0, pitch: 0, duration: getAnimationDuration(500) })
  }, [map])

  const { state, centerOnUser, refreshLocation } = location
  const handleLocate = useCallback(() => {
    if (state.lat !== null && state.lng !== null) {
      centerOnUser()
    } else {
      refreshLocation()
    }
  }, [state.lat, state.lng, centerOnUser, refreshLocation])

  const locateLabel = state.isLoading
    ? 'Getting your location'
    : state.isPermissionDenied
      ? 'Location permission denied. Enable location access in your browser settings.'
      : state.lat !== null
        ? 'Center map on your location'
        : 'Find my location'

  return (
    <div
      className="absolute z-10 flex flex-col items-end gap-2 transition-[bottom,right] duration-300 ease-out"
      style={{ bottom: bottomOffset, right: rightOffset }}
    >
      {/* Compass: only exists while the map is rotated */}
      {bearing !== 0 && (
        <button
          onClick={handleResetNorth}
          className={`${clusterButton} rounded-[2px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.15)]`}
          aria-label="Reset bearing to north"
          title="Reset to north"
        >
          <Compass className="w-5 h-5" style={{ transform: `rotate(${-bearing}deg)` }} />
        </button>
      )}

      {/* Locate */}
      <button
        onClick={handleLocate}
        disabled={state.isLoading}
        className={`${clusterButton} rounded-[2px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.15)] ${
          state.isPermissionDenied ? 'text-error' : state.lat !== null ? 'text-brand' : ''
        }`}
        aria-label={locateLabel}
        title={locateLabel}
      >
        {state.isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : state.isPermissionDenied ? (
          <LocateOff className="w-5 h-5" />
        ) : state.lat !== null ? (
          <LocateFixed className="w-5 h-5" />
        ) : (
          <Locate className="w-5 h-5" />
        )}
      </button>

      {/* Zoom segment */}
      <div className="flex flex-col rounded-[2px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden">
        <button onClick={handleZoomIn} className={clusterButton} aria-label="Zoom in" title="Zoom in">
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className={`${clusterButton} border-t border-border`}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Scale: quiet open-bottom bracket, right-aligned under the stack */}
      {scale && (
        <div role="img" aria-label={`Map scale: ${scale.label}`} className="flex flex-col items-end">
          <span className="text-[11px] leading-tight font-medium text-ink-muted [text-shadow:0_0_4px_var(--paper)]">
            {scale.label}
          </span>
          <div
            className="h-[5px] border-b border-l border-r border-ink-muted"
            style={{ width: scale.width }}
          />
        </div>
      )}
    </div>
  )
}
