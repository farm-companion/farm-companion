'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Map as MapLibreMapInstance } from 'maplibre-gl'
import { FarmShop } from '@/types/farm'

// =============================================================================
// TYPES
// =============================================================================

export interface UseMarkerKeyboardNavOptions {
  /** Enable keyboard navigation (default: true) */
  enabled?: boolean
  /** Wrap around when reaching end of list (default: true) */
  wrapAround?: boolean
  /** Fly to selected marker (default: true) */
  flyToOnSelect?: boolean
  /** Fly to zoom level (default: 14) */
  flyToZoom?: number
}

export interface UseMarkerKeyboardNavResult {
  /** Currently selected farm index */
  selectedIndex: number
  /** Select next marker */
  selectNext: () => void
  /** Select previous marker */
  selectPrevious: () => void
  /** Select marker at specific index */
  selectAt: (index: number) => void
  /** Clear selection */
  clearSelection: () => void
  /** Register keyboard event handlers on container */
  getKeyboardProps: () => {
    onKeyDown: (e: React.KeyboardEvent) => void
    tabIndex: number
    role: string
    'aria-label': string
  }
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * useMarkerKeyboardNav - Keyboard navigation for map markers
 *
 * Enables arrow key navigation between farm markers on the map.
 * Features:
 * - Arrow keys (Up/Down or Left/Right) to navigate
 * - Enter/Space to confirm selection
 * - Escape to clear selection
 * - Automatic map centering on selected marker
 * - Wrap-around navigation option
 * - Accessible ARIA attributes
 *
 * @example
 * ```tsx
 * const {
 *   selectedIndex,
 *   selectNext,
 *   selectPrevious,
 *   getKeyboardProps,
 * } = useMarkerKeyboardNav({
 *   farms,
 *   map,
 *   selectedFarmId,
 *   onSelectFarm,
 * })
 *
 * return (
 *   <div {...getKeyboardProps()}>
 *     <MapLibreMap ... />
 *   </div>
 * )
 * ```
 */
export function useMarkerKeyboardNav(
  farms: FarmShop[],
  map: MapLibreMapInstance | null,
  selectedFarmId: string | null,
  onSelectFarm: (farm: FarmShop | null) => void,
  options: UseMarkerKeyboardNavOptions = {}
): UseMarkerKeyboardNavResult {
  const {
    enabled = true,
    wrapAround = true,
    flyToOnSelect = true,
    flyToZoom = 14,
  } = options

  const prefersReducedMotionRef = useRef(false)

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotionRef.current = mediaQuery.matches

      const handler = (e: MediaQueryListEvent) => {
        prefersReducedMotionRef.current = e.matches
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Find current selected index
  const selectedIndex = selectedFarmId
    ? farms.findIndex((f) => f.id === selectedFarmId)
    : -1

  // Navigate to marker and optionally fly to it
  const navigateToFarm = useCallback(
    (farm: FarmShop | null) => {
      onSelectFarm(farm)

      if (farm && map && flyToOnSelect && farm.location?.lat && farm.location?.lng) {
        const options = {
          center: [farm.location.lng, farm.location.lat] as [number, number],
          zoom: Math.max(map.getZoom(), flyToZoom),
          duration: prefersReducedMotionRef.current ? 0 : 800,
        }
        map.flyTo(options)

        // After flying, focus the marker element for screen readers
        requestAnimationFrame(() => {
          const markerEl = document.querySelector(`[data-farm-id="${farm.id}"]`) as HTMLElement
          if (markerEl) {
            markerEl.focus()
          }
        })
      }
    },
    [map, onSelectFarm, flyToOnSelect, flyToZoom]
  )

  // Select next marker
  const selectNext = useCallback(() => {
    if (!enabled || farms.length === 0) return

    let nextIndex: number
    if (selectedIndex === -1) {
      nextIndex = 0
    } else if (selectedIndex >= farms.length - 1) {
      nextIndex = wrapAround ? 0 : farms.length - 1
    } else {
      nextIndex = selectedIndex + 1
    }

    navigateToFarm(farms[nextIndex])
  }, [enabled, farms, selectedIndex, wrapAround, navigateToFarm])

  // Select previous marker
  const selectPrevious = useCallback(() => {
    if (!enabled || farms.length === 0) return

    let prevIndex: number
    if (selectedIndex === -1) {
      prevIndex = farms.length - 1
    } else if (selectedIndex <= 0) {
      prevIndex = wrapAround ? farms.length - 1 : 0
    } else {
      prevIndex = selectedIndex - 1
    }

    navigateToFarm(farms[prevIndex])
  }, [enabled, farms, selectedIndex, wrapAround, navigateToFarm])

  // Select at specific index
  const selectAt = useCallback(
    (index: number) => {
      if (!enabled || index < 0 || index >= farms.length) return
      navigateToFarm(farms[index])
    },
    [enabled, farms, navigateToFarm]
  )

  // Clear selection
  const clearSelection = useCallback(() => {
    onSelectFarm(null)
  }, [onSelectFarm])

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
        case 'j': // Vim-style navigation
          e.preventDefault()
          selectNext()
          break

        case 'ArrowUp':
        case 'ArrowLeft':
        case 'k': // Vim-style navigation
          e.preventDefault()
          selectPrevious()
          break

        case 'Home':
          e.preventDefault()
          if (farms.length > 0) {
            navigateToFarm(farms[0])
          }
          break

        case 'End':
          e.preventDefault()
          if (farms.length > 0) {
            navigateToFarm(farms[farms.length - 1])
          }
          break

        case 'Escape':
          e.preventDefault()
          clearSelection()
          break

        // Number keys 1-9 for quick selection
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          {
            const index = parseInt(e.key, 10) - 1
            if (index < farms.length) {
              e.preventDefault()
              selectAt(index)
            }
          }
          break
      }
    },
    [enabled, selectNext, selectPrevious, navigateToFarm, clearSelection, selectAt, farms]
  )

  // Get props for keyboard-navigable container
  const getKeyboardProps = useCallback(
    () => ({
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      role: 'application',
      'aria-label': `Map with ${farms.length} farm locations. Use arrow keys to navigate between markers.`,
    }),
    [handleKeyDown, farms.length]
  )

  return {
    selectedIndex,
    selectNext,
    selectPrevious,
    selectAt,
    clearSelection,
    getKeyboardProps,
  }
}

export default useMarkerKeyboardNav
