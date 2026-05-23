'use client'

import { useEffect, useRef } from 'react'
import type { FarmShop } from '@/types/farm'

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
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-white">
          {count} farms nearby
        </h3>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close cluster preview"
          className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {farms.slice(0, 5).map(farm => (
          <button
            key={farm.id}
            onClick={() => onSelectFarm(farm)}
            className="w-full text-left p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="font-medium text-sm text-zinc-900 dark:text-white">{farm.name}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{farm.location.city || farm.location.county}</div>
          </button>
        ))}
      </div>
      {farms.length > 5 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
        >
          View all {count} farms
        </button>
      )}
    </div>
  )
}
