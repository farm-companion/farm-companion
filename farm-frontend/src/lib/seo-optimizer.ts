// Comprehensive SEO Optimization System
// PuredgeOS 3.0 Compliant SEO Management

import { Metadata } from 'next'
import { SITE_URL } from './site'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  noindex?: boolean
  nofollow?: boolean
  structuredData?: any
  breadcrumbs?: Array<{ name: string; url: string }>
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  locale?: string
  alternateLocales?: Array<{ locale: string; url: string }>
}

export interface FarmSEOData {
  name: string
  slug: string
  description: string
  address: string
  county: string
  postcode: string
  coordinates: { lat: number; lng: number }
  phone?: string
  website?: string
  email?: string
  hours?: Array<{ day: string; open: string; close: string }>
  offerings?: string[]
  images?: Array<{ url: string; alt: string }>
  updatedAt?: string
}

export interface ProduceSEOData {
  name: string
  slug: string
  description: string
  season: string
  months: number[]
  images?: Array<{ url: string; alt: string }>
  farms?: Array<{ name: string; slug: string; county: string }>
}

// Generate comprehensive metadata for any page
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = '/og.jpg',
    ogType = 'website',
    twitterCard = 'summary_large_image',
    noindex = false,
    nofollow = false,
    author,
    publishedTime,
    modifiedTime,
    section,
    tags = [],
    locale = 'en_GB',
    alternateLocales = []
  } = config

  const fullTitle = title.includes('Farm Companion') ? title : `${title} | Farm Companion`
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: author ? [{ name: author }] : undefined,
    creator: 'Farm Companion',
    publisher: 'Farm Companion',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLocales.reduce((acc, alt) => {
        acc[alt.locale] = alt.url
        return acc
      }, {} as Record<string, string>)
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      nocache: false,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: ogType,
      url: canonicalUrl,
      title: fullTitle,
      description,
      siteName: 'Farm Companion',
      locale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - Farm Companion`,
          type: 'image/jpeg',
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: twitterCard,
      title: fullTitle,
      description,
      images: [ogImageUrl],
      creator: '@farmcompanion',
      site: '@farmcompanion',
    },
    other: {
      'theme-color': '#00C2B2',
      'color-scheme': 'light dark',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'Farm Companion',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#00C2B2',
      'msapplication-config': '/browserconfig.xml',
    },
  }

  return metadata
}

// Generate farm-specific metadata
export function generateFarmMetadata(farm: FarmSEOData): Metadata {
  const title = `${farm.name} - Farm Shop in ${farm.county}`
  const description = `${farm.description || `Visit ${farm.name} in ${farm.county} for fresh local produce. ${farm.address}`}`
  const keywords = [
    'farm shop',
    farm.name.toLowerCase(),
    farm.county.toLowerCase(),
    farm.postcode,
    'local produce',
    'fresh food',
    'farm shop near me',
    ...(farm.offerings || [])
  ]

  return generateMetadata({
    title,
    description,
    keywords,
    canonical: `/shop/${farm.slug}`,
    ogType: 'website',
    structuredData: generateFarmStructuredData(farm),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Farm Shops', url: '/shop' },
      { name: farm.county, url: `/shop?county=${encodeURIComponent(farm.county)}` },
      { name: farm.name, url: `/shop/${farm.slug}` }
    ]
  })
}

// Generate produce-specific metadata
export function generateProduceMetadata(produce: ProduceSEOData): Metadata {
  const title = `${produce.name} - ${produce.season} Guide`
  const description = `${produce.description || `Learn about ${produce.name} season, when to buy, and where to find fresh ${produce.name} in the UK.`}`
  const keywords = [
    produce.name.toLowerCase(),
    'seasonal produce',
    'when in season',
    'UK produce',
    'fresh',
    'local',
    'seasonal guide',
    produce.season.toLowerCase()
  ]

  return generateMetadata({
    title,
    description,
    keywords,
    canonical: `/seasonal/${produce.slug}`,
    ogType: 'article',
    structuredData: generateProduceStructuredData(produce),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Seasonal Guide', url: '/seasonal' },
      { name: produce.name, url: `/seasonal/${produce.slug}` }
    ]
  })
}

// Generate farm structured data (JSON-LD)
export function generateFarmStructuredData(farm: FarmSEOData): any {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    '@id': `${SITE_URL}/shop/${farm.slug}`,
    name: farm.name,
    description: farm.description,
    url: `${SITE_URL}/shop/${farm.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: farm.address,
      addressLocality: farm.county,
      postalCode: farm.postcode,
      addressCountry: 'GB'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: farm.coordinates.lat,
      longitude: farm.coordinates.lng
    },
    telephone: farm.phone,
    email: farm.email,
    website: farm.website,
    ...(farm.hours && {
      openingHoursSpecification: farm.hours.map(hour => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hour.day,
        opens: hour.open,
        closes: hour.close
      }))
    }),
    ...(farm.images && farm.images.length > 0 && {
      image: farm.images.map(img => ({
        '@type': 'ImageObject',
        url: img.url,
        caption: img.alt
      }))
    }),
    ...(farm.offerings && farm.offerings.length > 0 && {
      makesOffer: farm.offerings.map(offering => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: offering
        }
      }))
    }),
    ...(farm.updatedAt && {
      dateModified: farm.updatedAt
    })
  }

  return structuredData
}

