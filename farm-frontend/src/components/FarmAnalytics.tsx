'use client'

import { useEffect } from 'react'
import { trackFarmView } from '@/lib/analytics'

interface FarmAnalyticsProps {
  slug: string
  name: string
}

export default function FarmAnalytics({ slug, name }: FarmAnalyticsProps) {
  useEffect(() => {
    // Track farm page view on mount
    trackFarmView(slug, name)
  }, [slug, name])

  // This component doesn't render anything
  return null
}
