'use client'

import { useEffect } from 'react'
import { trackFarmShop, trackPageView } from '@/lib/analytics'

interface FarmAnalyticsProps {
  slug: string
  name: string
}

export default function FarmAnalytics({ slug, name }: FarmAnalyticsProps) {
  useEffect(() => {
    // Track farm page view on mount
    trackPageView(`/shop/${slug}`, `${name} - Farm Shop`)
    trackFarmShop(slug, name, 'view')
  }, [slug, name])

  // This component doesn't render anything
  return null
}
