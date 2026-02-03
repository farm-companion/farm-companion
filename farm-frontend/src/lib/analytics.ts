// Google Analytics 4 Integration
// Enhanced analytics using existing consent system

// Declare gtag function for TypeScript
declare global {
  function gtag(...args: any[]): void
}

// Check if GA4 is enabled and user has consented
export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check existing consent system
  const consent = (() => {
    try { 
      return JSON.parse(decodeURIComponent((document.cookie.split('; ').find(c=>c.startsWith('fc_consent='))||'').split('=')[1]||'{}')) 
    }
    catch { 
      return {} 
    }
  })() as { analytics?: boolean }
  
  const gaEnabled = process.env.NEXT_PUBLIC_GA_ENABLED === 'true'
  
  return gaEnabled && consent.analytics === true
}

// Get the appropriate GA4 measurement ID
export function getGA4MeasurementId(): string | null {
  if (typeof window === 'undefined') return null
  
  const isDev = process.env.NODE_ENV === 'development'
  const devId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_DEV
  const prodId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  
  return isDev ? (devId || prodId || null) : (prodId || null)
}

// Simple tracking functions using existing gtag
export function trackEvent(action: string, parameters?: Record<string, any>): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined' || !window.gtag) return
  
  window.gtag('event', action, parameters)
}

// Track page views
export function trackPageView(pagePath: string, pageTitle: string): void {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href
  })
}

// Track farm shop events
export function trackFarmShop(farmId: string, farmName: string, action: string, county?: string): void {
  trackEvent('farm_shop_interaction', {
    farm_id: farmId,
    farm_name: farmName,
    action: action,
    county: county
  })
}

// Track map events
export function trackMap(action: string, details?: Record<string, any>): void {
  trackEvent('map_interaction', {
    action: action,
    ...details
  })
}

// Track search events
export function trackSearch(query: string, resultsCount: number, searchType: string = 'general'): void {
  trackEvent('search', {
    search_term: query,
    results_count: resultsCount,
    search_type: searchType
  })
}

// Track form submissions
export function trackForm(formName: string, success: boolean, details?: Record<string, any>): void {
  trackEvent('form_submit', {
    form_name: formName,
    success: success,
    ...details
  })
}

// Track errors
export function trackError(error: string, details?: Record<string, any>): void {
  trackEvent('exception', {
    description: error,
    fatal: false,
    ...details
  })
}