'use client'

import React from 'react'
import { Filter, X } from 'lucide-react'

interface FilterChip {
  key: string
  label: string
}

interface DirectoryHeaderProps {
  total: number
  view: 'list' | 'cards'
  setView: (view: 'list' | 'cards') => void
  onFilterOpen: () => void
  activeFilters: FilterChip[]
  onClearFilter: (key: string) => void
  onClearAll: () => void
}

export function DirectoryHeader({ 
  total, 
  view, 
  setView, 
  onFilterOpen, 
  activeFilters, 
  onClearFilter, 
  onClearAll 
}: DirectoryHeaderProps) {
  return (
    <div className="sticky top-[var(--top-nav)] z-20 bg-background-surface/95 backdrop-blur border-b border-border-default/30">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <span className="text-caption text-text-muted">{total} farm{total !== 1 ? 's' : ''} found</span>
        
        {/* Active filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map(filter => (
            <button 
              key={filter.key} 
              onClick={() => onClearFilter(filter.key)}
              className="inline-flex items-center gap-1 rounded-full bg-background-canvas px-3 py-1 text-small hover:bg-background-canvas/80 transition-colors"
              aria-label={`Remove ${filter.label} filter`}
            >
              {filter.label}
              <X className="h-3 w-3" aria-hidden />
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button 
              onClick={onClearAll} 
              className="text-small underline hover:text-primary-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={onFilterOpen} 
            className="inline-flex items-center gap-2 px-3 py-1.5 text-caption rounded-md border border-border-default/50 hover:bg-background-canvas/60 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          
          <div className="inline-flex rounded-lg border border-border-default/50 p-0.5">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-caption rounded-md transition-colors ${
                view === 'list' 
                  ? 'bg-background-canvas font-medium text-text-heading' 
                  : 'hover:bg-background-canvas/60 text-text-muted'
              }`}
              aria-pressed={view === 'list'}
              aria-label="List view"
            >
              List
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 text-caption rounded-md transition-colors ${
                view === 'cards' 
                  ? 'bg-background-canvas font-medium text-text-heading' 
                  : 'hover:bg-background-canvas/60 text-text-muted'
              }`}
              aria-pressed={view === 'cards'}
              aria-label="Card view"
            >
              Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