// Generate produce structured data (JSON-LD)
export function generateProduceStructuredData(produce: ProduceSEOData): any {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_URL}/seasonal/${produce.slug}`,
    headline: `${produce.name} - ${produce.season} Guide`,
    description: produce.description,
    url: `${SITE_URL}/seasonal/${produce.slug}`,
    author: {
      '@type': 'Organization',
      name: 'Farm Companion',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'Farm Companion',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og.jpg`
      }
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/seasonal/${produce.slug}`
    },
    ...(produce.images && produce.images.length > 0 && {
      image: produce.images.map(img => ({
        '@type': 'ImageObject',
        url: img.url,
        caption: img.alt
      }))
    }),
    ...(produce.farms && produce.farms.length > 0 && {
      mentions: produce.farms.map(farm => ({
        '@type': 'GroceryStore',
        name: farm.name,
        url: `${SITE_URL}/shop/${farm.slug}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: farm.county,
          addressCountry: 'GB'
        }
      }))
    }),
    about: {
      '@type': 'Thing',
      name: produce.name,
      description: `Seasonal information about ${produce.name} in the UK`
    },
    keywords: [
      produce.name,
      'seasonal produce',
      'UK produce',
      'when in season',
      produce.season
    ].join(', ')
  }

  return structuredData
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`
    }))
  }
}

// Generate FAQ structured data
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

// Generate local business structured data
export function generateLocalBusinessStructuredData(business: {
  name: string
  description: string
  address: string
  phone?: string
  website?: string
  coordinates: { lat: number; lng: number }
  hours?: Array<{ day: string; open: string; close: string }>
  images?: Array<{ url: string; alt: string }>
}): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressCountry: 'GB'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.coordinates.lat,
      longitude: business.coordinates.lng
    },
    telephone: business.phone,
    url: business.website,
    ...(business.hours && {
      openingHoursSpecification: business.hours.map(hour => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hour.day,
        opens: hour.open,
        closes: hour.close
      }))
    }),
    ...(business.images && business.images.length > 0 && {
      image: business.images.map(img => ({
        '@type': 'ImageObject',
        url: img.url,
        caption: img.alt
      }))
    })
  }
}

// Generate organization structured data
export function generateOrganizationStructuredData(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: 'Farm Companion',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og.jpg`,
      width: 1200,
      height: 630
    },
    description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@farmcompanion.co.uk'
    },
    sameAs: [
      'https://twitter.com/farmcompanion',
      'https://facebook.com/farmcompanion'
    ],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/map?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }
}

// Generate website structured data
export function generateWebsiteStructuredData(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: 'Farm Companion',
    description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/map?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@id': `${SITE_URL}#organization`
    }
  }
}

// SEO optimization utilities
export function optimizeTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title
  
  const words = title.split(' ')
  let optimized = ''
  
  for (const word of words) {
    if ((optimized + ' ' + word).length <= maxLength) {
      optimized += (optimized ? ' ' : '') + word
    } else {
      break
    }
  }
  
  return optimized || title.substring(0, maxLength - 3) + '...'
}

export function optimizeDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description
  
  return description.substring(0, maxLength - 3) + '...'
}

export function generateKeywords(baseKeywords: string[], additionalKeywords: string[] = []): string[] {
  const allKeywords = [...baseKeywords, ...additionalKeywords]
  const uniqueKeywords = [...new Set(allKeywords.map(k => k.toLowerCase()))]
  
  // Limit to 10 keywords to avoid keyword stuffing
  return uniqueKeywords.slice(0, 10)
}

// Generate meta tags for social sharing
export function generateSocialMetaTags(config: SEOConfig): Record<string, string> {
  const {
    title,
    description,
    ogImage = '/og.jpg',
    ogType = 'website',
    twitterCard = 'summary_large_image'
  } = config

  const fullTitle = title.includes('Farm Companion') ? title : `${title} | Farm Companion`
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`

  return {
    'og:title': fullTitle,
    'og:description': description,
    'og:image': ogImageUrl,
    'og:type': ogType,
    'og:site_name': 'Farm Companion',
    'og:locale': 'en_GB',
    'twitter:card': twitterCard,
    'twitter:title': fullTitle,
    'twitter:description': description,
    'twitter:image': ogImageUrl,
    'twitter:site': '@farmcompanion',
    'twitter:creator': '@farmcompanion'
  }
}
