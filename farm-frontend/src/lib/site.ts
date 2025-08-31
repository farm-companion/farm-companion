// Determine the correct site URL based on environment
const getSiteUrl = () => {
  // Always use production URL for now
  return 'https://www.farmcompanion.co.uk'
}

export const SITE_URL = getSiteUrl()
export const IS_PROD = process.env.NODE_ENV === 'production'
export const CONSENT_COOKIE = 'fc_consent' // value: json like {"ads":true,"analytics":false}
