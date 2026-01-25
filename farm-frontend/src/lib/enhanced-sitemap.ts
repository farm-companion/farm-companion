// Enhanced Sitemap Generator with SEO Optimization
// PuredgeOS 3.0 Compliant Sitemap Management

import { SITE_URL } from './site'
import { PRODUCE } from '@/data/produce'
import { getFarmData } from '@/lib/farm-data'
import { getImageUrl } from '@/types/farm'
import { logger } from '@/lib/logger'

const sitemapLogger = logger.child({ route: 'lib/enhanced-sitemap' })

export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  images?: Array<{
    url: string
    caption?: string
    title?: string
    geoLocation?: string
    license?: string
  }>
}

export interface SitemapConfig {
  maxUrlsPerSitemap: number
  maxSizeMB: number
  chunkPrefix: string
  includeImages: boolean
  includeNews: boolean
  includeVideo: boolean
}

const DEFAULT_CONFIG: SitemapConfig = {
  maxUrlsPerSitemap: 1000,
  maxSizeMB: 50,
  chunkPrefix: 'sitemaps',
  includeImages: true,
  includeNews: false,
  includeVideo: false
}

// Pages that should be excluded from sitemap
const EXCLUDED_PATHS = [
  '/admin',
  '/claim',
  '/submission-success',
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
] as const

// Check if a path should be excluded from sitemap
function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))
}

// Generate static pages sitemap
export function generateStaticPagesSitemap(): SitemapEntry[] {
  const staticPages = [
    {
      url: '/',
      changeFrequency: 'daily' as const,
      priority: 1.0,
      lastModified: new Date()
    },
    {
      url: '/about',
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      lastModified: new Date()
    },
    {
      url: '/contact',
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      lastModified: new Date()
    },
    {
      url: '/privacy',
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      lastModified: new Date()
    },
    {
      url: '/terms',
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      lastModified: new Date()
    },
    {
      url: '/map',
      changeFrequency: 'daily' as const,
      priority: 0.9,
      lastModified: new Date()
    },
    {
      url: '/shop',
      changeFrequency: 'daily' as const,
      priority: 0.9,
      lastModified: new Date()
    },
    {
      url: '/seasonal',
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date()
    },
    {
      url: '/counties',
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: new Date()
    }
  ]

  return staticPages
}

