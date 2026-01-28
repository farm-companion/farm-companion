'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'

interface ScaleBarProps {
  /** MapLibre map instance */
  map: MapLibreMap | null
  /** Maximum width in pixels (default: 100) */
  maxWidth?: number
  /** Unit system (default: 'metric') */
  unit?: 'metric' | 'imperial' | 'nautical'
  /** Position on map */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Additional className */
  className?: string
}

// Scale bar step values for clean numbers
const METRIC_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
const IMPERIAL_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5280, 10560, 26400, 52800]
const NAUTICAL_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 6076, 12152, 30380, 60760]

/**
 * ScaleBar - Map scale indicator
 *
 * Features:
 * - Dynamic scale based on zoom and latitude
 * - Metric, imperial, and nautical units
 * - Clean rounded values
 * - Updates on zoom/move
 */
export default function ScaleBar({
  map,
  maxWidth = 100,
  unit = 'metric',
  position = 'bottom-left',
  className = '',
}: ScaleBarProps) {
  const [scale, setScale] = useState<{ width: number; label: string } | null>(null)

  // Calculate scale bar
  const updateScale = useCallback(() => {
    if (!map) return

    const center = map.getCenter()
    const zoom = map.getZoom()

    // Calculate meters per pixel at current latitude and zoom
    // Formula: metersPerPixel = 156543.03 * cos(lat) / 2^zoom
    const metersPerPixel =
      (156543.03 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, zoom)

    // Calculate max distance that fits in maxWidth
    const maxMeters = maxWidth * metersPerPixel

    // Get appropriate step values
    let steps: number[]
    let conversionFactor: number

    switch (unit) {
      case 'imperial':
        steps = IMPERIAL_STEPS
        conversionFactor = 0.3048 // feet to meters
        break
      case 'nautical':
        steps = NAUTICAL_STEPS
        conversionFactor = 0.3048 // feet to meters (nautical miles = 6076 feet)
        break
      default:
        steps = METRIC_STEPS
        conversionFactor = 1 // already meters
    }

    // Convert max distance to target unit
    const maxDistance = maxMeters / conversionFactor

    // Find best step
    let bestStep = steps[0]
    for (const step of steps) {
      if (step <= maxDistance) {
        bestStep = step
      } else {
        break
      }
    }

    // Calculate bar width
    const barWidthMeters = bestStep * conversionFactor
    const barWidth = barWidthMeters / metersPerPixel

    // Format label
    let label: string
    switch (unit) {
      case 'imperial':
        if (bestStep >= 5280) {
          label = `${(bestStep / 5280).toFixed(bestStep % 5280 === 0 ? 0 : 1)} mi`
        } else {
          label = `${bestStep} ft`
        }
        break
      case 'nautical':
        if (bestStep >= 6076) {
          label = `${(bestStep / 6076).toFixed(bestStep % 6076 === 0 ? 0 : 1)} nm`
        } else {
          label = `${bestStep} ft`
        }
        break
      default:
        if (bestStep >= 1000) {
          label = `${bestStep / 1000} km`
        } else {
          label = `${bestStep} m`
        }
    }

    setScale({ width: Math.round(barWidth), label })
  }, [map, maxWidth, unit])

  // Update on map events
  useEffect(() => {
    if (!map) return

    updateScale()

    map.on('zoom', updateScale)
    map.on('move', updateScale)

    return () => {
      map.off('zoom', updateScale)
      map.off('move', updateScale)
    }
  }, [map, updateScale])

  if (!scale) return null

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div
      className={`absolute ${positionClasses[position]} z-10 ${className}`}
      role="img"
      aria-label={`Scale: ${scale.label}`}
    >
      <div className="flex flex-col items-start">
        {/* Scale label */}
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-0.5 px-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded">
          {scale.label}
        </span>

        {/* Scale bar */}
        <div
          className="h-1.5 bg-zinc-800 dark:bg-white border-l-2 border-r-2 border-zinc-800 dark:border-white"
          style={{ width: `${scale.width}px` }}
        />
      </div>
    </div>
  )
}
