'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  Layers,
  Compass,
} from 'lucide-react'
import type { Map as MapLibreMap } from 'maplibre-gl'

interface MapControlsProps {
  /** MapLibre map instance */
  map: MapLibreMap | null
  /** Current map style id */
  currentStyle?: string
  /** Available map styles */
  styles?: Array<{
    id: string
    name: string
    url: string
    icon?: 'streets' | 'satellite' | 'terrain' | 'light' | 'dark'
  }>
  /** Callback when style changes */
  onStyleChange?: (styleId: string, styleUrl: string) => void
  /** Show zoom controls (default: true) */
  showZoom?: boolean
  /** Show fullscreen toggle (default: true) */
  showFullscreen?: boolean
  /** Show style switcher (default: true) */
  showStyleSwitcher?: boolean
  /** Show compass/north (default: true) */
  showCompass?: boolean
  /** Position on map */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Additional className */
  className?: string
}

// Default map styles (free tier providers)
const DEFAULT_STYLES = [
  {
    id: 'streets',
    name: 'Streets',
    url: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
    icon: 'streets' as const,
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://tiles.stadiamaps.com/styles/alidade_satellite.json',
    icon: 'satellite' as const,
  },
  {
    id: 'outdoors',
    name: 'Outdoors',
    url: 'https://tiles.stadiamaps.com/styles/outdoors.json',
    icon: 'terrain' as const,
  },
]

/**
 * MapControls - Accessible map control buttons
 *
 * Features:
 * - Zoom in/out with keyboard support
 * - Fullscreen toggle
 * - Map style switcher
 * - Compass/reset north
 * - WCAG AA accessible
 */
export default function MapControls({
  map,
  currentStyle = 'streets',
  styles = DEFAULT_STYLES,
  onStyleChange,
  showZoom = true,
  showFullscreen = true,
  showStyleSwitcher = true,
  showCompass = true,
  position = 'top-right',
  className = '',
}: MapControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showStyles, setShowStyles] = useState(false)
  const [bearing, setBearing] = useState(0)

  // Track map rotation
  useEffect(() => {
    if (!map) return

    const updateBearing = () => {
      setBearing(map.getBearing())
    }

    map.on('rotate', updateBearing)
    return () => {
      map.off('rotate', updateBearing)
    }
  }, [map])

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleZoomIn = useCallback(() => {
    if (!map) return
    map.zoomIn({ duration: 300 })
  }, [map])

  const handleZoomOut = useCallback(() => {
    if (!map) return
    map.zoomOut({ duration: 300 })
  }, [map])

  const handleFullscreenToggle = useCallback(async () => {
    if (!map) return

    const container = map.getContainer().closest('.map-container') || map.getContainer()

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.warn('[MapControls] Fullscreen not supported:', err)
    }
  }, [map])

  const handleStyleChange = useCallback(
    (style: (typeof styles)[0]) => {
      if (!map) return

      onStyleChange?.(style.id, style.url)
      setShowStyles(false)
    },
    [map, onStyleChange]
  )

  const handleResetNorth = useCallback(() => {
    if (!map) return
    map.easeTo({ bearing: 0, pitch: 0, duration: 500 })
  }, [map])

  // Keyboard handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        action()
      }
    },
    []
  )

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  // Button styles
  const buttonClass = `
    flex items-center justify-center
    w-10 h-10
    bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
    border border-zinc-200 dark:border-white/10
    text-zinc-700 dark:text-zinc-300
    hover:bg-white dark:hover:bg-zinc-800
    hover:text-zinc-900 dark:hover:text-white
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  `

  const getStyleIcon = (iconType: string) => {
    switch (iconType) {
      case 'streets':
        return <MapIcon className="w-4 h-4" />
      case 'satellite':
        return <Layers className="w-4 h-4" />
      case 'terrain':
        return <MapIcon className="w-4 h-4" />
      default:
        return <MapIcon className="w-4 h-4" />
    }
  }

  return (
    <div className={`absolute ${positionClasses[position]} z-10 ${className}`}>
      <div className="flex flex-col gap-2">
        {/* Zoom Controls */}
        {showZoom && (
          <div className="flex flex-col rounded-lg overflow-hidden shadow-lg">
            <button
              onClick={handleZoomIn}
              onKeyDown={(e) => handleKeyDown(e, handleZoomIn)}
              disabled={!map}
              className={`${buttonClass} rounded-t-lg rounded-b-none border-b-0`}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              onKeyDown={(e) => handleKeyDown(e, handleZoomOut)}
              disabled={!map}
              className={`${buttonClass} rounded-b-lg rounded-t-none`}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Compass / Reset North */}
        {showCompass && bearing !== 0 && (
          <button
            onClick={handleResetNorth}
            onKeyDown={(e) => handleKeyDown(e, handleResetNorth)}
            disabled={!map}
            className={`${buttonClass} rounded-lg shadow-lg`}
            style={{ transform: `rotate(${-bearing}deg)` }}
            aria-label="Reset north"
            title="Reset to north"
          >
            <Compass className="w-5 h-5" />
          </button>
        )}

        {/* Fullscreen Toggle */}
        {showFullscreen && (
          <button
            onClick={handleFullscreenToggle}
            onKeyDown={(e) => handleKeyDown(e, handleFullscreenToggle)}
            disabled={!map}
            className={`${buttonClass} rounded-lg shadow-lg`}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Style Switcher */}
        {showStyleSwitcher && styles.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowStyles(!showStyles)}
              onKeyDown={(e) => handleKeyDown(e, () => setShowStyles(!showStyles))}
              disabled={!map}
              className={`${buttonClass} rounded-lg shadow-lg`}
              aria-label="Change map style"
              aria-expanded={showStyles}
              aria-haspopup="listbox"
              title="Map style"
            >
              <Layers className="w-5 h-5" />
            </button>

            {/* Style dropdown */}
            {showStyles && (
              <div
                className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden"
                role="listbox"
              >
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleChange(style)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      text-left text-sm
                      hover:bg-zinc-50 dark:hover:bg-zinc-700
                      transition-colors
                      ${currentStyle === style.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}
                    `}
                    role="option"
                    aria-selected={currentStyle === style.id}
                  >
                    {style.icon && getStyleIcon(style.icon)}
                    <span className="font-medium">{style.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
