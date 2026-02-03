'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, CheckCircle, X } from 'lucide-react'

interface ClaimFarm {
  id: string
  name: string
  slug: string
  county: string
  postcode: string
  address: string
  phone: string | null
  verified: boolean
}

interface ClaimSearchProps {
  farms: ClaimFarm[]
}

export function ClaimSearch({ farms }: ClaimSearchProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    return farms
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.postcode.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          f.county.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query, farms])

  const showResults = isFocused && query.length >= 2

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search by farm name, postcode, or county..."
          className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:border-primary-400 dark:focus:ring-primary-400/20 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-3">
                No farms found for "{query}"
              </p>
              <Link
                href="/add"
                className="text-[13px] font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Add your farm shop instead
              </Link>
            </div>
          ) : (
            <ul>
              {results.map((farm) => (
                <li key={farm.id}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">
                          {farm.name}
                        </span>
                        {farm.verified && (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                        {farm.address} | {farm.county} {farm.postcode}
                      </div>
                    </div>
                    <Link
                      href={`/claim/${farm.slug}`}
                      onClick={() => setIsFocused(false)}
                      className="flex-shrink-0 inline-flex items-center h-8 px-3 text-[12px] font-semibold text-white bg-slate-900 dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                      Claim
                    </Link>
                  </div>
                </li>
              ))}
              {results.length === 8 && (
                <li className="px-4 py-2 text-center text-[12px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30">
                  Showing first 8 results. Type more to narrow down.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
