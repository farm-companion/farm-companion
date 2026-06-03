'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Phone, Navigation, Share2, Circle, ChevronRight } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'
import { pittiFarmImageUrl } from '@/data/pitti-farms'
import { farmMonogram, resolveFarmImagery, shortSource } from '@/lib/farm-imagery'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  // Stable refs so the focus-management effects can keep empty deps. The
  // alternative — depending on [onClose, farm.id] — would tear down and
  // re-bind listeners every time the parent re-rendered with a new inline
  // onClose, and would fire focus-return on every farm switch (causing a
  // mid-stream rAF to override the next render's focus target).
  const onCloseRef = useRef(onClose)
  const farmIdRef = useRef(farm.id)
  useEffect(() => {
    onCloseRef.current = onClose
    farmIdRef.current = farm.id
  })

  useEffect(() => {
    // Trigger entry animation after the first paint:
    // initial render → opacity-0 + translateY + scale(0.97), then this effect
    // adds data-mounted on the next tick, CSS transitions to neutral.
    setMounted(true)
  }, [])

  // Focus management (Slice 2.3).
  //   - On open: move focus to the Close button. The :focus-visible heuristic
  //     suppresses the ring for mouse-initiated opens and shows it for
  //     keyboard-initiated opens, which is the correct WCAG 2.4.7 behaviour.
  //   - On close (unmount): if focus has defaulted back to <body> (i.e. the
  //     popover unmount lost focus), return it to the originating marker.
  //     Querying by data-farm-id is necessary because both LeafletShell and
  //     MapLibreShell tear down and re-add markers on every selectedFarmId
  //     change, so a captured DOM ref would be stale.
  //   - Non-modal: NO hard Tab trap. The popover floats over a still-operable
  //     map; trapping Tab would prevent the user from reaching markers
  //     behind it. ARIA Authoring Practices reserve hard traps for true
  //     modal dialogs.
  useEffect(() => {
    closeButtonRef.current?.focus()
    return () => {
      const lastFarmId = farmIdRef.current
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          return
        }
        const markerEl = document.querySelector<HTMLElement>(`[data-farm-id="${lastFarmId}"]`)
        markerEl?.focus()
      })
    }
  }, [])

  // Escape-to-close, scoped to the container so it does not intercept an
  // Escape destined for an overlapping FilterOverlayPanel, BottomSheet, or
  // any of the other 8 components in the codebase that handle Escape.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Image resolution (Komoot S2: same confidence hierarchy as FarmListCard):
  // owner/admin/user photo wins, then a CC photo with its attribution cue,
  // then the per-farm Pitti illustration (Slice 1.1.3d-3 manifest, empty
  // until a slug is enrolled), then the branded monogram tile. The map
  // popover is a PLACE surface, so Pitti is allowed here.
  const imagery = resolveFarmImagery(farm)
  const heroImage = imagery.url ?? pittiFarmImageUrl(farm.slug) ?? undefined
  const isCcPhoto = imagery.kind === 'cc'
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
      ref={containerRef}
      data-mounted={mounted ? '' : undefined}
      className={[
        'relative bg-paper text-ink rounded-2xl overflow-hidden',
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
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 active:scale-[0.97] transition-[background-color,transform] duration-150"
        aria-label={`Close preview of ${farm.name}`}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Hero image */}
      <div className="relative w-full h-[180px] bg-surface">
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
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-surface-2"
          >
            <span className="font-clash text-5xl font-semibold tracking-tight text-ink-subtle">
              {farmMonogram(farm.name)}
            </span>
          </div>
        )}
        {isCcPhoto && imagery.image && (
          <span
            className="absolute inset-x-0 bottom-0 truncate bg-ink px-1.5 py-0.5 font-mono text-[9px]
              uppercase tracking-[0.12em] text-paper"
            title={imagery.image.attribution ? `Nearby · ${imagery.image.attribution}` : 'Nearby image'}
          >
            Nearby · &copy; {shortSource(imagery.image)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-medium text-ink [text-wrap:balance]">
          {farm.name}
        </h3>
        <p className="text-sm text-ink-muted mt-0.5 [font-variant-numeric:tabular-nums]">
          {farm.location.county}
          {hasDistance && ` · ${formatDistance!(farm.distance!)}`}
        </p>

        {/* Hairline — separates identity from interaction (spec §5.1) */}
        <div className="border-t border-border-subtle my-3" aria-hidden />

        {/* Hook */}
        {hook && (
          <p className="text-sm italic text-ink line-clamp-2 [text-wrap:pretty]">
            &ldquo;{hook}&rdquo;
          </p>
        )}

        {/* Status — Rapeseed accent pill for Open Now, neutral pill for Closed (spec §5.3) */}
        {openingStatus && tone !== 'unknown' && (
          <div className={[hook ? 'mt-3' : '', 'flex items-center gap-2 [font-variant-numeric:tabular-nums]'].join(' ')}>
            <span
              className={[
                'inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-semibold uppercase tracking-wide',
                tone === 'open'
                  ? 'bg-accent text-accent-text'
                  : 'bg-surface-2 text-ink-muted',
              ].join(' ')}
            >
              <Circle className="w-2 h-2 fill-current" aria-hidden />
              {openingStatus.status}
            </span>
            {openingStatus.nextOpening && (
              <span className="text-sm text-ink-subtle">{openingStatus.nextOpening}</span>
            )}
          </div>
        )}

        {/* Tags */}
        {farm.offerings && farm.offerings.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {farm.offerings.slice(0, 3).map((offering) => (
              <span
                key={offering}
                className="inline-block px-2 py-0.5 bg-brand/10 text-brand text-[11px] font-semibold rounded-full uppercase tracking-wide"
              >
                {offering}
              </span>
            ))}
          </div>
        )}

        {/* View details CTA — Emil: tactile :active, custom easing, durations ≤200ms */}
        <button
          onClick={() => onViewDetails(farm.id)}
          className="w-full mt-4 py-2.5 bg-brand hover:bg-brand-hover active:scale-[0.98] text-brand-text text-[15px] font-medium rounded-lg transition-[transform,background-color] duration-150 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-1"
        >
          View Full Details
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Action buttons row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {phoneUrl ? (
            <a
              href={phoneUrl}
              className="flex items-center justify-center gap-1 py-2.5 bg-surface text-ink text-[13px] font-medium rounded-lg hover:bg-surface-2 active:scale-[0.98] transition-[background-color,transform] duration-150"
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
            className="flex items-center justify-center gap-1 py-2.5 bg-surface text-ink text-[13px] font-medium rounded-lg hover:bg-surface-2 active:scale-[0.98] transition-[background-color,transform] duration-150"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1 py-2.5 bg-surface text-ink text-[13px] font-medium rounded-lg hover:bg-surface-2 active:scale-[0.98] transition-[background-color,transform] duration-150"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
