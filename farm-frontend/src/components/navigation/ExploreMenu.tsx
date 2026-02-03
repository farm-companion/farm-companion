'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const FIND_FARMS = [
  { label: 'Near Me', href: '/map?nearby=true' },
  { label: 'Search by Postcode', href: '/map' },
  { label: 'Interactive Map', href: '/map' },
]

const EDITORS_PICKS = [
  { label: 'Best for Cheese', href: '/best' },
  { label: 'Best for Meat', href: '/best' },
  { label: 'Best for Families', href: '/best' },
  { label: 'Hidden Gems', href: '/best' },
]

const BY_REGION = [
  { label: 'England', href: '/counties' },
  { label: 'Scotland', href: '/counties' },
  { label: 'Wales', href: '/counties' },
  { label: 'N. Ireland', href: '/counties' },
]

const POPULAR_SEARCHES = [
  { label: 'Farm shops Surrey', href: '/map?q=farm+shops+surrey' },
  { label: 'PYO Kent', href: '/map?q=pyo+kent' },
  { label: 'Organic butchers London', href: '/map?q=organic+butchers+london' },
]

interface ExploreMenuProps {
  onClose: () => void
}

export function ExploreMenu({ onClose }: ExploreMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 0)
    document.addEventListener('keydown', handleEscape)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50',
        'w-[min(800px,calc(100vw-48px))]',
        'bg-white dark:bg-[#121214] rounded-xl',
        'shadow-xl border border-zinc-200 dark:border-white/[0.08]',
        'p-6',
      )}
      role="menu"
      style={{ animation: 'exploreIn 200ms ease-out' }}
    >
      <div className="grid grid-cols-3 gap-8">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 mb-3">
            Find Farms
          </h3>
          <ul className="space-y-1">
            {FIND_FARMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-2 px-2 -mx-2 rounded-lg text-[14px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 mb-3">
            Editor&apos;s Picks
          </h3>
          <ul className="space-y-1">
            {EDITORS_PICKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-2 px-2 -mx-2 rounded-lg text-[14px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 mb-3">
            By County
          </h3>
          <ul className="space-y-1">
            {BY_REGION.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg text-[14px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                  {item.label}
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/[0.06]">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 mb-2">
          Popular Searches
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {POPULAR_SEARCHES.map((item, i) => (
            <span key={item.label} className="flex items-center gap-2">
              <Link
                href={item.href}
                onClick={onClose}
                className="text-[13px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                {item.label}
              </Link>
              {i < POPULAR_SEARCHES.length - 1 && (
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
