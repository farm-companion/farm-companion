export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk'
export const IS_PROD = process.env.NODE_ENV === 'production'
export const CONSENT_COOKIE = 'fc_consent' // value: json like {"ads":true,"analytics":false}
