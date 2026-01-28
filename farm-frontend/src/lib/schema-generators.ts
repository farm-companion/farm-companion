/**
 * Schema.org Structured Data Generators
 *
 * Comprehensive LocalBusiness and related schema generators for farm shops.
 * Follows Google's structured data guidelines for rich results.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/local-business
 * @see https://schema.org/LocalBusiness
 */

import { SITE_URL } from '@/lib/site'

// =============================================================================
// TYPES
// =============================================================================

export interface FarmForSchema {
  id: string
  name: string
  slug: string
  description?: string | null
  location: {
    lat: number
    lng: number
    address: string
    city?: string
    county: string
    postcode: string
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  hours?: Array<{
    day: string
    open: string
    close: string
    closed?: boolean
  }>
  offerings?: string[]
  amenities?: string[]
  images?: Array<string | { url: string; alt?: string }>
  verified?: boolean
  rating?: number | null
  reviewCount?: number
}

export interface SchemaOptions {
  includeAggregateRating?: boolean
  includeAmenities?: boolean
  includeProducts?: boolean
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert day abbreviation to schema.org day URL
 */
function dayToSchemaUrl(day: string): string | undefined {
  const dayMap: Record<string, string> = {
    'mon': 'https://schema.org/Monday',
    'monday': 'https://schema.org/Monday',
    'tue': 'https://schema.org/Tuesday',
    'tuesday': 'https://schema.org/Tuesday',
    'wed': 'https://schema.org/Wednesday',
    'wednesday': 'https://schema.org/Wednesday',
    'thu': 'https://schema.org/Thursday',
    'thursday': 'https://schema.org/Thursday',
    'fri': 'https://schema.org/Friday',
    'friday': 'https://schema.org/Friday',
    'sat': 'https://schema.org/Saturday',
    'saturday': 'https://schema.org/Saturday',
    'sun': 'https://schema.org/Sunday',
    'sunday': 'https://schema.org/Sunday',
  }
  return dayMap[day.toLowerCase()]
}

/**
 * Extract image URLs from mixed image array
 */
function extractImageUrls(images?: Array<string | { url: string }>): string[] {
  if (!images || images.length === 0) return []
  return images
    .slice(0, 5)
    .map((img) => (typeof img === 'string' ? img : img.url))
    .filter(Boolean)
}

/**
 * Map amenity IDs to schema.org amenity features
 */
function mapAmenitiesToSchema(amenities?: string[]): object[] | undefined {
  if (!amenities || amenities.length === 0) return undefined

  const amenityMap: Record<string, { name: string; value: string }> = {
    wheelchair: { name: 'Wheelchair Accessible', value: 'true' },
    parking: { name: 'Free Parking', value: 'true' },
    cafe: { name: 'On-site Cafe', value: 'true' },
    pyo: { name: 'Pick Your Own', value: 'true' },
    organic: { name: 'Organic Produce', value: 'true' },
    delivery: { name: 'Delivery Available', value: 'true' },
    card: { name: 'Card Payment Accepted', value: 'true' },
    dogs: { name: 'Dog Friendly', value: 'true' },
    toilets: { name: 'Public Toilets', value: 'true' },
    children: { name: 'Child Friendly', value: 'true' },
  }

  return amenities
    .filter((id) => amenityMap[id])
    .map((id) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenityMap[id].name,
      value: amenityMap[id].value,
    }))
}

// =============================================================================
// SCHEMA GENERATORS
// =============================================================================

/**
 * Generate comprehensive LocalBusiness schema for a farm shop
 *
 * Includes:
 * - Core LocalBusiness properties
 * - GeoCoordinates for map integration
 * - OpeningHoursSpecification for hours
 * - AggregateRating if available
 * - AmenityFeature for facilities
 * - PaymentAccepted and CurrenciesAccepted
 */
