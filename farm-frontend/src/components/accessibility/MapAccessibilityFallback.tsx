'use client'

import { useEffect, useRef, useState } from 'react'
import type { FarmShop } from '@/types/farm'

interface MapAccessibilityFallbackProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  userLocation?: { latitude: number; longitude: number } | null
  formatDistance?: (meters: number) => string
  /** ID of the element to skip to after the map */
  skipTargetId?: string
}

/**
 * Accessible fallback for the interactive map.
 *
 * Provides:
 * - Skip link to bypass the map for keyboard users
 * - ARIA live region to announce farm count changes
 * - Screen reader accessible table of all farms
 * - Keyboard navigation with arrow keys
 *
 * WCAG 2.1 AA compliant alternative to visual map interaction.
 */
export function MapAccessibilityFallback({
  farms,
  selectedFarmId,
  onFarmSelect,
  userLocation,
  formatDistance,
  skipTargetId = 'farm-list'
}: MapAccessibilityFallbackProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const tableRef = useRef<HTMLTableElement>(null)
  const prevFarmCount = useRef(farms.length)

  // Announce farm count changes to screen readers
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (farms.length !== prevFarmCount.current) {
      const diff = farms.length - prevFarmCount.current
      if (diff > 0) {
        setAnnouncement(`${diff} more farm${diff === 1 ? '' : 's'} found. ${farms.length} total farms in view.`)
      } else {
        setAnnouncement(`${farms.length} farm${farms.length === 1 ? '' : 's'} in view.`)
      }
      prevFarmCount.current = farms.length
    }
  }, [farms.length])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, farms.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < farms.length) {
          onFarmSelect?.(farms[focusedIndex].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsExpanded(false)
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(farms.length - 1)
        break
    }
  }

  // Calculate distance if user location available
  const getDistance = (farm: FarmShop): string | null => {
    if (!userLocation || !formatDistance) return null
    const R = 6371000 // Earth radius in meters
    const lat1 = userLocation.latitude * Math.PI / 180
    const lat2 = farm.location.lat * Math.PI / 180
    const dLat = (farm.location.lat - userLocation.latitude) * Math.PI / 180
    const dLng = (farm.location.lng - userLocation.longitude) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return formatDistance(R * c)
  }

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href={`#${skipTargetId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-serum focus:ring-offset-2"
      >
        Skip to farm list
      </a>

      {/* ARIA live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Screen reader accessible farm table */}
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:inset-4 focus-within:z-[90] focus-within:bg-white focus-within:dark:bg-gray-900 focus-within:rounded-xl focus-within:shadow-2xl focus-within:overflow-auto focus-within:p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Farm Shops ({farms.length})
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            onKeyDown={handleKeyDown}
            aria-expanded={isExpanded}
            aria-controls="accessible-farm-table"
            className="px-3 py-1.5 bg-serum text-white rounded-lg text-sm font-medium hover:bg-serum/90 focus:ring-2 focus:ring-serum focus:ring-offset-2"
          >
            {isExpanded ? 'Collapse' : 'Expand'} Table
          </button>
        </div>

        {isExpanded && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table
              ref={tableRef}
              id="accessible-farm-table"
              className="w-full text-sm"
              role="grid"
              aria-label="Farm shops in the current map area"
              onKeyDown={handleKeyDown}
            >
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Farm Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    County
                  </th>
                  {userLocation && (
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Distance
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Products
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {farms.map((farm, index) => (
                  <tr
                    key={farm.id}
                    className={`
                      ${selectedFarmId === farm.id ? 'bg-serum/10' : 'bg-white dark:bg-gray-900'}
                      ${focusedIndex === index ? 'ring-2 ring-inset ring-serum' : ''}
                      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    `}
                    tabIndex={focusedIndex === index ? 0 : -1}
                    role="row"
                    aria-selected={selectedFarmId === farm.id}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {farm.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {farm.location.address}, {farm.location.postcode}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {farm.location.county}
                    </td>
                    {userLocation && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {getDistance(farm) || 'Unknown'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {farm.offerings?.slice(0, 3).join(', ') || 'Various products'}
                      {(farm.offerings?.length || 0) > 3 && ` +${farm.offerings!.length - 3} more`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onFarmSelect?.(farm.id)}
                        className="px-3 py-1 bg-serum text-white rounded text-sm font-medium hover:bg-serum/90 focus:ring-2 focus:ring-serum focus:ring-offset-2"
                        aria-label={`View details for ${farm.name}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {farms.length === 0 && (
              <p className="p-4 text-center text-gray-600 dark:text-gray-300">
                No farms found in the current map area. Try zooming out or adjusting filters.
              </p>
            )}
          </div>
        )}

        {!isExpanded && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Press Tab to navigate, Enter to expand the table and browse {farms.length} farm shops.
          </p>
        )}

        {/* Keyboard navigation instructions */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium mb-1">Keyboard shortcuts:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Arrow Up/Down: Navigate farms</li>
            <li>Enter or Space: Select farm</li>
            <li>Home: Go to first farm</li>
            <li>End: Go to last farm</li>
            <li>Escape: Close table</li>
          </ul>
        </div>
      </div>
    </>
  )
}

/**
 * Accessible description of the current map state.
 * Announced to screen readers when the map updates.
 */
export function MapStateDescription({
  farmCount,
  selectedFarm,
  bounds,
  zoom
}: {
  farmCount: number
  selectedFarm?: FarmShop | null
  bounds?: { north: number; south: number; east: number; west: number } | null
  zoom?: number
}) {
  const description = selectedFarm
    ? `Showing ${selectedFarm.name} in ${selectedFarm.location.county}. ${farmCount} other farms visible on map.`
    : `Map showing ${farmCount} farm shop${farmCount === 1 ? '' : 's'} in the UK.${zoom ? ` Zoom level ${zoom}.` : ''}`

  return (
    <p id="map-description" className="sr-only">
      {description}
    </p>
  )
}

export default MapAccessibilityFallback
