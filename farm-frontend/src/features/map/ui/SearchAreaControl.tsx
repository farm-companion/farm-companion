'use client'

import { RefreshCw } from 'lucide-react'

interface SearchAreaControlProps {
  /** Show the pill (map has moved and search-as-I-move is off) */
  visible: boolean
  /** Search the current map area */
  onSearchThisArea: () => void
}

/**
 * Search Area Control - one "Search this area" pill (Komoot S3b).
 *
 * Appears top-center only when the map has moved with auto-search off; the
 * "Update as I move" checkboxes in the list headers are the single toggle
 * location. The old toggle pill and farms-in-view count pill are gone (the
 * count already lives in those same headers).
 */
export default function SearchAreaControl({
  visible,
  onSearchThisArea,
}: SearchAreaControlProps) {
  if (!visible) return null

  return (
    <button
      onClick={onSearchThisArea}
      className="flex items-center gap-2 min-h-[44px] px-5 py-2.5
        bg-surface text-ink text-sm font-semibold
        border border-border rounded-full
        shadow-[0_2px_8px_rgba(0,0,0,0.15)]
        hover:bg-surface-2 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]
        active:scale-95
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <RefreshCw className="w-4 h-4 text-brand" aria-hidden="true" />
      Search this area
    </button>
  )
}