export function generateLocalBusinessSchema(
  farm: FarmForSchema,
  options: SchemaOptions = {}
): object {
  const { includeAggregateRating = true, includeAmenities = true } = options

  const farmUrl = `${SITE_URL}/shop/${encodeURIComponent(farm.slug)}`
  const images = extractImageUrls(farm.images)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    '@id': `${farmUrl}#business`,
    name: farm.name,
    url: farmUrl,
    description:
      farm.description || `${farm.name} - Farm shop in ${farm.location.county}`,

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: farm.location.address,
      addressLocality: farm.location.city || farm.location.county,
      addressRegion: farm.location.county,
      postalCode: farm.location.postcode,
      addressCountry: 'GB',
    },

    // Geo coordinates
    geo: {
      '@type': 'GeoCoordinates',
      latitude: farm.location.lat,
      longitude: farm.location.lng,
    },

    // Images
    ...(images.length > 0 && { image: images }),

    // Contact
    ...(farm.contact?.phone && { telephone: farm.contact.phone }),
    ...(farm.contact?.email && { email: farm.contact.email }),
    ...(farm.contact?.website && { sameAs: [farm.contact.website] }),

    // Opening hours
    ...(farm.hours &&
      farm.hours.length > 0 && {
        openingHoursSpecification: farm.hours
          .filter((h) => h.open && h.close && !h.closed)
          .map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: dayToSchemaUrl(h.day),
            opens: h.open,
            closes: h.close,
          }))
          .filter((h) => h.dayOfWeek),
      }),

    // Offerings as keywords
    ...(farm.offerings &&
      farm.offerings.length > 0 && {
        keywords: farm.offerings.join(', '),
      }),

    // Amenities
    ...(includeAmenities &&
      farm.amenities &&
      farm.amenities.length > 0 && {
        amenityFeature: mapAmenitiesToSchema(farm.amenities),
      }),

    // Aggregate rating
    ...(includeAggregateRating &&
      farm.rating &&
      farm.rating > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: farm.rating.toFixed(1),
          bestRating: '5',
          worstRating: '1',
          ratingCount: farm.reviewCount || 1,
        },
      }),

    // Verification badge
    ...(farm.verified && {
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Verification',
        name: 'Verified Farm Shop',
      },
    }),

    // Business details
    priceRange: '££',
    paymentAccepted: 'Cash, Credit Card, Debit Card',
    currenciesAccepted: 'GBP',
    servesCuisine: 'British',

    // Area served
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: farm.location.lat,
        longitude: farm.location.lng,
      },
      geoRadius: '50000', // 50km radius
    },
  }

  return schema
}

/**
 * Generate Place schema for enhanced location information
 */
export function generatePlaceSchema(farm: FarmForSchema): object {
  const farmUrl = `${SITE_URL}/shop/${encodeURIComponent(farm.slug)}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    '@id': `${farmUrl}#place`,
    name: farm.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: farm.location.address,
      addressLocality: farm.location.city || farm.location.county,
      addressRegion: farm.location.county,
      postalCode: farm.location.postcode,
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: farm.location.lat,
      longitude: farm.location.lng,
    },
    hasMap: `https://www.google.com/maps?q=${farm.location.lat},${farm.location.lng}`,
  }
}

/**
 * Generate Product schema for farm offerings
 */
export function generateProductSchema(
  farm: FarmForSchema,
  offerings: string[]
): object[] {
  const farmUrl = `${SITE_URL}/shop/${encodeURIComponent(farm.slug)}`

  return offerings.slice(0, 10).map((offering, index) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${farmUrl}#product-${index}`,
    name: offering,
    description: `Fresh ${offering.toLowerCase()} from ${farm.name}`,
    brand: {
      '@type': 'Brand',
      name: farm.name,
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'LocalBusiness',
        '@id': `${farmUrl}#business`,
        name: farm.name,
      },
    },
  }))
}

/**
 * Generate complete schema array for a farm shop page
 *
 * Combines LocalBusiness, Place, Breadcrumb, and optionally Product schemas
 */
