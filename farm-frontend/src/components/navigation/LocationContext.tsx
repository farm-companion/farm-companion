'use client'

/**
 * LocationContext Component
 *
 * Shows personalized context in the header: month + location.
 * Example: "January in Cornwall" or "January | Near London"
 *
 * Design System Compliance:
 * - Typography: text-small for subtle display
 * - Spacing: 8px grid
 * - Colors: Muted text, primary accent for location
 * - Animation: None (static display)
 */

import { useState, useEffect } from 'react'
import { MapPin, Calendar } from 'lucide-react'
import { useUserLocation } from '@/hooks/useUserLocation'
import { getMonthName, getCurrentMonth } from '@/lib/seasonal-utils'

interface LocationContextProps {
  /** Display variant */
  variant?: 'full' | 'compact' | 'minimal'
  /** Whether to show in inverted (light on dark) mode */
  inverted?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Map coordinates to approximate UK region name.
 * Simple bounding box lookup for major regions.
 */
function getApproximateRegion(lat: number, lng: number): string | null {
  // UK regions with rough bounding boxes
  const regions: Array<{
    name: string
    bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  }> = [
    { name: 'Cornwall', bounds: { minLat: 49.9, maxLat: 50.8, minLng: -5.8, maxLng: -4.4 } },
    { name: 'Devon', bounds: { minLat: 50.2, maxLat: 51.2, minLng: -4.7, maxLng: -2.9 } },
    { name: 'Somerset', bounds: { minLat: 50.9, maxLat: 51.4, minLng: -3.8, maxLng: -2.3 } },
    { name: 'Dorset', bounds: { minLat: 50.5, maxLat: 51.1, minLng: -3.0, maxLng: -1.8 } },
    { name: 'Hampshire', bounds: { minLat: 50.7, maxLat: 51.4, minLng: -1.9, maxLng: -0.7 } },
    { name: 'Kent', bounds: { minLat: 50.9, maxLat: 51.5, minLng: 0.0, maxLng: 1.5 } },
    { name: 'Sussex', bounds: { minLat: 50.7, maxLat: 51.2, minLng: -0.9, maxLng: 0.9 } },
    { name: 'Surrey', bounds: { minLat: 51.1, maxLat: 51.5, minLng: -0.8, maxLng: 0.1 } },
    { name: 'London', bounds: { minLat: 51.3, maxLat: 51.7, minLng: -0.5, maxLng: 0.3 } },
    { name: 'Essex', bounds: { minLat: 51.4, maxLat: 52.1, minLng: 0.0, maxLng: 1.3 } },
    { name: 'Suffolk', bounds: { minLat: 51.9, maxLat: 52.5, minLng: 0.4, maxLng: 1.8 } },
    { name: 'Norfolk', bounds: { minLat: 52.3, maxLat: 53.0, minLng: 0.1, maxLng: 2.0 } },
    { name: 'Cambridgeshire', bounds: { minLat: 52.0, maxLat: 52.7, minLng: -0.5, maxLng: 0.5 } },
    { name: 'Oxfordshire', bounds: { minLat: 51.5, maxLat: 52.2, minLng: -1.8, maxLng: -0.9 } },
    { name: 'Gloucestershire', bounds: { minLat: 51.5, maxLat: 52.1, minLng: -2.7, maxLng: -1.5 } },
    { name: 'Worcestershire', bounds: { minLat: 52.0, maxLat: 52.5, minLng: -2.5, maxLng: -1.7 } },
    { name: 'Warwickshire', bounds: { minLat: 52.0, maxLat: 52.6, minLng: -1.9, maxLng: -1.2 } },
    { name: 'Leicestershire', bounds: { minLat: 52.4, maxLat: 52.9, minLng: -1.6, maxLng: -0.6 } },
    { name: 'Nottinghamshire', bounds: { minLat: 52.7, maxLat: 53.5, minLng: -1.3, maxLng: -0.6 } },
    { name: 'Derbyshire', bounds: { minLat: 52.7, maxLat: 53.5, minLng: -2.0, maxLng: -1.2 } },
    { name: 'Yorkshire', bounds: { minLat: 53.3, maxLat: 54.6, minLng: -2.6, maxLng: -0.1 } },
    { name: 'Lancashire', bounds: { minLat: 53.5, maxLat: 54.2, minLng: -3.1, maxLng: -2.0 } },
    { name: 'Cumbria', bounds: { minLat: 54.0, maxLat: 55.2, minLng: -3.6, maxLng: -2.2 } },
    { name: 'Northumberland', bounds: { minLat: 54.8, maxLat: 55.8, minLng: -2.7, maxLng: -1.5 } },
    { name: 'Wales', bounds: { minLat: 51.3, maxLat: 53.5, minLng: -5.3, maxLng: -2.6 } },
    { name: 'Scotland', bounds: { minLat: 54.6, maxLat: 60.9, minLng: -8.0, maxLng: -0.7 } },
  ]

  for (const region of regions) {
    const { bounds } = region
    if (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    ) {
      return region.name
    }
  }

  return null
}

/**
 * LocationContext shows current month and user location.
 */
export function LocationContext({
  variant = 'full',
  inverted = false,
  className = '',
}: LocationContextProps) {
  const { location, isLoading } = useUserLocation({ maximumAge: 600000 }) // 10 min cache
  const [region, setRegion] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const monthName = getMonthName(getCurrentMonth())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (location) {
      const approxRegion = getApproximateRegion(location.latitude, location.longitude)
      setRegion(approxRegion)
    }
  }, [location])

  // Avoid hydration mismatch
  if (!mounted) {
    return null
  }

  const textColor = inverted
    ? 'text-white/70'
    : 'text-slate-500 dark:text-slate-400'

  const accentColor = inverted
    ? 'text-white'
    : 'text-primary-600 dark:text-primary-400'

  if (variant === 'minimal') {
    return (
      <span className={`text-small ${textColor} ${className}`}>
        {monthName}
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 text-small ${className}`}>
        <Calendar className={`w-3.5 h-3.5 ${textColor}`} />
        <span className={textColor}>{monthName}</span>
        {region && (
          <>
            <span className={textColor}>|</span>
            <span className={accentColor}>{region}</span>
          </>
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1.5 text-small ${textColor}`}>
        <Calendar className="w-3.5 h-3.5" />
        <span>{monthName}</span>
      </div>
      {!isLoading && region && (
        <>
          <span className={`text-small ${textColor}`}>in</span>
          <div className={`flex items-center gap-1 text-small font-medium ${accentColor}`}>
            <MapPin className="w-3.5 h-3.5" />
            <span>{region}</span>
          </div>
        </>
      )}
      {!isLoading && !region && location && (
        <span className={`text-small ${textColor}`}>| Near you</span>
      )}
    </div>
  )
}

export default LocationContext
