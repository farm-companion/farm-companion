'use client'

import { useState } from 'react'
import { X, Filter, MapPin, Clock, Tag, ChevronDown, Check } from 'lucide-react'

interface FilterState {
  county?: string
  category?: string
  openNow?: boolean
}

interface FilterOverlayPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  counties: string[]
  categories: string[]
  farmCount: number
}

/**
 * Filter Overlay Panel - Mobile-first filter UI for map
 *
 * Slide-up panel with:
 * - Category chips (scrollable)
 * - County dropdown
 * - Open Now toggle
 * - Clear all / Apply buttons
 */
export default function FilterOverlayPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  counties,
  categories,
  farmCount,
}: FilterOverlayPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  // Sync local state when panel opens
  const handleOpen = () => {
    setLocalFilters(filters)
  }

  // Apply filters and close
  const handleApply = () => {
    onFilterChange(localFilters)
    onClose()
  }

  // Clear all filters
  const handleClearAll = () => {
    const cleared: FilterState = {}
    setLocalFilters(cleared)
    onFilterChange(cleared)
  }

  // Count active filters
  const activeFilterCount = [
    localFilters.county,
    localFilters.category,
    localFilters.openNow,
  ].filter(Boolean).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Filter farms"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Filter Farms
              </h2>
              <p className="text-xs text-foreground-muted">
                {farmCount} farms match
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Open Now Toggle */}
          <div>
            <label className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Clock className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Open Now
                  </span>
                  <p className="text-xs text-foreground-muted">
                    Only show farms currently open
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={localFilters.openNow || false}
                  onChange={(e) => setLocalFilters({ ...localFilters, openNow: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted border border-border rounded-full peer-checked:bg-primary transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          </div>

          {/* Category Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-foreground-muted" />
              <h3 className="text-sm font-medium text-foreground-secondary">Category</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 12).map((category) => (
                <button
                  key={category}
                  onClick={() =>
                    setLocalFilters({
                      ...localFilters,
                      category: localFilters.category === category ? undefined : category,
                    })
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    localFilters.category === category
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-card border-border text-foreground-secondary hover:border-primary/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* County Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-foreground-muted" />
              <h3 className="text-sm font-medium text-foreground-secondary">County</h3>
            </div>
            <div className="relative">
              <select
                value={localFilters.county || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    county: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All counties</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleClearAll}
            disabled={activeFilterCount === 0}
            className="flex-1 px-4 py-3 text-sm font-medium text-foreground-secondary bg-muted rounded-xl hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
