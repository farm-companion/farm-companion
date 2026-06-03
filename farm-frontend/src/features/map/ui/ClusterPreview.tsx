'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { FarmShop } from '@/types/farm'
import { farmMonogram, resolveFarmImagery } from '@/lib/farm-imagery'

interface ClusterPreviewProps {
  /** Supercluster id of the originating cluster, for return-focus targeting. */
  clusterId: number
  /** Total farms represented by the cluster (may exceed the rendered list). */
  count: number
  /** Farms to list; the first five are shown. */
  farms: FarmShop[]
  onClose: () => void
  onSelectFarm: (farm: FarmShop) => void
  onViewAll: () => void
}

/**
 * Small-cluster preview card (MapLibre). Extracted from MapLibreShell so the
 * focus-management contract lives with the surface it governs and the shell
 * stays smaller.
 *
 * Keyboard parity mirrors FarmPreviewCard (Slice 2.3): this is a non-modal
 * Disclosure, not a modal dialog, so there is NO hard Tab trap. On open,
 * focus moves into the card (the Close button); Escape closes it
 * (container-scoped, stopPropagation so it does not collide with other
 * Escape handlers); on close, focus returns to the originating cluster
 * marker — but only if that marker still exists and focus has fallen back to
 * <body> (i.e. the user has not already moved on, and the cluster was not
 * destroyed by a zoom/re-cluster). Unlike markers, the cluster element is not
 * re-rendered while the preview is open, so the plain-close path reliably
 * finds it via [data-cluster-id]; the View-all (zoom) path no-ops gracefully.
 */
export default function ClusterPreview({
  clusterId,
  count,
  farms,
  onClose,
  onSelectFarm,
  onViewAll,
}: ClusterPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const clusterIdRef = useRef(clusterId)

  // Keep the stable refs current without re-binding the listener-bearing
  // effects (the parent passes inline callbacks recreated each render).
  useEffect(() => {
    onCloseRef.current = onClose
    clusterIdRef.current = clusterId
  })

  // Focus-move on open; return-focus to the cluster marker on close.
  useEffect(() => {
    closeButtonRef.current?.focus()
    return () => {
      const id = clusterIdRef.current
      requestAnimationFrame(() => {
        if (document.activeElement !== document.body) return
        document.querySelector<HTMLElement>(`[data-cluster-id="${id}"]`)?.focus()
      })
    }
  }, [])

  // Escape closes (container-scoped).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`${count} farms nearby`}
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-paper text-ink rounded-2xl
        shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.10)] border border-border p-4 z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-clash text-base font-semibold tracking-tight text-ink">
          {count} farms nearby
        </h3>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close cluster preview"
          className="p-1.5 rounded-full hover:bg-surface-2 transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {farms.slice(0, 5).map(farm => {
          const imagery = resolveFarmImagery(farm)
          return (
            <button
              key={farm.id}
              onClick={() => onSelectFarm(farm)}
              className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-surface-2
                transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {/* Thumbnail — same photo-or-monogram hierarchy as the list card. */}
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-surface-2">
                {imagery.url ? (
                  <Image
                    src={imagery.url}
                    alt=""
                    fill
                    sizes="40px"
                    loading="lazy"
                    className="object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-full w-full items-center justify-center font-clash text-xs
                      font-semibold tracking-tight text-ink-subtle"
                  >
                    {farmMonogram(farm.name)}
                  </span>
                )}
              </span>
              {/* Farm names are content, not labels: undo the global
                  button label treatment (accent font, uppercase) per span,
                  since the unlayered button rule outranks utilities on the
                  button element itself under Tailwind v4 layering. */}
              <span className="min-w-0">
                <span className="block truncate font-body normal-case tracking-normal font-medium text-sm text-ink">
                  {farm.name}
                </span>
                <span className="block truncate font-mono text-[11px] uppercase tracking-[0.1em] text-ink-subtle">
                  {farm.location.city || farm.location.county}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {farms.length > 5 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm font-semibold text-brand hover:text-brand-hover
            transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
        >
          View all {count} farms
        </button>
      )}
    </div>
  )
}
