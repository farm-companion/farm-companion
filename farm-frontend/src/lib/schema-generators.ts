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