// Generate farm shops sitemap
export async function generateFarmShopsSitemap(): Promise<SitemapEntry[]> {
  try {
    const farms = await getFarmData()

    return farms.map((farm) => ({
      url: `/shop/${farm.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
      images: farm.images
        ?.map((img) => getImageUrl(img))
        .filter((url): url is string => !!url)
        .map((url) => ({
          url,
          caption: `${farm.name} - Farm Shop`,
          title: `${farm.name} - Farm Shop in ${farm.location.county}`,
          geoLocation: `${farm.location.lat}, ${farm.location.lng}`
        })) || []
    }))
  } catch (error) {
    sitemapLogger.error('Error generating farm shops sitemap', {}, error as Error)
    return []
  }
}

// Generate seasonal produce sitemap
export function generateSeasonalProduceSitemap(): SitemapEntry[] {
  return PRODUCE.map(produce => ({
    url: `/seasonal/${produce.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    lastModified: new Date(),
    images: produce.images?.map(img => ({
      url: img.src,
      caption: img.alt || `${produce.name} - Seasonal Produce`,
      title: `${produce.name} - Seasonal Guide`
    })) || []
  }))
}

// Generate county pages sitemap
export async function generateCountyPagesSitemap(): Promise<SitemapEntry[]> {
  try {
    const farms = await getFarmData()

    // Get unique counties
    const counties = [...new Set(farms.map((farm) => farm.location.county).filter(Boolean))] as string[]

    return counties.map((county: string) => ({
      url: `/counties/${encodeURIComponent(county.toLowerCase().replace(/\s+/g, '-'))}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      lastModified: new Date()
    }))
  } catch (error) {
    sitemapLogger.error('Error generating county pages sitemap', {}, error as Error)
    return []
  }
}

// Generate comprehensive sitemap
export async function generateComprehensiveSitemap(config: SitemapConfig = DEFAULT_CONFIG): Promise<{
  sitemaps: SitemapEntry[][]
  indexSitemap: SitemapEntry[]
}> {
  const allEntries: SitemapEntry[] = []

  // Add static pages
  allEntries.push(...generateStaticPagesSitemap())

  // Add farm shops
  const farmShops = await generateFarmShopsSitemap()
  allEntries.push(...farmShops)

  // Add seasonal produce
  const seasonalProduce = generateSeasonalProduceSitemap()
  allEntries.push(...seasonalProduce)

  // Add county pages
  const countyPages = await generateCountyPagesSitemap()
  allEntries.push(...countyPages)

  // Filter out excluded paths
  const filteredEntries = allEntries.filter(entry => !isExcludedPath(entry.url))

  // Sort by priority (highest first)
  filteredEntries.sort((a, b) => (b.priority || 0) - (a.priority || 0))

  // Split into chunks
  const sitemaps: SitemapEntry[][] = []
  let currentChunk: SitemapEntry[] = []
  let currentSize = 0

  for (const entry of filteredEntries) {
    const entrySize = JSON.stringify(entry).length
    
    if (currentChunk.length >= config.maxUrlsPerSitemap || 
        currentSize + entrySize > config.maxSizeMB * 1024 * 1024) {
      if (currentChunk.length > 0) {
        sitemaps.push(currentChunk)
        currentChunk = []
        currentSize = 0
      }
    }
    
    currentChunk.push(entry)
    currentSize += entrySize
  }

  if (currentChunk.length > 0) {
    sitemaps.push(currentChunk)
  }

  // Generate index sitemap
  const indexSitemap: SitemapEntry[] = sitemaps.map((_, index) => ({
    url: `/sitemaps/sitemap-${index + 1}.xml`,
    changeFrequency: 'daily' as const,
    priority: 0.5,
    lastModified: new Date()
  }))

  return { sitemaps, indexSitemap }
}

// Generate XML sitemap content
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
  const urlsetClose = '</urlset>'

  const urlEntries = entries.map(entry => {
    const url = `${SITE_URL}${entry.url}`
    const lastmod = entry.lastModified?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
    const changefreq = entry.changeFrequency || 'weekly'
    const priority = entry.priority || 0.5

    let urlContent = `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>`

    // Add images if present
    if (entry.images && entry.images.length > 0) {
      entry.images.forEach(image => {
        urlContent += `
    <image:image>
      <image:loc>${image.url}</image:loc>`
        
        if (image.caption) {
          urlContent += `
      <image:caption>${image.caption}</image:caption>`
        }
        
        if (image.title) {
          urlContent += `
      <image:title>${image.title}</image:title>`
        }
        
        if (image.geoLocation) {
          urlContent += `
      <image:geo_location>${image.geoLocation}</image:geo_location>`
        }
        
        if (image.license) {
          urlContent += `
      <image:license>${image.license}</image:license>`
        }
        
        urlContent += `
    </image:image>`
      })
    }

    urlContent += `
  </url>`

    return urlContent
  }).join('\n')

  return `${xmlHeader}
${urlsetOpen}
${urlEntries}
${urlsetClose}`
}

// Generate sitemap index XML
export function generateSitemapIndexXML(indexEntries: SitemapEntry[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  const sitemapindexClose = '</sitemapindex>'

  const sitemapEntries = indexEntries.map(entry => {
    const url = `${SITE_URL}${entry.url}`
    const lastmod = entry.lastModified?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]

    return `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  }).join('\n')

  return `${xmlHeader}
${sitemapindexOpen}
${sitemapEntries}
${sitemapindexClose}`
}

// Generate robots.txt content
export function generateRobotsTxt(sitemapUrl: string = '/sitemap.xml'): string {
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /shop/
Allow: /seasonal/
Allow: /counties/
Allow: /map

# Sitemap
Sitemap: ${SITE_URL}${sitemapUrl}

# Crawl delay (optional)
Crawl-delay: 1`
}

// Generate news sitemap (if needed)
export function generateNewsSitemap(newsEntries: Array<{
  url: string
  title: string
  publicationDate: Date
  keywords?: string[]
}>): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'
  const urlsetClose = '</urlset>'

  const urlEntries = newsEntries.map(entry => {
    const url = `${SITE_URL}${entry.url}`
    const publicationDate = entry.publicationDate.toISOString()

    return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>Farm Companion</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${entry.title}</news:title>${entry.keywords ? `
      <news:keywords>${entry.keywords.join(', ')}</news:keywords>` : ''}
    </news:news>
  </url>`
  }).join('\n')

  return `${xmlHeader}
${urlsetOpen}
${urlEntries}
${urlsetClose}`
}

// SEO optimization utilities
export function calculatePriority(url: string): number {
  if (url === '/') return 1.0
  if (url.startsWith('/shop/')) return 0.8
  if (url.startsWith('/seasonal/')) return 0.7
  if (url.startsWith('/counties/')) return 0.6
  if (url.startsWith('/map')) return 0.9
  if (url.startsWith('/about') || url.startsWith('/contact')) return 0.5
  return 0.3
}

export function calculateChangeFrequency(url: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (url === '/') return 'daily'
  if (url.startsWith('/shop/')) return 'weekly'
  if (url.startsWith('/seasonal/')) return 'monthly'
  if (url.startsWith('/counties/')) return 'weekly'
  if (url.startsWith('/map')) return 'daily'
  if (url.startsWith('/about') || url.startsWith('/contact')) return 'monthly'
  return 'yearly'
}
