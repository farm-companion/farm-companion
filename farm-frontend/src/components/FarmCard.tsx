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
      className={`group rounded-2xl border border-border-default/40 bg-background-surface hover:shadow-premium transition-all duration-200 overflow-hidden ${
        selected ? 'ring-2 ring-brand-primary ring-offset-0' : ''
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
          <h3 className="truncate font-semibold text-text-heading group-hover:text-brand-primary transition-colors">
            {farm.name}
          </h3>
          <p className="truncate text-sm text-text-muted">
            {farm.location?.county || 'UK'}
          </p>
          
          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-success-light text-success-dark dark:bg-success-dark dark:text-success-light">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
            {/* Real-time status badge */}
            <StatusBadgeCompact openingHours={farm.hours} />
            {hasPhotos && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-info-light text-info-dark dark:bg-info-dark dark:text-info-light">
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
            className="h-12 px-3 text-sm font-medium rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            View
          </button>
          <button
            onClick={() => onDirections?.(farm)}
            className="h-12 px-3 text-sm rounded-md border border-border-default/50 hover:bg-background-canvas/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            <Navigation className="h-4 w-4" />
          </button>
          {showCompare && (
            <button
              onClick={handleCompare}
              className="h-12 px-3 text-sm rounded-md border border-border-default/50 hover:bg-background-canvas/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
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
