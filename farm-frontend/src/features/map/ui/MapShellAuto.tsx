'use client'

import dynamic from 'next/dynamic'
import { Suspense, useMemo } from 'react'
import { getEffectiveProvider } from '@/lib/map-provider'
import type { FarmShop } from '@/types/farm'

// Dynamic imports to avoid loading both map libraries
const MapLibreShell = dynamic(() => import('./MapLibreShell'), {
  ssr: false,
  loading: () => <MapLoadingState />,
})

const MapShell = dynamic(() => import('./MapShell'), {
  ssr: false,
  loading: () => <MapLoadingState />,
})

interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  isTracking?: boolean
  nearestFarm?: {
    id: string
    name: string
    distance: number
  }
}

interface MapShellAutoProps {
  farms: FarmShop[]
  selectedFarmId?: string | null
  onFarmSelect?: (farmId: string) => void
  onMapLoad?: (map: unknown) => void
  onBoundsChange?: (bounds: unknown) => void
  onZoomChange?: (zoom: number) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  userLocation?: UserLocation | null
  bottomSheetHeight?: number
  isDesktop?: boolean
  onMapReady?: (map: unknown) => void
  /** Force a specific provider (overrides env config) */
  forceProvider?: 'maplibre' | 'google'
}

function MapLoadingState() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-serum mx-auto mb-2" />
        <p className="text-sm text-gray-600">Harvesting latest updates...</p>
      </div>
    </div>
  )
}

/**
 * MapShellAuto - Automatic map provider selection
 *
 * Automatically selects between MapLibre GL and Google Maps based on:
 * 1. NEXT_PUBLIC_MAP_PROVIDER environment variable
 * 2. WebGL support (for MapLibre)
 * 3. Google Maps API key availability
 *
 * Usage:
 * ```tsx
 * <MapShellAuto farms={farms} onFarmSelect={handleSelect} />
 * ```
 *
 * To force a specific provider:
 * ```tsx
 * <MapShellAuto farms={farms} forceProvider="maplibre" />
 * ```
 */
export default function MapShellAuto({
  forceProvider,
  ...props
}: MapShellAutoProps) {
  const provider = useMemo(() => {
    if (forceProvider) return forceProvider
    return getEffectiveProvider()
  }, [forceProvider])

  return (
    <Suspense fallback={<MapLoadingState />}>
      {provider === 'maplibre' ? (
        <MapLibreShell {...props} />
      ) : (
        <MapShell {...props} />
      )}
    </Suspense>
  )
}
