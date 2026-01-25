'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Store, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUserLocation } from '@/hooks/useUserLocation'

interface FindStockistsProps {
  produceName: string
  produceSlug: string
  category?: 'fruit' | 'vegetable' | 'herb' | 'other'
  className?: string
}

interface NearbyFarm {
  id: string
  name: string
  slug: string
  county: string
  distance?: number
}

/**
 * FindStockists Component
 *
 * Bridge between seasonal produce and farm shops that stock them.
 * Shows nearby farms and provides quick links to map/search.
 */
export function FindStockists({
  produceName,
  produceSlug,
  category = 'other',
  className = '',
}: FindStockistsProps) {
  const { location, isLoading: locationLoading } = useUserLocation({ maximumAge: 600000 })
  const [nearbyFarms, setNearbyFarms] = useState<NearbyFarm[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch nearby farms when location is available
  useEffect(() => {
    if (!location) return

    // Capture location for TypeScript narrowing
    const loc = location

    async function fetchNearbyFarms() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/farms?lat=${loc.latitude}&lng=${loc.longitude}&limit=3`
        )
        if (response.ok) {
          const data = await response.json()
          setNearbyFarms(data.farms?.slice(0, 3) || [])
        }
      } catch {
        // Silently fail, farms are optional
      } finally {
        setLoading(false)
      }
    }

    fetchNearbyFarms()
  }, [location])

  // Category-specific messaging
  const categoryMessages = {
    fruit: 'Find fresh, locally-grown fruit at farm shops near you',
    vegetable: 'Source fresh vegetables direct from local farms',
    herb: 'Get herbs picked fresh from local growers',
    other: 'Find this at farm shops near you',
  }

  return (
    <div className={`bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-950 dark:to-primary-900/50 rounded-2xl p-6 ${className}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <Store className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-heading font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Where to Buy {produceName}
          </h3>
          <p className="text-body text-slate-600 dark:text-slate-400">
            {categoryMessages[category]}
          </p>
        </div>
      </div>

      {/* Nearby Farms */}
      {(loading || locationLoading) ? (
        <div className="flex items-center gap-2 text-caption text-slate-500 dark:text-slate-400 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finding nearby farms...</span>
        </div>
      ) : nearbyFarms.length > 0 ? (
        <div className="space-y-2 mb-4">
          <p className="text-small text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wide">
            Farms near you
          </p>
          <div className="space-y-2">
            {nearbyFarms.map((farm) => (
              <Link
                key={farm.id}
                href={`/shop/${farm.slug}`}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {farm.name}
                    </p>
                    <p className="text-small text-slate-500 dark:text-slate-400">
                      {farm.county}
                      {farm.distance && ` - ${formatDistance(farm.distance)}`}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      ) : !location ? (
        <div className="mb-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
          <p className="text-caption text-slate-600 dark:text-slate-400">
            Enable location to see farms near you
          </p>
        </div>
      ) : null}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={() => {
            const params = new URLSearchParams({
              q: produceName,
              ...(location && { lat: String(location.latitude), lng: String(location.longitude) }),
            })
            window.location.href = `/map?${params.toString()}`
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Find on Map
        </Button>
        <Link
          href={`/shop?category=${category}`}
          className="flex-1"
        >
          <Button variant="secondary" size="md" className="w-full">
            <Store className="w-4 h-4 mr-2" />
            Browse All Shops
          </Button>
        </Link>
      </div>

      {/* Seasonal tip */}
      <p className="mt-4 text-small text-slate-500 dark:text-slate-500 text-center">
        Ask your local farm shop about seasonal availability
      </p>
    </div>
  )
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
}

/**
 * Compact version for use in cards
 */
export function FindStockistsCompact({
  produceName,
  className = '',
}: Pick<FindStockistsProps, 'produceName' | 'className'>) {
  const { location } = useUserLocation({ maximumAge: 600000 })

  const mapUrl = location
    ? `/map?q=${encodeURIComponent(produceName)}&lat=${location.latitude}&lng=${location.longitude}`
    : `/map?q=${encodeURIComponent(produceName)}`

  return (
    <Link
      href={mapUrl}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-full text-primary-700 dark:text-primary-300 text-small font-medium transition-colors ${className}`}
    >
      <MapPin className="w-4 h-4" />
      <span>Find {produceName} nearby</span>
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}
