'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Map as MapLibreMapInstance } from 'maplibre-gl'
import { FarmShop } from '@/types/farm'

// =============================================================================
// TYPES
// =============================================================================

export interface UseMarkerKeyboardNavOptions {
  /** MapLibre map instance */
  map: MapLibreMapInstance | null
  /** Array of visible farms (in current viewport) */
  visibleFarms: FarmShop[]
  /** Currently selected farm ID */
  selectedFarmId?: string | null
  /** Callback when a farm is selected via keyboard */
  onSelect: (farm: FarmShop) => void
  /** Callback when selection is cleared (Escape) */
  onClear?: () => void
  /** Whether keyboard navigation is enabled */
  enabled?: boolean
  /** Navigate to farm location when selected */
  panOnSelect?: boolean
  /** Wrap around when reaching the end of the list */
  wrapAround?: boolean
}

export interface UseMarkerKeyboardNavResult {
  /** Index of currently focused farm (-1 if none) */
  focusedIndex: number
  /** Currently focused farm */
  focusedFarm: FarmShop | null
  /** Focus the next farm in the list */
  focusNext: () => void
  /** Focus the previous farm in the list */
  focusPrevious: () => void
  /** Focus a specific farm by ID */
  focusFarm: (farmId: string) => void
  /** Clear focus */
  clearFocus: () => void
  /** Select the currently focused farm */
  selectFocused: () => void
  /** Announce current focus for screen readers */
  announcement: string | null
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Keyboard Navigation Hook for Farm Markers
 *
 * Enables accessible keyboard navigation through farm markers on the map.
 *
 * Key bindings:
 * - Arrow Down / Right: Focus next farm
 * - Arrow Up / Left: Focus previous farm
 * - Enter / Space: Select focused farm
 * - Escape: Clear selection
 * - Home: Focus first farm
 * - End: Focus last farm
 *
 * @example
 * ```tsx
 * const {
 *   focusedFarm,
 *   announcement,
 * } = useMarkerKeyboardNav({
 *   map: mapInstance,
 *   visibleFarms: farms,
 *   selectedFarmId,
 *   onSelect: (farm) => setSelectedFarm(farm),
 *   onClear: () => setSelectedFarm(null),
 * })
 * ```
 */
export function useMarkerKeyboardNav({
  map,
  visibleFarms,
  selectedFarmId,
  onSelect,
  onClear,
  enabled = true,
  panOnSelect = true,
  wrapAround = true,
}: UseMarkerKeyboardNavOptions): UseMarkerKeyboardNavResult {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get focused farm
  const focusedFarm = focusedIndex >= 0 && focusedIndex < visibleFarms.length
    ? visibleFarms[focusedIndex]
    : null

  // Clear announcement after delay
  const announce = useCallback((message: string) => {
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current)
    }
    setAnnouncement(message)
    announcementTimeoutRef.current = setTimeout(() => {
      setAnnouncement(null)
    }, 3000)
  }, [])

  // Focus next farm
  const focusNext = useCallback(() => {
    if (visibleFarms.length === 0) return

    setFocusedIndex((prev) => {
      const next = prev + 1
      if (next >= visibleFarms.length) {
        if (wrapAround) {
          announce(`${visibleFarms[0].name}, 1 of ${visibleFarms.length}`)
          return 0
        }
        announce('End of farms list')
        return prev
      }
      announce(`${visibleFarms[next].name}, ${next + 1} of ${visibleFarms.length}`)
      return next
    })
  }, [visibleFarms, wrapAround, announce])

  // Focus previous farm
  const focusPrevious = useCallback(() => {
    if (visibleFarms.length === 0) return

    setFocusedIndex((prev) => {
      const next = prev - 1
      if (next < 0) {
        if (wrapAround) {
          const lastIndex = visibleFarms.length - 1
          announce(`${visibleFarms[lastIndex].name}, ${visibleFarms.length} of ${visibleFarms.length}`)
          return lastIndex
        }
        announce('Beginning of farms list')
        return prev < 0 ? 0 : prev
      }
      announce(`${visibleFarms[next].name}, ${next + 1} of ${visibleFarms.length}`)
      return next
    })
  }, [visibleFarms, wrapAround, announce])

  // Focus specific farm
  const focusFarm = useCallback((farmId: string) => {
    const index = visibleFarms.findIndex((f) => f.id === farmId)
    if (index >= 0) {
      setFocusedIndex(index)
      announce(`${visibleFarms[index].name}, ${index + 1} of ${visibleFarms.length}`)
    }
  }, [visibleFarms, announce])

  // Clear focus
  const clearFocus = useCallback(() => {
    setFocusedIndex(-1)
    setAnnouncement(null)
  }, [])

  // Select focused farm
  const selectFocused = useCallback(() => {
    if (focusedFarm) {
      onSelect(focusedFarm)

      // Pan map to farm
      if (panOnSelect && map && focusedFarm.location?.lat && focusedFarm.location?.lng) {
        map.easeTo({
          center: [focusedFarm.location.lng, focusedFarm.location.lat],
          duration: 300,
        })
      }

      announce(`${focusedFarm.name} selected`)
    }
  }, [focusedFarm, onSelect, panOnSelect, map, announce])

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          focusNext()
          break

        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          focusPrevious()
          break

        case 'Enter':
        case ' ':
          if (focusedFarm) {
            e.preventDefault()
            selectFocused()
          }
          break

        case 'Escape':
          e.preventDefault()
          clearFocus()
          onClear?.()
          break

        case 'Home':
          e.preventDefault()
          if (visibleFarms.length > 0) {
            setFocusedIndex(0)
            announce(`${visibleFarms[0].name}, 1 of ${visibleFarms.length}`)
          }
          break

        case 'End':
          e.preventDefault()
          if (visibleFarms.length > 0) {
            const lastIndex = visibleFarms.length - 1
            setFocusedIndex(lastIndex)
            announce(`${visibleFarms[lastIndex].name}, ${visibleFarms.length} of ${visibleFarms.length}`)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    focusNext,
    focusPrevious,
    focusedFarm,
    selectFocused,
    clearFocus,
    onClear,
    visibleFarms,
    announce,
  ])

  // Sync focused index with selected farm
  useEffect(() => {
    if (selectedFarmId) {
      const index = visibleFarms.findIndex((f) => f.id === selectedFarmId)
      if (index >= 0 && index !== focusedIndex) {
        setFocusedIndex(index)
      }
    }
  }, [selectedFarmId, visibleFarms, focusedIndex])

  // Reset focus when visible farms change significantly
  useEffect(() => {
    // If focused farm is no longer in list, clear focus
    if (focusedIndex >= 0 && focusedIndex >= visibleFarms.length) {
      clearFocus()
    }
  }, [visibleFarms.length, focusedIndex, clearFocus])

  // Cleanup announcement timeout
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current)
      }
    }
  }, [])

  return {
    focusedIndex,
    focusedFarm,
    focusNext,
    focusPrevious,
    focusFarm,
    clearFocus,
    selectFocused,
    announcement,
  }
}

// =============================================================================
// SCREEN READER ANNOUNCER COMPONENT
// =============================================================================

export interface MarkerAnnouncerProps {
  /** Announcement text to speak */
  announcement: string | null
  /** Politeness level */
  politeness?: 'polite' | 'assertive'
}

/**
 * Screen Reader Announcer
 *
 * Visually hidden live region for announcing focus changes to screen readers.
 *
 * @example
 * ```tsx
 * <MarkerAnnouncer announcement={announcement} />
 * ```
 */
export function MarkerAnnouncer({
  announcement,
  politeness = 'polite',
}: MarkerAnnouncerProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

export default useMarkerKeyboardNav
