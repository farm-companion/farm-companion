'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Navigation, CheckCircle, ExternalLink } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { StatusBadgeCompact } from './StatusBadge'
import { isCurrentlyOpen } from '@/lib/farm-status'

interface FarmCardProps {
  farm: FarmShop
  onSelect?: (farm: FarmShop) => void
  onDirections?: (farm: FarmShop) => void
  onCompare?: (farm: FarmShop) => void
  selected?: boolean
  showCompare?: boolean
}

/**
 * God-Tier FarmCard 5.0 - Obsidian-Kinetic Design
 *
 * Design principles:
 * 1. Full content visibility - no truncated names
 * 2. Clear visual hierarchy - primary CTA is obvious
 * 3. WCAG AAA contrast - all text readable
 * 4. Obsidian-Deep dark mode (#050505 canvas, #121214 surface)
 * 5. Border luminance in dark mode (no shadows)
 * 6. Kinetic interactions (scale 1.02 hover, 0.97 active)
 * 7. Adaptive font weight (semibold light, medium dark)
 */
export function FarmCard({
  farm,
  onSelect,
  onDirections,
  selected = false,
}: FarmCardProps) {
  const hasPhotos = farm.images && farm.images.length > 0
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
        group relative rounded-2xl overflow-hidden
        border-2 transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-cyan-500 shadow-lg ring-2 ring-cyan-500/20 bg-white dark:bg-[#121214]'
          : [
              // Light mode: white with shadow
              'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xl',
              // Dark mode: Obsidian surface with border luminance
              'dark:bg-[#121214] dark:border-white/[0.08] dark:hover:border-white/[0.12] dark:shadow-none'
            ].join(' ')
        }
      `}
    >
      {/* Image Section */}
      <div className="relative h-36 bg-zinc-100 dark:bg-[#1E1E21] overflow-hidden">
        {hasPhotos ? (
          <Image
            src={farm.images![0]}
            alt={`${farm.name} farm shop`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-[#1E1E21] dark:to-[#121214]">
            <MapPin className="h-12 w-12 text-zinc-400 dark:text-zinc-600" />
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadgeCompact openingHours={farm.hours} />
        </div>

        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold dark:font-medium rounded-full bg-white/90 dark:bg-[#121214]/90 text-green-700 dark:text-emerald-400 shadow-sm backdrop-blur-sm border border-transparent dark:border-white/[0.08]">
              <CheckCircle className="h-3.5 w-3.5" />
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Farm Name - Full display, no truncation */}
        <h3 className="text-lg font-bold dark:font-semibold text-zinc-900 dark:text-zinc-50 mb-1 leading-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          {farm.name}
        </h3>

        {/* Location */}
        <p className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{farm.location?.county || 'United Kingdom'}</span>
        </p>

        {/* Action Buttons - Kinetic interactions */}
        <div className="flex gap-3">
          {/* Primary CTA - View Details */}
          <Link
            href={`/shop/${farm.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold dark:font-medium transition-all duration-200 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-md active:scale-[0.97]"
          >
            View Details
            <ExternalLink className="h-4 w-4" />
          </Link>

          {/* Secondary CTA - Directions */}
          <button
            onClick={handleDirections}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-zinc-300 dark:border-white/[0.12] text-zinc-700 dark:text-zinc-300 text-sm font-semibold dark:font-medium transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:border-zinc-400 dark:hover:border-white/[0.16] active:scale-[0.97]"
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
