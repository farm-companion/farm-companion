'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, Navigation, CheckCircle, Camera, GitCompare } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { StatusBadgeCompact } from './StatusBadge'
import { isCurrentlyOpen } from '@/lib/farm-status'
import { useRouter } from 'next/navigation'

interface FarmCardProps {
  farm: FarmShop
  onSelect?: (farm: FarmShop) => void
  onDirections?: (farm: FarmShop) => void
  onCompare?: (farm: FarmShop) => void
  selected?: boolean
  showCompare?: boolean
}

export function FarmCard({
  farm,
  onSelect,
  onDirections,
  onCompare,
  selected = false,
  showCompare = true
}: FarmCardProps) {
  const router = useRouter()
  const hasPhotos = farm.images && farm.images.length > 0
  const isOpenNow = isCurrentlyOpen(farm.hours)
  const isVerified = farm.verified || false

  const handleCompare = () => {
    if (onCompare) {
      onCompare(farm)
    } else {
      // Default behavior: navigate to compare page
      router.push(`/compare?farms=${farm.id}`)
    }
  }

  return (
    <article
      className={`group rounded-2xl border bg-white/98 dark:bg-neutral-900/98 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
        selected
          ? 'ring-2 ring-brand-primary ring-offset-0 border-brand-primary/30 shadow-lg shadow-brand-primary/10'
          : 'border-neutral-200/60 dark:border-neutral-700/60 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-neutral-900/5 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail - Premium rounded */}
        <div className="h-16 w-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 ring-1 ring-neutral-200/50 dark:ring-neutral-700/50">
          {hasPhotos ? (
            <Image
              src={farm.images![0]}
              alt={`${farm.name} photo`}
              width={64}
              height={64}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
              <MapPin className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-neutral-900 dark:text-white group-hover:text-brand-primary transition-colors">
            {farm.name}
          </h3>
          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {farm.location?.county || 'UK'}
          </p>

          {/* Badges - Premium styling */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/50">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
            {/* Real-time status badge */}
            <StatusBadgeCompact openingHours={farm.hours} />
            {hasPhotos && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                <Camera className="h-3 w-3" />
                Photos
              </span>
            )}
          </div>
        </div>

        {/* Actions - Premium buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelect?.(farm)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            View
          </button>
          <button
            onClick={() => onDirections?.(farm)}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-brand-primary/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 flex items-center justify-center"
          >
            <Navigation className="h-4 w-4" />
          </button>
          {showCompare && (
            <button
              onClick={handleCompare}
              className="px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-brand-primary/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 flex items-center justify-center"
              title="Compare this farm"
            >
              <GitCompare className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
