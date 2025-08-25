'use client'

import { useEffect } from 'react'
import { trackProduceView } from '@/lib/analytics'

interface ProduceAnalyticsProps {
  slug: string
  name: string
}

export default function ProduceAnalytics({ slug, name }: ProduceAnalyticsProps) {
  useEffect(() => {
    try {
      // Track produce page view on mount
      trackProduceView(slug, name)
    } catch (error) {
      // Silently fail in production, log in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn('ProduceAnalytics error:', error)
      }
    }
  }, [slug, name])

  // This component doesn't render anything
  return null
}