export function generateFarmPageSchemas(
  farm: FarmForSchema,
  options: SchemaOptions & { includeProducts?: boolean } = {}
): object[] {
  const { includeProducts = false } = options
  const farmUrl = `${SITE_URL}/shop/${encodeURIComponent(farm.slug)}`

  const schemas: object[] = [
    // Primary LocalBusiness schema
    generateLocalBusinessSchema(farm, options),

    // Breadcrumb schema
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${farmUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Farm Shops',
          item: `${SITE_URL}/shop`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: farm.location.county,
          item: `${SITE_URL}/counties/${farm.location.county.toLowerCase().replace(/\s+/g, '-')}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: farm.name,
          item: farmUrl,
        },
      ],
    },
  ]

  // Add product schemas if requested and offerings exist
  if (includeProducts && farm.offerings && farm.offerings.length > 0) {
    schemas.push(...generateProductSchema(farm, farm.offerings))
  }

  return schemas
}

/**
 * Generate WebPage schema for any page
 */
export function generateWebPageSchema(
  title: string,
  description: string,
  url: string,
  options: {
    datePublished?: string
    dateModified?: string
    author?: string
  } = {}
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    name: title,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      name: 'Farm Companion',
      url: SITE_URL,
    },
    ...(options.datePublished && { datePublished: options.datePublished }),
    ...(options.dateModified && { dateModified: options.dateModified }),
    ...(options.author && {
      author: {
        '@type': 'Organization',
        name: options.author,
      },
    }),
  }
}

// =============================================================================
// FAQ SCHEMA
// =============================================================================

export interface FAQItem {
  question: string
  answer: string
}

/**
 * Generate FAQPage schema for rich snippets
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 *
 * @example
 * ```tsx
 * const faqSchema = generateFAQPageSchema([
 *   { question: 'What are your opening hours?', answer: 'We are open 9am-5pm daily.' },
 *   { question: 'Do you offer delivery?', answer: 'Yes, we deliver within 10 miles.' },
 * ], 'https://example.com/faq')
 * ```
 */
export function generateFAQPageSchema(
  faqs: FAQItem[],
  pageUrl?: string
): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  if (pageUrl) {
    schema['@id'] = `${pageUrl}#faq`
    schema.url = pageUrl
  }

  return schema
}

/**
 * Generate FAQ schema for a county page
 *
 * Customizes generic FAQs with county-specific information
 */
export function generateCountyFAQSchema(
  countyName: string,
  faqs: FAQItem[],
  pageUrl: string
): object {
  // Customize FAQs with county name
  const customizedFaqs = faqs.map((faq) => ({
    question: faq.question.replace('this county', countyName),
    answer: faq.answer.replace(/this county/g, countyName),
  }))

  return generateFAQPageSchema(customizedFaqs, pageUrl)
}

/**
 * Generate FAQ schema for a farm shop page
 *
 * Creates dynamic FAQs based on farm data
 */
export function generateFarmFAQSchema(
  farm: FarmForSchema,
  pageUrl: string
): object {
  const faqs: FAQItem[] = []

  // Opening hours FAQ
  if (farm.hours && farm.hours.length > 0) {
    const openDays = farm.hours
      .filter((h) => !h.closed && h.open && h.close)
      .map((h) => `${h.day}: ${h.open}-${h.close}`)
      .join(', ')

    if (openDays) {
      faqs.push({
        question: `What are the opening hours for ${farm.name}?`,
        answer: `${farm.name} is open ${openDays}. We recommend checking before visiting as hours may vary seasonally.`,
      })
    }
  }

  // Location FAQ
  faqs.push({
    question: `Where is ${farm.name} located?`,
    answer: `${farm.name} is located at ${farm.location.address}, ${farm.location.city || farm.location.county}, ${farm.location.postcode}. You can find directions on our map or use the postcode for sat nav.`,
  })

  // Contact FAQ
  if (farm.contact?.phone || farm.contact?.email) {
    const contactMethods: string[] = []
    if (farm.contact.phone) contactMethods.push(`phone at ${farm.contact.phone}`)
    if (farm.contact.email) contactMethods.push(`email at ${farm.contact.email}`)

    faqs.push({
      question: `How can I contact ${farm.name}?`,
      answer: `You can contact ${farm.name} by ${contactMethods.join(' or ')}. ${farm.contact.website ? `Visit their website at ${farm.contact.website} for more information.` : ''}`,
    })
  }

  // Products FAQ
  if (farm.offerings && farm.offerings.length > 0) {
    const products = farm.offerings.slice(0, 8).join(', ')
    faqs.push({
      question: `What products does ${farm.name} sell?`,
      answer: `${farm.name} offers a range of farm-fresh products including ${products}${farm.offerings.length > 8 ? ' and more' : ''}. Product availability may vary seasonally.`,
    })
  }

  // Amenities FAQ
  if (farm.amenities && farm.amenities.length > 0) {
    const amenityDescriptions: Record<string, string> = {
      wheelchair: 'wheelchair accessible',
      parking: 'free parking',
      cafe: 'an on-site cafe',
      pyo: 'pick your own opportunities',
      organic: 'organic produce',
      delivery: 'delivery services',
      card: 'card payment facilities',
      dogs: 'dog-friendly areas',
      toilets: 'public toilets',
      children: 'child-friendly facilities',
    }

    const amenityList = farm.amenities
      .filter((a) => amenityDescriptions[a])
      .map((a) => amenityDescriptions[a])

    if (amenityList.length > 0) {
      faqs.push({
        question: `What facilities are available at ${farm.name}?`,
        answer: `${farm.name} offers ${amenityList.join(', ')}. Please contact the farm directly for specific accessibility requirements or to confirm current facilities.`,
      })
    }
  }

  return generateFAQPageSchema(faqs, pageUrl)
}

/**
 * Generate HowTo schema for farm-related activities
 *
 * Useful for PYO farms, farm visits, etc.
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string }>,
  options: {
    totalTime?: string // ISO 8601 duration, e.g., "PT30M"
    estimatedCost?: { currency: string; value: string }
    supply?: string[]
    tool?: string[]
  } = {}
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
    ...(options.totalTime && { totalTime: options.totalTime }),
    ...(options.estimatedCost && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: options.estimatedCost.currency,
        value: options.estimatedCost.value,
      },
    }),
    ...(options.supply &&
      options.supply.length > 0 && {
        supply: options.supply.map((s) => ({
          '@type': 'HowToSupply',
          name: s,
        })),
      }),
    ...(options.tool &&
      options.tool.length > 0 && {
        tool: options.tool.map((t) => ({
          '@type': 'HowToTool',
          name: t,
        })),
      }),
  }
}
