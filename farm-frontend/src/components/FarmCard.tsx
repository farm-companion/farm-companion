'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Navigation, CheckCircle, ExternalLink } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { StatusBadgeCompact } from './StatusBadge'
import { formatDistance } from '@/shared/lib/geo'

interface FarmCardProps {
  farm: FarmShop
  onSelect?: (farm: FarmShop) => void
  onDirections?: (farm: FarmShop) => void
  onCompare?: (farm: FarmShop) => void
  selected?: boolean
  showCompare?: boolean
}

/**
 * God-Tier FarmCard - Apple-Inspired Design
 *
 * Design principles:
 * 1. Full content visibility - no truncated names
 * 2. Clear visual hierarchy - primary CTA is obvious
 * 3. WCAG AAA contrast - all text readable
 * 4. Generous spacing - comfortable touch targets
 * 5. Subtle depth - refined shadows and borders
 */
export function FarmCard({
  farm,
  onSelect,
  onDirections,
  selected = false,
}: FarmCardProps) {
  const firstImageUrl = farm.images?.[0] ? getImageUrl(farm.images[0]) : undefined
  const hasPhotos = !!firstImageUrl
  const isVerified = farm.verified || false

  const handleDirections = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDirections) {
      onDirections(farm)
    } else {
      // Default: open Google Maps directions
      const { lat, lng } = farm.location
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    }
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(farm)
    }
  }

  return (
    <article
      onClick={handleCardClick}
      className={`
        group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden
        border-2 transition-all duration-200 cursor-pointer flex flex-col h-full
        ${selected
          ? 'border-primary-500 shadow-lg ring-2 ring-primary-500/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl'
        }
      `}
    >
      {/* Image Section - Taller for better visual impact */}
      <div className="relative h-44 sm:h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
        {hasPhotos && firstImageUrl ? (
          <Image
            src={firstImageUrl}
            alt={`${farm.name} farm shop`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
            <MapPin className="h-12 w-12 text-slate-400 dark:text-slate-500" />
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadgeCompact openingHours={farm.hours} />
        </div>

        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-white/90 dark:bg-slate-900/90 text-green-700 dark:text-green-400 shadow-sm backdrop-blur-sm">
              <CheckCircle className="h-3.5 w-3.5" />
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Farm Name - Full display, no truncation */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
          {farm.name}
        </h3>

        {/* Location & Distance */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mb-auto pb-4">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{farm.location?.county || 'United Kingdom'}</span>
          {farm.distance !== undefined && farm.distance > 0 && (
            <>
              <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">·</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                {formatDistance(farm.distance)}
              </span>
            </>
          )}
        </div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex gap-3 mt-auto">
          {/* Primary CTA - View Details */}
          <Link
            href={`/shop/${farm.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-sm font-semibold transition-all duration-200 hover:bg-slate-800 dark:hover:bg-white hover:shadow-md active:scale-[0.98]"
          >
            View Details
            <ExternalLink className="h-4 w-4" />
          </Link>

          {/* Secondary CTA - Directions */}
          <button
            onClick={handleDirections}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 active:scale-[0.98]"
            title="Get directions"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Directions</span>
          </button>
        </div>
      </div>
    </article>
  )
}
