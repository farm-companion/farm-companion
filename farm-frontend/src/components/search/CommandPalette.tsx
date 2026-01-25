'use client'

/**
 * CommandPalette Component
 *
 * Modal search interface triggered by CMD+K.
 * Searches farms, produce, and counties.
 *
 * Design System Compliance:
 * - Spacing: 8px grid
 * - Typography: text-body, text-small
 * - Animation: fade-in (150ms)
 * - Glass surface with blur
 * - Focus trap and keyboard navigation
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Leaf, Map, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { PRODUCE } from '@/data/produce'
import { SearchSuggestions, type Suggestion } from './SearchSuggestions'

/**
 * Search result types
 */
type ResultType = 'farm' | 'produce' | 'county' | 'action'

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle?: string
  href: string
  icon: typeof MapPin
}

/**
 * Popular counties for quick access
 */
const QUICK_COUNTIES = [
  { name: 'Devon', slug: 'devon' },
  { name: 'Cornwall', slug: 'cornwall' },
  { name: 'Somerset', slug: 'somerset' },
  { name: 'Kent', slug: 'kent' },
  { name: 'Yorkshire', slug: 'yorkshire' },
]

/**
 * Quick actions
 */
const QUICK_ACTIONS: SearchResult[] = [
  { id: 'map', type: 'action', title: 'Open Map', subtitle: 'Find farms near you', href: '/map', icon: Map },
  { id: 'seasonal', type: 'action', title: "What's in Season", subtitle: 'Seasonal produce calendar', href: '/seasonal', icon: Leaf },
  { id: 'add', type: 'action', title: 'Add a Farm', subtitle: 'Submit a new farm shop', href: '/add', icon: MapPin },
]

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      // Show quick actions when no query
      return QUICK_ACTIONS
    }

    const q = query.toLowerCase().trim()
    const matches: SearchResult[] = []

    // Search produce
    PRODUCE.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.slug.includes(q)) {
        matches.push({
          id: `produce-${p.slug}`,
          type: 'produce',
          title: p.name,
          subtitle: 'Seasonal produce',
          href: `/seasonal/${p.slug}`,
          icon: Leaf,
        })
      }
    })

    // Search counties
    QUICK_COUNTIES.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.slug.includes(q)) {
        matches.push({
          id: `county-${c.slug}`,
          type: 'county',
          title: c.name,
          subtitle: 'Browse farms in county',
          href: `/counties/${c.slug}`,
          icon: MapPin,
        })
      }
    })

    // Add quick actions that match
    QUICK_ACTIONS.forEach((a) => {
      if (a.title.toLowerCase().includes(q)) {
        matches.push(a)
      }
    })

    return matches.slice(0, 8)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href)
            close()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, router, close])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <button
        aria-hidden
        onClick={close}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="absolute inset-x-4 top-[15vh] mx-auto max-w-xl">
        <div
          className={cn(
            'overflow-hidden rounded-2xl',
            'border border-slate-200/80 dark:border-white/[0.08]',
            'bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl',
            'shadow-2xl dark:shadow-none',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          {/* Specular highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent dark:block hidden pointer-events-none rounded-t-2xl" />

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-white/[0.06]">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search farms, produce, counties..."
              className={cn(
                'flex-1 h-14 bg-transparent',
                'text-body text-slate-900 dark:text-slate-100',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'outline-none'
              )}
            />
            <button
              onClick={close}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-400 dark:text-slate-500"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Suggestions + Results */}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {/* Predictive suggestions - shown when query is short */}
            {query.length < 3 && (
              <SearchSuggestions
                query={query}
                limit={5}
                onSelect={(suggestion: Suggestion) => {
                  router.push(suggestion.href)
                  close()
                }}
                className="mb-3 pb-3 border-b border-slate-200 dark:border-white/[0.06]"
              />
            )}

            {/* Search results */}
            {results.length === 0 && query.length >= 3 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-small text-slate-500 dark:text-slate-400">
                  No results found for "{query}"
                </p>
              </div>
            ) : results.length > 0 ? (
              <ul role="listbox">
                {results.map((result, index) => {
                  const Icon = result.icon
                  const isSelected = index === selectedIndex

                  return (
                    <li key={result.id} role="option" aria-selected={isSelected}>
                      <Link
                        href={result.href}
                        onClick={close}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'transition-colors duration-100',
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-500/10'
                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-9 h-9 rounded-lg',
                            result.type === 'produce'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20'
                              : result.type === 'county'
                                ? 'bg-blue-100 dark:bg-blue-500/20'
                                : 'bg-slate-100 dark:bg-white/[0.06]'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-4 h-4',
                              result.type === 'produce'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : result.type === 'county'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-slate-600 dark:text-slate-400'
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-small font-medium text-slate-900 dark:text-slate-100 truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-caption text-slate-500 dark:text-slate-400 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-4 text-caption text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.06] text-[10px] font-mono">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.06] text-[10px] font-mono">
                  ↵
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.06] text-[10px] font-mono">
                  esc
                </kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CommandPalette
