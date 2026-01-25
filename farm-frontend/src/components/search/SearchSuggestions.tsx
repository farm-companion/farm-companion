'use client'

/**
 * SearchSuggestions Component
 *
 * Provides predictive type-ahead suggestions based on query.
 * Intent-aware: suggests seasonal items, locations, and actions.
 *
 * Design System Compliance:
 * - Typography: text-small, text-caption
 * - Spacing: 8px grid
 * - Colors: Semantic highlights
 * - Animation: None (instant feedback)
 */

import { useMemo } from 'react'
import { Leaf, MapPin, Sparkles, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCE } from '@/data/produce'
import { getProduceInSeason, getCurrentMonth } from '@/lib/seasonal-utils'

export interface Suggestion {
  id: string
  text: string
  type: 'produce' | 'county' | 'action' | 'trending'
  href: string
  highlight?: string
  icon: typeof Leaf
  iconColor: string
}

/**
 * UK counties for suggestions
 */
const COUNTIES = [
  'Devon', 'Cornwall', 'Somerset', 'Kent', 'Yorkshire', 'Norfolk',
  'Suffolk', 'Essex', 'Surrey', 'Hampshire', 'Dorset', 'Gloucestershire',
  'Oxfordshire', 'Cambridgeshire', 'Lancashire', 'Cumbria', 'Wales', 'Scotland',
]

/**
 * Common search intents with suggestions
 */
const INTENT_PATTERNS: Array<{
  pattern: RegExp
  getSuggestions: (match: RegExpMatchArray) => Suggestion[]
}> = [
  // "near me" / "nearby" intent
  {
    pattern: /near\s?(me|by)?|close|local/i,
    getSuggestions: () => [
      {
        id: 'nearby-map',
        text: 'Find farms near you',
        type: 'action',
        href: '/map?nearby=true',
        icon: MapPin,
        iconColor: 'text-blue-500',
      },
    ],
  },
  // "open" / "now" intent
  {
    pattern: /open|now|today/i,
    getSuggestions: () => [
      {
        id: 'open-now',
        text: 'Farms open now',
        type: 'action',
        href: '/map?open=true',
        icon: Clock,
        iconColor: 'text-emerald-500',
      },
    ],
  },
  // "pick your own" / "pyo" intent
  {
    pattern: /pick\s?your\s?own|pyo/i,
    getSuggestions: () => [
      {
        id: 'pyo-farms',
        text: 'Pick Your Own farms',
        type: 'action',
        href: '/categories/pick-your-own',
        highlight: 'PYO',
        icon: Leaf,
        iconColor: 'text-emerald-500',
      },
    ],
  },
  // "organic" intent
  {
    pattern: /organic/i,
    getSuggestions: () => [
      {
        id: 'organic-farms',
        text: 'Organic farm shops',
        type: 'action',
        href: '/categories/organic',
        highlight: 'Organic',
        icon: Leaf,
        iconColor: 'text-emerald-500',
      },
    ],
  },
  // "season" / "seasonal" intent
  {
    pattern: /season|fresh|whats?\s?in/i,
    getSuggestions: () => {
      const inSeason = getProduceInSeason(getCurrentMonth()).slice(0, 2)
      return [
        {
          id: 'seasonal-calendar',
          text: "What's in season now",
          type: 'action',
          href: '/seasonal',
          icon: Sparkles,
          iconColor: 'text-amber-500',
        },
        ...inSeason.map((p) => ({
          id: `season-${p.slug}`,
          text: `${p.name} is ${p.seasonStatus === 'peak' ? 'at peak' : 'in season'}`,
          type: 'produce' as const,
          href: `/seasonal/${p.slug}`,
          highlight: p.seasonStatus === 'peak' ? 'Peak' : undefined,
          icon: Leaf,
          iconColor: 'text-emerald-500',
        })),
      ]
    },
  },
]

interface SearchSuggestionsProps {
  /** Current search query */
  query: string
  /** Maximum suggestions to show */
  limit?: number
  /** Callback when suggestion is selected */
  onSelect?: (suggestion: Suggestion) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Get trending/popular suggestions when no query
 */
function getTrendingSuggestions(): Suggestion[] {
  const inSeason = getProduceInSeason(getCurrentMonth())
  const peakItem = inSeason.find((p) => p.seasonStatus === 'peak')

  return [
    {
      id: 'trending-nearby',
      text: 'Farms near me',
      type: 'trending',
      href: '/map?nearby=true',
      icon: TrendingUp,
      iconColor: 'text-primary-500',
    },
    ...(peakItem
      ? [
          {
            id: `trending-${peakItem.slug}`,
            text: `${peakItem.name} at peak season`,
            type: 'trending' as const,
            href: `/seasonal/${peakItem.slug}`,
            highlight: 'Peak',
            icon: Sparkles,
            iconColor: 'text-amber-500',
          },
        ]
      : []),
    {
      id: 'trending-pyo',
      text: 'Pick Your Own farms',
      type: 'trending',
      href: '/categories/pick-your-own',
      icon: Leaf,
      iconColor: 'text-emerald-500',
    },
  ]
}

/**
 * Get suggestions based on query
 */
function getSuggestions(query: string, limit: number): Suggestion[] {
  if (!query.trim()) {
    return getTrendingSuggestions().slice(0, limit)
  }

  const q = query.toLowerCase().trim()
  const suggestions: Suggestion[] = []

  // Check intent patterns first
  for (const { pattern, getSuggestions: getIntentSuggestions } of INTENT_PATTERNS) {
    const match = q.match(pattern)
    if (match) {
      suggestions.push(...getIntentSuggestions(match))
    }
  }

  // Search produce
  PRODUCE.forEach((p) => {
    if (p.name.toLowerCase().startsWith(q) || p.slug.startsWith(q)) {
      suggestions.push({
        id: `produce-${p.slug}`,
        text: p.name,
        type: 'produce',
        href: `/seasonal/${p.slug}`,
        icon: Leaf,
        iconColor: 'text-emerald-500',
      })
    }
  })

  // Search counties
  COUNTIES.forEach((county) => {
    if (county.toLowerCase().startsWith(q)) {
      suggestions.push({
        id: `county-${county.toLowerCase()}`,
        text: `Farms in ${county}`,
        type: 'county',
        href: `/counties/${county.toLowerCase().replace(/\s+/g, '-')}`,
        icon: MapPin,
        iconColor: 'text-blue-500',
      })
    }
  })

  // Deduplicate by id
  const seen = new Set<string>()
  return suggestions
    .filter((s) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })
    .slice(0, limit)
}

/**
 * Predictive search suggestions component.
 */
export function SearchSuggestions({
  query,
  limit = 5,
  onSelect,
  className = '',
}: SearchSuggestionsProps) {
  const suggestions = useMemo(() => getSuggestions(query, limit), [query, limit])

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Section header */}
      <p className="px-2 py-1 text-caption text-slate-500 dark:text-slate-400 font-medium">
        {query.trim() ? 'Suggestions' : 'Trending'}
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon

          return (
            <button
              key={suggestion.id}
              onClick={() => onSelect?.(suggestion)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                'text-small text-slate-700 dark:text-slate-300',
                'bg-slate-100 dark:bg-white/[0.06]',
                'hover:bg-slate-200 dark:hover:bg-white/[0.1]',
                'transition-colors duration-100',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', suggestion.iconColor)} />
              <span>{suggestion.text}</span>
              {suggestion.highlight && (
                <span className="px-1 py-0.5 text-[10px] font-semibold rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  {suggestion.highlight}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SearchSuggestions
