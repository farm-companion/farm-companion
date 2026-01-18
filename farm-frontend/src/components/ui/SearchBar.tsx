'use client'

/**
 * SearchBar Component
 *
 * Enhanced search input with debouncing, autocomplete, and loading states.
 *
 * @example
 * ```tsx
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Search farms..."
 *   onSearch={(query) => console.log('Searching:', query)}
 * />
 *
 * // With autocomplete suggestions
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   suggestions={[
 *     { value: 'organic-farms', label: 'Organic Farms', count: 245 },
 *     { value: 'pick-your-own', label: 'Pick Your Own', count: 189 }
 *   ]}
 *   onSuggestionSelect={(suggestion) => navigate(suggestion.value)}
 * />
 *
 * // With loading state
 * <SearchBar
 *   value={query}
 *   onChange={setQuery}
 *   loading={isSearching}
 *   clearable
 * />
 * ```
 */

import * as React from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchSuggestion {
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  suggestions?: SearchSuggestion[]
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  loading?: boolean
  clearable?: boolean
  debounceMs?: number
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  clearable = true,
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Handle debounced search
  React.useEffect(() => {
    if (onSearch && value) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        onSearch(value)
      }, debounceMs)

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }
  }, [value, onSearch, debounceMs])

  // Handle clicks outside to close suggestions
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    } else {
      onChange(suggestion.label)
    }
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value)
      setShowSuggestions(false)
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const hasSuggestions = suggestions.length > 0 && value.length > 0

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-background-canvas px-3 py-2 h-12',
          'transition-all duration-200',
          isFocused
            ? 'border-border-focus ring-2 ring-border-focus ring-offset-2'
            : 'border-border-default'
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-text-muted" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => {
            setIsFocused(true)
            if (hasSuggestions) setShowSuggestions(true)
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted text-text-body"
        />

        {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}

        {clearable && value && !loading && (
          <button
            onClick={handleClear}
            className="rounded-full p-1 hover:bg-background-surface transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && hasSuggestions && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-border-default bg-background-canvas shadow-premium',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <div className="max-h-80 overflow-y-auto p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-3 h-12 text-left text-sm text-text-body',
                  'hover:bg-background-surface',
                  'transition-colors'
                )}
              >
                <div className="flex items-center gap-2">
                  {suggestion.icon}
                  <span>{suggestion.label}</span>
                </div>
                {suggestion.count !== undefined && (
                  <span className="text-xs text-text-muted">
                    {suggestion.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
