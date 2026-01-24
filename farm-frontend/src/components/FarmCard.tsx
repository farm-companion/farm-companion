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
      className={`group rounded-2xl border border-slate-300 dark:border-slate-700 bg-background-surface hover:shadow-premium-lg transition-all duration-200 overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 ring-offset-0' : ''
      }`}
    >
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="h-14 w-14 rounded-xl bg-background-canvas overflow-hidden flex-shrink-0">
          {hasPhotos ? (
            <Image 
              src={farm.images![0]} 
              alt={`${farm.name} photo`} 
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-background-canvas/50">
              <MapPin className="h-6 w-6 text-text-muted" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-primary-600 transition-colors line-clamp-2">
            {farm.name}
          </h3>
          <p className="text-caption text-slate-600 dark:text-slate-400 line-clamp-1">
            {farm.location?.county || 'UK'}
          </p>
          
          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-small rounded-full bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
            {/* Real-time status badge */}
            <StatusBadgeCompact openingHours={farm.hours} />
            {hasPhotos && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-small rounded-full bg-blue-100 text-blue-700">
                <Camera className="h-3 w-3" />
                Photos
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelect?.(farm)}
            className="px-3 py-1.5 text-caption font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            View
          </button>
          <button
            onClick={() => onDirections?.(farm)}
            className="px-3 py-1.5 text-caption rounded-md border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            title="Get directions"
          >
            <Navigation className="h-4 w-4" />
          </button>
          {showCompare && (
            <button
              onClick={handleCompare}
              className="px-3 py-1.5 text-caption rounded-md border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
