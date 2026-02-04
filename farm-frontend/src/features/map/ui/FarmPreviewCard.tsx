'use client'

import { useCallback } from 'react'
import { X, Phone, Navigation, Share2, Circle, ChevronRight, Leaf } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'

interface FarmPreviewCardProps {
  farm: FarmShop
  onClose: () => void
  onViewDetails: (farmId: string) => void
  formatDistance?: (distance: number) => string
  className?: string
}

/**
 * FarmPreviewCard -- shown when a map marker is clicked.
 * Anchored near the marker on desktop, bottom of screen on mobile.
 * Styled per the god-tier redesign spec.
 */
export default function FarmPreviewCard({
  farm,
  onClose,
  onViewDetails,
  formatDistance,
  className = '',
}: FarmPreviewCardProps) {
  const heroImage = farm.images?.[0] ? getImageUrl(farm.images[0]) : undefined
  const hasHours = farm.hours && farm.hours.length > 0
  const openingStatus = hasHours ? formatOpeningStatus(farm.hours!) : null
  const hasDistance = farm.distance !== undefined && formatDistance
  const hook = farm.description ? farm.description.slice(0, 120) : undefined

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${farm.location.lat},${farm.location.lng}`
  const phoneUrl = farm.contact?.phone ? `tel:${farm.contact.phone}` : null

  const handleShare = useCallback(async () => {
    const shareData = {
      title: farm.name,
      text: `Check out ${farm.name} - a local farm shop in ${farm.location.county}`,
      url: `${window.location.origin}/shop/${farm.slug}`,
    }
    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareData.url)
    }
  }, [farm])

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] overflow-hidden animate-[slideUp_200ms_ease-out] ${className}`}
      style={{ width: 320 }}
      role="dialog"
      aria-label={`Preview of ${farm.name}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        aria-label="Close preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Hero image */}
      <div className="w-full h-[180px] bg-[#F5F5F5] dark:bg-gray-800 relative">
        {heroImage ? (
          <img
            src={heroImage}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-12 h-12 text-[#CCCCCC]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-medium text-[#1A1A1A] dark:text-white">
          {farm.name}
        </h3>
        <p className="text-sm text-[#8C8C8C] mt-0.5">
          {farm.location.county}
          {hasDistance && ` \u00B7 ${formatDistance(farm.distance!)}`}
        </p>

        {/* Hook */}
        {hook && (
          <p className="text-sm italic text-[#5C5C5C] dark:text-gray-400 mt-2 line-clamp-2">
            &ldquo;{hook}&rdquo;
          </p>
        )}

        {/* Status */}
        {openingStatus && (
          <div className="flex items-center gap-1.5 mt-3">
            <Circle className={`w-2.5 h-2.5 ${openingStatus.isOpen ? 'fill-[#2D5016] text-[#2D5016]' : 'fill-[#CC0000] text-[#CC0000]'}`} />
            <span className={`text-sm font-medium ${openingStatus.isOpen ? 'text-[#2D5016]' : 'text-[#CC0000]'}`}>
              {openingStatus.status}
            </span>
            {openingStatus.nextOpening && (
              <span className="text-sm text-[#8C8C8C]">{openingStatus.nextOpening}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {farm.offerings && farm.offerings.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {farm.offerings.slice(0, 3).map((offering, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 bg-[#2D5016]/10 text-[#2D5016] text-[11px] font-semibold rounded-full uppercase tracking-wide"
              >
                {offering}
              </span>
            ))}
          </div>
        )}

        {/* View details CTA */}
        <button
          onClick={() => onViewDetails(farm.id)}
          className="w-full mt-4 py-2.5 bg-[#2D5016] text-white text-[15px] font-medium rounded-lg hover:bg-[#234012] transition-colors flex items-center justify-center gap-1"
        >
          View Full Details
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Action buttons row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {phoneUrl ? (
            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-1 py-2.5 bg-[#F5F5F5] text-[#5C5C5C] text-[13px] font-medium rounded-lg hover:bg-[#E8E8E8] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          ) : (
            <div />
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 py-2.5 bg-[#F5F5F5] text-[#5C5C5C] text-[13px] font-medium rounded-lg hover:bg-[#E8E8E8] transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1 py-2.5 bg-[#F5F5F5] text-[#5C5C5C] text-[13px] font-medium rounded-lg hover:bg-[#E8E8E8] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
