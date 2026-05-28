'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Navigation, CheckCircle, ExternalLink } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { FarmFallbackHero } from './FarmFallbackHero'
import { pittiFarmImageUrl } from '@/data/pitti-farms'
import { StatusBadgeCompact } from './StatusBadge'
import { AmenityIcons } from './shop/AmenityIcons'
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
  const [imageError, setImageError] = useState(false)
  const realImageUrl = farm.images?.[0] ? getImageUrl(farm.images[0]) : undefined
  // Hero priority: real photo -> Pitti illustration -> designed fallback.
  // On any load error (e.g. a farm whose Pitti isn't generated yet) we drop
  // straight to the designed fallback rather than retrying.
  const heroUrl = realImageUrl ?? pittiFarmImageUrl(farm.slug)
  const hasPhotos = !!heroUrl && !imageError
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
        group relative bg-surface rounded-[2px] overflow-hidden
        border transition-colors duration-200 cursor-pointer flex flex-col h-full
        ${selected
          ? 'border-brand ring-1 ring-brand/30'
          : 'border-border hover:border-ink/30'
        }
      `}
    >
      {/* Image Section - Taller for better visual impact */}
      <div className="relative h-44 sm:h-48 bg-surface-2 overflow-hidden flex-shrink-0">
        {hasPhotos && heroUrl ? (
          <Image
            src={heroUrl}
            alt={`${farm.name} farm shop`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            // Pitti blobs are pre-optimised webps served from Hetzner. Skip the
            // Next optimiser for them so list pages emit a single src per card
            // (not an ~11-entry srcset): keeps the /shop SSG HTML under Vercel's
            // 19MB FALLBACK_BODY_TOO_LARGE cap, and sidesteps the /_next/image
            // 400 for the Hetzner host. Real owner photos keep optimisation.
            unoptimized={!realImageUrl}
            onError={() => setImageError(true)}
          />
        ) : (
          <FarmFallbackHero name={farm.name} county={farm.location?.county} />
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadgeCompact openingHours={farm.hours} />
        </div>

        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-[2px] bg-paper/90 text-accent border border-accent/20 backdrop-blur-sm">
              <CheckCircle className="h-3.5 w-3.5" />
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Content Section - Generous padding for breathing room */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Farm Name - Full display, no truncation */}
        <h3 className="font-clash text-lg font-semibold text-ink mb-3 leading-tight group-hover:text-brand transition-colors line-clamp-2">
          {farm.name}
        </h3>

        {/* Location & Distance */}
        <div className="flex items-center gap-2 text-sm text-ink-muted mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{farm.location?.county || 'United Kingdom'}</span>
          {farm.distance !== undefined && farm.distance > 0 && (
            <>
              <span className="text-ink-subtle flex-shrink-0">·</span>
              <span className="font-semibold text-accent flex-shrink-0">
                {formatDistance(farm.distance)}
              </span>
            </>
          )}
        </div>

        {/* Amenity Icons */}
        {farm.amenities && farm.amenities.length > 0 && (
          <div className="mb-auto pb-4">
            <AmenityIcons amenityIds={farm.amenities} limit={4} />
          </div>
        )}

        {/* Spacer when no amenities */}
        {(!farm.amenities || farm.amenities.length === 0) && (
          <div className="mb-auto pb-2" />
        )}

        {/* Action Buttons - Always at bottom */}
        <div className="flex gap-3 mt-auto pt-2">
          {/* Primary CTA - View Details */}
          <Link
            href={`/shop/${farm.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-[2px] bg-brand text-brand-text text-sm font-semibold transition-colors duration-200 hover:bg-brand-hover active:scale-[0.98]"
          >
            View Details
            <ExternalLink className="h-4 w-4" />
          </Link>

          {/* Secondary CTA - Directions (icon only to save space) */}
          <button
            onClick={handleDirections}
            className="inline-flex items-center justify-center h-11 w-11 rounded-[2px] border border-border text-ink-muted transition-colors duration-200 hover:bg-surface-2 hover:text-ink active:scale-[0.98]"
            title="Get directions"
            aria-label="Get directions"
          >
            <Navigation className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  )
}
