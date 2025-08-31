'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

export default function MapPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-canvas flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-primary" />
          <h1 className="text-xl font-semibold text-text-heading mb-2">Loading Map</h1>
          <p className="text-text-muted">Preparing your farm discovery experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-canvas">
      {/* Header */}
      <div className="bg-background-surface border-b border-border-default/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-heading">Farm Map</h1>
              <p className="text-text-muted">Discover local farm shops across the UK</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4" />
              <span>Map coming soon...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-12 h-12 text-brand-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text-heading mb-3">
            Interactive Map Coming Soon
          </h2>
          <p className="text-text-muted mb-6">
                         We&apos;re building a new, improved map experience to help you discover local farm shops more easily.
          </p>
          <div className="bg-background-surface rounded-lg p-4 border border-border-default/30">
            <h3 className="font-medium text-text-heading mb-2">What&apos;s Coming:</h3>
            <ul className="text-sm text-text-muted space-y-1">
              <li>• Interactive Google Maps integration</li>
              <li>• Farm shop markers and information</li>
              <li>• Search and filtering capabilities</li>
              <li>• Mobile-friendly design</li>
              <li>• Fast and reliable performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
