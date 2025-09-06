'use client'
import { GoogleAnalytics } from '@next/third-parties/google'

export default function AnalyticsLoader() {
  const consent = (() => {
    try { 
      return JSON.parse(decodeURIComponent((document.cookie.split('; ').find(c=>c.startsWith('fc_consent='))||'').split('=')[1]||'{}')) 
    }
    catch { 
      return {} 
    }
  })() as { analytics?: boolean }

  // Use existing environment variable
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID

  if (!consent.analytics || !measurementId) return null

  return (
    <GoogleAnalytics 
      gaId={measurementId}
    />
  )
}
