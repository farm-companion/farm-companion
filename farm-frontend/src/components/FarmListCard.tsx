'use client'

import Image from 'next/image'
import type { FarmShop, FarmImage } from '@/types/farm'
import { getImageUrl } from '@/types/farm'
import { formatOpeningStatus } from '@/lib/opening-hours'

interface FarmListCardProps {
  farm: FarmShop
  isSelected: boolean
  isHovered: boolean
  onSelect: (farmId: string) => void
  onHover?: (farmId: string | null) => void
  formatDistance?: (distance: number) => string
}

/** Owner-grade provenance: a real submitted photo ("this is the farm"). */
const OWNER_PROVENANCE = new Set(['owner', 'admin', 'user'])

/** Coerce the legacy string-or-FarmImage first image into a FarmImage shape. */
function firstImage(farm: FarmShop): FarmImage | undefined {
  const raw = farm.images?.[0]
  if (!raw) return undefined
  return typeof raw === 'string' ? { url: raw } : raw
}

/** Short, human source label for a CC attribution affordance. */
function shortSource(img: FarmImage): string {
  if (img.sourceUrl) {
    try {
      return new URL(img.sourceUrl).hostname.replace(/^www\./, '')
    } catch {
      // fall through to the attribution string
    }
  }
  return (img.attribution ?? 'source').split(/[,(]/)[0].trim().slice(0, 24)
}

/**
 * Editorial monogram for the no-photo fallback tile: up to two initials drawn
 * from the leading significant words. A standalone "&" connector is ignored, a
 * leading digit is kept, and odd/empty names degrade to the first character or
 * a neutral mark so the tile is never blank.
 */
function farmMonogram(name: string): string {
  const words = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((w) => w && w !== '&')
  if (words.length === 0) return '·'
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Editorial result card for the map list (desktop 380px panel + mobile sheet).
 *
 * Layout: a left 104px square image block leads with imagery while keeping the
 * narrow panel dense and scannable (a full-width top image would halve the
 * cards on screen and lose the discovery rhythm). Matches the homepage Pitti
 * Press family: Clash title with a Vermilion underline accent, mono stat row,
 * IBM Plex condensed offering tags. Resting cards are flat; one elevation tier
 * (hairline + subtle lift) applies on hover/selected; selected = Vermilion
 * hairline. Transforms respect prefers-reduced-motion.
 *
 * Imagery hierarchy (hybrid-by-confidence): owner/admin/user photo = full
 * documentary imagery; a CC photo (has attribution) = full imagery plus a
 * subtle "Nearby" attribution cue; otherwise the typographic FarmFallbackHero.
 */
export default function FarmListCard({
  farm,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  formatDistance,
}: FarmListCardProps) {
  const hasHours = farm.hours && farm.hours.length > 0
  const openingStatus = hasHours ? formatOpeningStatus(farm.hours!) : null
  const isOpen = openingStatus?.isOpen === true

  const img = firstImage(farm)
  const imgUrl = img ? getImageUrl(img) : undefined
  const isOwnerPhoto = !!img?.uploadedBy && OWNER_PROVENANCE.has(img.uploadedBy)
  const isCcPhoto = !!imgUrl && !isOwnerPhoto && !!img?.attribution
  const showPhoto = !!imgUrl && (isOwnerPhoto || isCcPhoto)

  const distanceLabel =
    farm.distance !== undefined && formatDistance
      ? formatDistance(farm.distance)
      : null

  const statusLabel = openingStatus
    ? isOpen
      ? 'Open now'
      : openingStatus.nextOpening || 'Closed'
    : null

  const offerings = farm.offerings?.slice(0, 3) ?? []
  const extraOfferings = (farm.offerings?.length ?? 0) - offerings.length

  const borderClass = isSelected
    ? 'border-brand'
    : isHovered
      ? 'border-ink'
      : 'border-border hover:border-ink'

  const liftClass =
    isSelected || isHovered ? '-translate-y-0.5 motion-reduce:translate-y-0' : ''

  return (
    <article
      data-farm-id={farm.id}
      role="button"
      tabIndex={0}
      aria-label={`View ${farm.name}`}
      onClick={() => onSelect(farm.id)}
      onMouseEnter={() => onHover?.(farm.id)}
      onMouseLeave={() => onHover?.(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(farm.id)
        }
      }}
      className={`group mx-3 my-2 flex cursor-pointer gap-4 rounded-sm border bg-paper p-3
        transition-[transform,border-color] duration-200 ease-out motion-reduce:transition-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
        focus-visible:ring-offset-2 focus-visible:ring-offset-paper
        ${borderClass} ${liftClass}`}
    >
      {/* Image block — 104px square: image-forward yet dense for the panel. */}
      <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-sm bg-surface-2">
        {showPhoto ? (
          <Image
            src={imgUrl!}
            alt={farm.name}
            fill
            sizes="104px"
            loading="lazy"
            className="object-cover transition-transform duration-300 ease-out
              group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center border border-border bg-surface-2"
          >
            <span className="font-clash text-2xl font-semibold tracking-tight text-ink-subtle">
              {farmMonogram(farm.name)}
            </span>
          </div>
        )}
        {isCcPhoto && img && (
          <span
            className="absolute inset-x-0 bottom-0 truncate bg-ink px-1.5 py-0.5 font-mono text-[9px]
              uppercase tracking-[0.12em] text-paper"
            title={img.attribution ? `Nearby · ${img.attribution}` : 'Nearby image'}
          >
            Nearby · &copy; {shortSource(img)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className="truncate font-clash text-[17px] font-semibold leading-tight tracking-tight text-ink
            decoration-brand decoration-2 underline-offset-[3px] group-hover:underline"
        >
          {farm.name}
        </h3>

        {/* Anchor stat (distance) + status, mono. */}
        <div className="mt-1.5 flex items-center gap-2 font-mono text-xs">
          {distanceLabel && (
            <span className="font-semibold tabular-nums text-ink">{distanceLabel}</span>
          )}
          {distanceLabel && statusLabel && (
            <span aria-hidden className="text-ink-subtle">
              ·
            </span>
          )}
          {statusLabel ? (
            <span className={isOpen ? 'font-semibold text-brand' : 'text-ink-muted'}>
              {statusLabel}
            </span>
          ) : (
            farm.location.county && (
              <span className="truncate text-ink-muted">{farm.location.county}</span>
            )
          )}
        </div>

        {/* County on its own line only when status occupied the stat row. */}
        {statusLabel && farm.location.county && (
          <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-subtle">
            {farm.location.county}
          </p>
        )}

        {/* Offerings — condensed mono tags, not pills. */}
        {offerings.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
            {offerings.map((offering, idx) => (
              <span
                key={idx}
                className="font-accent text-[11px] uppercase tracking-[0.08em] text-ink-muted"
              >
                {offering}
              </span>
            ))}
            {extraOfferings > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-ink-subtle">
                +{extraOfferings}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
