// Determine the correct site URL based on environment
const getSiteUrl = () => {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // In production, use the configured URL or fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk'
}

export const SITE_URL = getSiteUrl()
export const IS_PROD = process.env.NODE_ENV === 'production'
export const CONSENT_COOKIE = 'fc_consent' // value: json like {"ads":true,"analytics":false}
