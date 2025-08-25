// Analytics utility for tracking user interactions
// Uses Vercel Analytics for privacy-friendly tracking

type AnalyticsEvent = {
  name: string
  properties?: Record<string, any>
}

// Track a custom analytics event
export function trackEvent(event: AnalyticsEvent) {
  try {
    // Only track in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Analytics Event:', event)
      return
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Use Vercel Analytics if available
    if (window.va && typeof window.va.track === 'function') {
      window.va.track(event.name, event.properties)
    }
  } catch (error) {
    // Silently fail in production, log in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Analytics error:', error)
    }
  }
}

// Track produce page view
export function trackProduceView(slug: string, name: string) {
  trackEvent({
    name: 'produce_view',
    properties: {
      produce_slug: slug,
      produce_name: name,
      page_type: 'produce_detail',
      timestamp: new Date().toISOString(),
    }
  })
}

// Track farm shop view
export function trackFarmView(slug: string, name: string) {
  trackEvent({
    name: 'farm_view',
    properties: {
      farm_slug: slug,
      farm_name: name,
      page_type: 'farm_detail',
      timestamp: new Date().toISOString(),
    }
  })
}

// Track map interaction
export function trackMapInteraction(action: string, properties?: Record<string, any>) {
  trackEvent({
    name: 'map_interaction',
    properties: {
      action,
      page_type: 'map',
      timestamp: new Date().toISOString(),
      ...properties
    }
  })
}

// Track seasonal page view
export function trackSeasonalView(month: number) {
  trackEvent({
    name: 'seasonal_view',
    properties: {
      month,
      page_type: 'seasonal',
      timestamp: new Date().toISOString(),
    }
  })
}

// Declare global types for Vercel Analytics
declare global {
  interface Window {
    va?: {
      track: (eventName: string, properties?: Record<string, any>) => void
    }
  }
}
