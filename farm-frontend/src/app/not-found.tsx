'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Layers, CalendarDays, Plus, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    window.location.href = `/map?search=${encodeURIComponent(searchQuery.trim())}`
  }

  const destinations = [
    {
      title: 'Find Farm Shops',
      description: 'Discover local farm shops on our interactive map',
      href: '/map',
      icon: MapPin,
    },
    {
      title: 'Browse by County',
      description: 'Explore farm shops organised by county',
      href: '/counties',
      icon: Layers,
    },
    {
      title: 'Seasonal Guide',
      description: "See what's fresh and in season right now",
      href: '/seasonal',
      icon: CalendarDays,
    },
    {
      title: 'Add Your Farm',
      description: 'Join the Farm Companion community',
      href: '/add',
      icon: Plus,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-8xl md:text-9xl font-bold text-slate-200 dark:text-slate-800 select-none mb-6" aria-label="Error 404">
            404
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Page not found
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            The page you're looking for doesn't exist, but we can help you find
            fresh, local farm shops and seasonal produce across the UK.
          </p>

          {/* Primary actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-sm font-semibold transition-all duration-200 hover:bg-slate-800 dark:hover:bg-white hover:shadow-md active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 active:scale-[0.98]"
            >
              <MapPin className="h-4 w-4" />
              Explore Farm Shops
            </Link>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              Looking for something specific?
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <label htmlFor="not-found-search" className="sr-only">
                Search for farm shops, counties, or seasonal produce
              </label>
              <input
                id="not-found-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farm shops, counties..."
                disabled={isSearching}
                className="flex-1 h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 transition-all duration-200 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                aria-label="Search"
              >
                {isSearching ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Navigation cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {destinations.map((d) => {
            const Icon = d.icon
            return (
              <Link
                key={d.href}
                href={d.href}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
              >
                <div className="mb-3 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  {d.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                  {d.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* Go back link */}
        <div className="text-center mt-12">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back()
              } else {
                window.location.href = '/'
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
