'use client'

import { RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'

interface SearchAreaControlProps {
  /** Whether to automatically search when map moves */
  searchAsIMove: boolean
  /** Toggle the search-as-I-move setting */
  onToggle: () => void
  /** Manually trigger a search in the current area */
  onSearchThisArea: () => void
  /** Whether there are pending bounds to search */
  hasPendingSearch?: boolean
  /** Number of farms in current view */
  farmCount?: number
}

/**
 * Search Area Control - Toggle for automatic bounds-based filtering
 *
 * Design: Compact pill with toggle + manual search button fallback
 * Positioned top-right of map for easy access
 */
export default function SearchAreaControl({
  searchAsIMove,
  onToggle,
  onSearchThisArea,
  hasPendingSearch = false,
  farmCount,
}: SearchAreaControlProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      {/* Toggle switch */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-white/10 rounded-full shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all"
        aria-label={searchAsIMove ? 'Disable search as I move' : 'Enable search as I move'}
      >
        {searchAsIMove ? (
          <ToggleRight className="w-5 h-5 text-cyan-500" />
        ) : (
          <ToggleLeft className="w-5 h-5 text-zinc-400" />
        )}
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
          {searchAsIMove ? 'Search as I move' : 'Manual search'}
        </span>
      </button>

      {/* Manual search button - shown when toggle is off and there are pending bounds */}
      {!searchAsIMove && hasPendingSearch && (
        <button
          onClick={onSearchThisArea}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm rounded-full shadow-lg transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Search this area
        </button>
      )}

      {/* Farm count indicator */}
      {farmCount !== undefined && farmCount > 0 && (
        <div className="px-3 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-white/10 rounded-full shadow-md">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            {farmCount} {farmCount === 1 ? 'farm' : 'farms'} in view
          </span>
        </div>
      )}
    </div>
  )
}
