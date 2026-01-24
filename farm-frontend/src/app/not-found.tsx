'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Redirect to map with search query
    window.location.href = `/map?search=${encodeURIComponent(searchQuery.trim())}`
  }

  const popularDestinations = [
    {
      title: 'Find Farm Shops',
      description: 'Discover local farm shops on our interactive map',
      href: '/map',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: 'Browse by County',
      description: 'Explore farm shops organized by county',
      href: '/counties',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 4h6" />
        </svg>
      )
    },
    {
      title: 'Seasonal Guide',
      description: 'See what&apos;s fresh and in season right now',
      href: '/seasonal',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Add Your Farm',
      description: 'Join the Farm Companion community',
      href: '/add',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-background-canvas">
      <main id="main" className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 max-w-4xl mx-auto">
          {/* 404 Display */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold text-brand-primary mb-4" aria-label="Error 404">
              404
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px bg-border-default flex-1 max-w-24"></div>
              <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="h-px bg-border-default flex-1 max-w-24"></div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-text-heading mb-6">
            This page has wandered off to greener pastures
          </h1>
          <p className="text-xl text-text-muted mb-8 max-w-2xl mx-auto">
            The page you&apos;re looking for isn&apos;t here, but we can help you find fresh, 
            local farm shops and seasonal produce across the UK.
          </p>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/" className="btn-primary">
              Return to Homepage
            </Link>
            <Link href="/map" className="btn-secondary">
              Explore Farm Shops
            </Link>
          </div>

          {/* Search Section */}
          <div className="bg-background-surface rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-text-heading mb-4">
              Looking for something specific?
            </h2>
            <p className="text-text-muted mb-6">
              Search for farm shops, counties, or seasonal produce
            </p>
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="search" className="sr-only">
                    Search for farm shops, counties, or seasonal produce
                  </label>
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search farm shops, counties..."
                    className="input w-full"
                    disabled={isSearching}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-12 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-heading text-center mb-4">
            Popular Destinations
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-2xl mx-auto">
            Discover authentic farm experiences and fresh local produce across the UK
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <Link
                key={index}
                href={destination.href}
                className="card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
              >
                <div className="text-brand-primary mb-4 group-hover:text-brand-primary transition-colors">
                  {destination.icon}
                </div>
                <h3 className="text-heading font-bold text-text-heading mb-2 group-hover:text-brand-primary transition-colors">
                  {destination.title}
                </h3>
                <p className="text-text-muted">
                  {destination.description}
                </p>
                <div className="mt-4 text-brand-primary text-caption font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Community Section */}
        <section className="py-16 bg-background-surface rounded-lg max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-heading mb-4">
            Join the Farm Companion Community
          </h2>
          <p className="text-text-muted mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a farm owner looking to showcase your produce or someone passionate 
            about supporting local agriculture, there&apos;s a place for you in our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/add" className="btn-primary">
              Add Your Farm Shop
            </Link>
            <Link href="/about" className="btn-secondary">
              Learn More About Us
            </Link>
          </div>
        </section>

        {/* Help Section */}
        <section className="py-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-text-heading mb-4">
            Still need help?
          </h2>
          <p className="text-text-muted mb-6">
            If you believe this is an error or you&apos;re looking for something that should be here, 
            we&apos;d love to help you find it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </Link>
            <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back()
                } else {
                  window.location.href = '/'
                }
              }}
              className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
