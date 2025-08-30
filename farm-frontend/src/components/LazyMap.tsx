'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import LoadingOverlay from './LoadingOverlay'
import type { FarmShop } from '@/types/farm'

// Dynamically import the heavy map component
const GoogleMapComponent = dynamic(
  () => import('./GoogleMapComponent'),
  {
    loading: () => <LoadingOverlay isLoading={true} stage="preparing-map" progress={50} />,
    ssr: false, // Disable SSR for map component to prevent hydration issues
  }
)

interface LazyMapProps {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[] | null
  userLoc: { lat: number; lng: number } | null
  setUserLoc: (loc: { lat: number; lng: number } | null) => void
  bounds: { west: number; south: number; east: number; north: number } | null
  setBounds: (bounds: { west: number; south: number; east: number; north: number } | null) => void
  selectedFarmId: string | null
  onSelectFarmId: (farmId: string | null) => void
  onCameraMovingChange?: (isMoving: boolean) => void
  loadFarmData: () => void
  isLoading: boolean
  error: string | null
  retryCount: number
  isRetrying: boolean
  dataQuality: { total: number; valid: number; invalid: number } | null
}

export default function LazyMap(props: LazyMapProps) {
  return (
    <Suspense fallback={<LoadingOverlay isLoading={true} stage="preparing-map" progress={50} />}>
      <GoogleMapComponent {...props} />
    </Suspense>
  )
}
