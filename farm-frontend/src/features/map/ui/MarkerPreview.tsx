'use client'

import type { FarmShop } from '@/types/farm'
import FarmPreviewCard from './FarmPreviewCard'

interface MarkerPreviewProps {
  farm: FarmShop | null
  isDesktop: boolean
  panelWidth?: number               // desktop only: width of the side panel to avoid overlap
  onClose: () => void
  onViewDetails: (farmId: string) => void
  formatDistance?: (distance: number) => string
}

/**
 * MarkerPreview — positioning wrapper around FarmPreviewCard.
 * One component, two layouts:
 *   - Desktop: floating card pinned bottom-left of the map viewport
 *   - Mobile:  bottom-anchored full-width(-with-padding) sheet-style card,
 *              sitting above the collapsed bottom-sheet handle.
 *
 * Renders nothing when farm is null.
 */
export default function MarkerPreview({
  farm,
  isDesktop,
  panelWidth = 0,
  onClose,
  onViewDetails,
  formatDistance,
}: MarkerPreviewProps) {
  if (!farm) return null

  if (isDesktop) {
    return (
      <div
        className="absolute z-30 bottom-6 pointer-events-none flex justify-center"
        style={{ left: '24px', right: `${panelWidth + 24}px` }}
      >
        {/* Width is owned here, not in the card: the card used to hard-set
            `style={{width:320}}`, which inline-beats the `w-full` the mobile
            branch passes, so the mobile card never filled its gutter box. */}
        <div className="pointer-events-auto w-80">
          <FarmPreviewCard
            farm={farm}
            onClose={onClose}
            onViewDetails={onViewDetails}
            formatDistance={formatDistance}
          />
        </div>
      </div>
    )
  }

  // Mobile: bottom-anchored, full width minus 16px gutters, above the bottom-sheet's collapsed handle (~64px)
  return (
    <div
      className="md:hidden fixed left-2 right-2 z-40 pointer-events-none"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto mx-auto" style={{ maxWidth: 360 }}>
        <FarmPreviewCard
          farm={farm}
          onClose={onClose}
          onViewDetails={onViewDetails}
          formatDistance={formatDistance}
          className="w-full"
        />
      </div>
    </div>
  )
}
