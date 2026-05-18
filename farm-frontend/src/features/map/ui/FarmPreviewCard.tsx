'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Phone, Navigation, Share2, Circle, ChevronRight, Leaf } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'
import {
  truncateHook,
  getOpeningTone,
  buildDirectionsUrl,
  buildShopUrl,
} from '../lib/preview-helpers'

interface FarmPreviewCardProps {
  farm: FarmShop
  onClose: () => void
  onViewDetails: (farmId: string) => void
  formatDistance?: (distance: number) => string
  className?: string
}

/**
 * FarmPreviewCard — shown when a map marker is tapped.
 * Presentational only; layout (positioning) is owned by MarkerPreview.
 * Polish per Emil's framework (custom easing, scale-from-0.97 entry,
 * tactile :active, tabular-nums on changing digits).
 */
export default function FarmPreviewCard({
  farm,
  onClose,
  onViewDetails,
  formatDistance,
  className = '',
}: FarmPreviewCardProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // Trigger entry animation after the first paint:
    // initial render → opacity-0 + translateY + scale(0.97), then this effect
    // adds data-mounted on the next tick, CSS transitions to neutral.
    setMounted(true)
  }, [])

  const heroImage = farm.images?.[0] ? getImageUrl(farm.images[0]) : undefined
  const hasHours = farm.hours && farm.hours.length > 0
  const openingStatus = hasHours ? formatOpeningStatus(farm.hours!) : null
  const tone = getOpeningTone(openingStatus?.isOpen)
  const hasDistance = farm.distance !== undefined && formatDistance
  const hook = truncateHook(farm.description)

  const directionsUrl = buildDirectionsUrl(farm.location.lat, farm.location.lng)
  const phoneUrl = farm.contact?.phone ? `tel:${farm.contact.phone}` : null

  const handleShare = useCallback(async () => {
    const shareData = {
      title: farm.name,
      text: `Check out ${farm.name} — a local farm shop in ${farm.location.county}`,
      url: buildShopUrl(window.location.origin, farm.slug),
    }
    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData) } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(shareData.url) } catch { /* clipboard denied / HTTP-only / iOS gesture */ }
    }
  }, [farm])

  return (
    <div
      data-mounted={mounted ? '' : undefined}
      className={[
        'relative bg-background-elevated text-text-body rounded-2xl overflow-hidden',
        'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.10)]',
        'transition-[transform,opacity] duration-200',
        '[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
        'data-[mounted]:opacity-100 data-[mounted]:translate-y-0 data-[mounted]:scale-100',
        'opacity-0 translate-y-2 scale-[0.97]',
        className,
      ].join(' ')}
      style={{ width: 320 }}
      role="region"
      aria-label={`Preview of ${farm.name}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 active:scale-[0.97] transition-[background-color,transform] duration-150"
        aria-label="Close preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Hero image */}
      <div className="relative w-full h-[180px] bg-background-surface">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={farm.name}
            fill
            className="object-cover [outline:1px_solid_rgba(0,0,0,0.08)] [outline-offset:-1px] dark:[outline-color:rgba(255,255,255,0.10)]"
            sizes="320px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-12 h-12 text-text-subtle" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-medium text-text-heading [text-wrap:balance]">
          {farm.name}
        </h3>
        <p className="text-sm text-text-muted mt-0.5 [font-variant-numeric:tabular-nums]">
          {farm.location.county}
          {hasDistance && ` · ${formatDistance!(farm.distance!)}`}
        </p>

        {/* Hook */}
        {hook && (
          <p className="text-sm italic text-text-body mt-2 line-clamp-2 [text-wrap:pretty]">
            &ldquo;{hook}&rdquo;
          </p>
        )}

        {/* Status */}
        {openingStatus && tone !== 'unknown' && (
          <div className="flex items-center gap-1.5 mt-3 [font-variant-numeric:tabular-nums]">
            <Circle
              className={[
                'w-2.5 h-2.5',
                tone === 'open' ? 'fill-brand-action text-brand-action' : 'fill-brand-danger text-brand-danger',
              ].join(' ')}
              aria-hidden
            />
            <span
              className={[
                'text-sm font-medium',
                tone === 'open' ? 'text-brand-action' : 'text-brand-danger',
              ].join(' ')}
            >
              {openingStatus.status}
            </span>
            {openingStatus.nextOpening && (
              <span className="text-sm text-text-muted">{openingStatus.nextOpening}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {farm.offerings && farm.offerings.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {farm.offerings.slice(0, 3).map((offering) => (
              <span
                key={offering}
                className="inline-block px-2 py-0.5 bg-brand-action/10 text-brand-action text-[11px] font-semibold rounded-full uppercase tracking-wide"
              >
                {offering}
              </span>
            ))}
          </div>
        )}

        {/* View details CTA — Emil: tactile :active, custom easing, durations ≤200ms */}
        <button
          onClick={() => onViewDetails(farm.id)}
          className="w-full mt-4 py-2.5 bg-brand-action hover:bg-brand-action-hover active:scale-[0.98] text-brand-action-text text-[15px] font-medium rounded-lg transition-[transform,background-color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-1"
        >
          View Full Details
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Action buttons row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {phoneUrl ? (
            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-1 py-2.5 bg-background-surface text-text-body text-[13px] font-medium rounded-lg hover:bg-background-hover active:scale-[0.98] transition-[background-color,transform] duration-150"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          ) : (
            <div aria-hidden />
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 py-2.5 bg-background-surface text-text-body text-[13px] font-medium rounded-lg hover:bg-background-hover active:scale-[0.98] transition-[background-color,transform] duration-150"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1 py-2.5 bg-background-surface text-text-body text-[13px] font-medium rounded-lg hover:bg-background-hover active:scale-[0.98] transition-[background-color,transform] duration-150"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
