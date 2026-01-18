import { Suspense } from 'react'
import MapPageClient from './MapPageClient'

// Force dynamic rendering - map page uses URL params and geolocation
export const dynamic = 'force-dynamic'

// Loading skeleton for the map page
function MapLoadingSkeleton() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-6">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-600 rounded-full mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 border-3 border-serum border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Loading Map</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Preparing your farm discovery experience...</p>
      </div>
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapLoadingSkeleton />}>
      <MapPageClient />
    </Suspense>
  )
}
