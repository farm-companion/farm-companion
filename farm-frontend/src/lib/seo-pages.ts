/**
 * SEO Programmatic Pages Generator
 *
 * Generates URL combinations for location+produce/category programmatic pages.
 * These pages target long-tail keywords like "farm shops in Essex selling organic vegetables".
 *
 * URL Pattern: /find/[county-slug]/[category-slug]
 * Example: /find/essex/organic-vegetables
 *
 * @example
 * ```ts
 * import { generateSEOPageParams, getSEOPageData } from '@/lib/seo-pages'
 *
 * // For generateStaticParams
 * const params = await generateSEOPageParams()
 *
 * // For page component
 * const data = await getSEOPageData('essex', 'organic-vegetables')
 * ```
 */

import { getAllCounties } from '@/lib/queries/counties'
import { getAllCategories, getFarmsByCategory } from '@/lib/queries/categories'
import { SITE_URL } from '@/lib/site'

// =============================================================================
// TYPES
// =============================================================================

/** County with farm count from getAllCounties */
interface CountyWithCount {
  name: string
  slug: string
  farmCount: number
}

/** Category with farm count from getAllCategories */
interface CategoryWithCount {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  farmCount: number
}

export interface SEOPageParams {
  county: string
  category: string
}

export interface SEOPageMeta {
  title: string
  description: string
  canonical: string
  openGraph: {
    title: string
    description: string
    url: string
    type: 'website'
    locale: 'en_GB'
  }
}

export interface SEOPageData {
  county: {
    name: string
    slug: string
  }
  category: {
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
  }
  farms: Array<{
    id: string
    name: string
    slug: string
    description?: string
    location: {
      lat: number
      lng: number
      address: string
      city?: string
      county: string
      postcode: string
    }
    contact: {
      phone?: string
      email?: string
      website?: string
    }
    images: string[]
    verified: boolean
    hours: unknown
  }>
  total: number
  meta: SEOPageMeta
  breadcrumbs: Array<{ name: string; href: string }>
  relatedPages: Array<{ title: string; href: string; count: number }>
}

// =============================================================================
// URL GENERATION
// =============================================================================

/**
 * Slugify a county name for URLs
 */
export function slugifyCounty(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Deslugify a county slug back to display name
 */
export function deslugifyCounty(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate the canonical URL for an SEO page
 */
export function getSEOPageUrl(countySlug: string, categorySlug: string): string {
  return `${SITE_URL}/find/${countySlug}/${categorySlug}`
}

/**
 * Generate all possible county+category URL combinations for static generation
 *
 * Filters to only include combinations that have at least 1 farm.
 * This prevents generating empty pages that hurt SEO.
 */
export async function generateSEOPageParams(): Promise<SEOPageParams[]> {
  const [counties, categoriesRaw] = await Promise.all([
    getAllCounties(),
    getAllCategories(),
  ])

  // Cast to proper types (Prisma returns full object but TS infers partial)
  const categories = categoriesRaw as unknown as CategoryWithCount[]

  const params: SEOPageParams[] = []

  // For each county-category combination
  for (const county of counties) {
    for (const category of categories) {
      // Only include if category has farms (we'll filter by county in the page)
      if (category.farmCount > 0) {
        params.push({
          county: county.slug,
          category: category.slug,
        })
      }
    }
  }

  return params
}

/**
 * Generate sitemap entries for all SEO pages
 */
export async function generateSEOPageSitemapEntries(): Promise<
  Array<{
    url: string
    lastmod: string
    changefreq: 'weekly'
    priority: number
  }>
> {
  const params = await generateSEOPageParams()
  const now = new Date().toISOString()

  return params.map(({ county, category }) => ({
    url: getSEOPageUrl(county, category),
    lastmod: now,
    changefreq: 'weekly' as const,
    priority: 0.6,
  }))
}

// =============================================================================
// PAGE DATA
// =============================================================================

/**
 * Get all data needed to render an SEO page
 */
export async function getSEOPageData(
  countySlug: string,
  categorySlug: string
): Promise<SEOPageData | null> {
  const [counties, categoriesRaw] = await Promise.all([
    getAllCounties(),
    getAllCategories(),
  ])

  // Cast to proper types (Prisma returns full object but TS infers partial)
  const categories = categoriesRaw as unknown as CategoryWithCount[]

  // Find the county
  const county = counties.find((c) => c.slug === countySlug)
  if (!county) return null

  // Find the category
  const category = categories.find((c) => c.slug === categorySlug)
  if (!category) return null

  // Get farms in this county for this category
  const { farms, total } = await getFarmsByCategory(categorySlug, {
    county: county.name,
    limit: 50,
  })

  // Generate meta
  const meta = generateSEOPageMeta(county.name, category.name, total)

  // Generate breadcrumbs
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Counties', href: '/counties' },
    { name: county.name, href: `/counties/${countySlug}` },
    { name: category.name, href: `/find/${countySlug}/${categorySlug}` },
  ]

  // Generate related pages (same category, different counties with farms)
  const relatedPages = counties
    .filter((c) => c.slug !== countySlug && c.farmCount > 0)
    .slice(0, 6)
    .map((c) => ({
      title: `${category.name} in ${c.name}`,
      href: `/find/${c.slug}/${categorySlug}`,
      count: c.farmCount,
    }))

  return {
    county: {
      name: county.name,
      slug: county.slug,
    },
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      icon: category.icon || undefined,
    },
    farms,
    total,
    meta,
    breadcrumbs,
    relatedPages,
  }
}

/**
 * Generate SEO meta tags for a page
 */
function generateSEOPageMeta(
  countyName: string,
  categoryName: string,
  farmCount: number
): SEOPageMeta {
  const title = `${categoryName} Farm Shops in ${countyName} | ${farmCount} Local Shops`
  const description = `Discover ${farmCount} farm shops selling ${categoryName.toLowerCase()} in ${countyName}. Find fresh, local produce from verified farm shops near you. Support British farmers and buy direct.`
  const url = getSEOPageUrl(slugifyCounty(countyName), slugifyCounty(categoryName))

  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'en_GB',
    },
  }
}

// =============================================================================
// SCHEMA.ORG STRUCTURED DATA
// =============================================================================

/**
 * Generate ItemList schema for the farms on the page
 */
export function generateItemListSchema(
  farms: SEOPageData['farms'],
  pageUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Farm Shops',
    url: pageUrl,
    numberOfItems: farms.length,
    itemListElement: farms.map((farm, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/shop/${farm.slug}`,
        name: farm.name,
        description: farm.description,
        url: `${SITE_URL}/shop/${farm.slug}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: farm.location.address,
          addressLocality: farm.location.city,
          addressRegion: farm.location.county,
          postalCode: farm.location.postcode,
          addressCountry: 'GB',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: farm.location.lat,
          longitude: farm.location.lng,
        },
        ...(farm.contact.phone && { telephone: farm.contact.phone }),
        ...(farm.contact.website && { sameAs: farm.contact.website }),
        ...(farm.images[0] && { image: farm.images[0] }),
      },
    })),
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: SEOPageData['breadcrumbs']
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.href}`,
    })),
  }
}
