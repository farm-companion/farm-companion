'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, X, ChevronRight, Store } from 'lucide-react'

interface RecentFarm {
  slug: string
  name: string
  county: string
  viewedAt: number
}

const STORAGE_KEY = 'recent-farms'
const MAX_RECENT = 5

/**
 * Get recent farms from localStorage
 */
export function getRecentFarms(): RecentFarm[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const farms = JSON.parse(stored) as RecentFarm[]
    // Sort by most recent first
    return farms.sort((a, b) => b.viewedAt - a.viewedAt).slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

/**
 * Add a farm to recent farms list
 */
export function addRecentFarm(farm: { slug: string; name: string; county: string }) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecentFarms()
    // Remove if already exists
    const filtered = existing.filter(f => f.slug !== farm.slug)
    // Add to front
    const updated = [
      { ...farm, viewedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Silent fail
  }
}

/**
 * Clear all recent farms
 */
export function clearRecentFarms() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silent fail
  }
}

interface RecentFarmsProps {
  /** Compact mode for sidebar/floating display */
  compact?: boolean
  /** Maximum farms to show */
  maxItems?: number
  /** Optional class name */
  className?: string
}

export function RecentFarms({ compact = false, maxItems = 5, className = '' }: RecentFarmsProps) {
  const [farms, setFarms] = useState<RecentFarm[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setFarms(getRecentFarms().slice(0, maxItems))
  }, [maxItems])

  const handleClear = () => {
    clearRecentFarms()
    setFarms([])
  }

  if (!mounted || farms.length === 0) return null

  if (compact) {
    return (
      <div className={`bg-background-surface border border-border-default rounded-xl p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Recent</span>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-text-muted hover:text-text-body transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="space-y-1">
          {farms.map((farm) => (
            <Link
              key={farm.slug}
              href={`/shop/${farm.slug}`}
              className="group flex items-center gap-2 p-2 -mx-1 rounded-lg hover:bg-background-canvas transition-colors"
            >
              <Store className="w-4 h-4 text-text-muted shrink-0" />
              <span className="text-sm text-text-body truncate flex-1">{farm.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-heading flex items-center gap-2">
          <Clock className="w-5 h-5 text-text-muted" />
          Recently Viewed
        </h2>
        <button
          onClick={handleClear}
          className="text-sm text-text-muted hover:text-text-body transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm) => (
          <Link
            key={farm.slug}
            href={`/shop/${farm.slug}`}
            className="group flex items-center gap-3 p-4 rounded-xl border border-border-default bg-background-canvas hover:border-brand-primary/30 hover:shadow-md transition-all duration-fast ease-gentle-spring"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-text-heading group-hover:text-brand-primary transition-colors block truncate">
                {farm.name}
              </span>
              <span className="text-xs text-text-muted truncate block">{farm.county}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  )
}
