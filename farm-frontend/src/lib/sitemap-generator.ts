/**
 * Sitemap Generator with Chunking Support
 * 
 * Generates sitemaps with proper chunking for large datasets.
 * Each chunk stays well below 1,000 URLs and 50MB uncompressed.
 */

import { PRODUCE } from '@/data/produce'
import { SITE_URL } from '@/lib/site'
import { getFarmData } from '@/lib/farm-data'
import { generateSEOPageSitemapEntries } from '@/lib/seo-pages'
import { logger } from '@/lib/logger'

const sitemapGenLogger = logger.child({ route: 'lib/sitemap-generator' })

export const SITEMAP_CONFIG = {
  MAX_URLS_PER_SITEMAP: 1000,
  MAX_SIZE_MB: 50,
  CHUNK_PREFIX: 'sitemaps',
} as const

/**
 * Pages that should be excluded from sitemap
 * These are utility pages, admin pages, or pages with noindex directives
 */
const EXCLUDED_PATHS = [
  '/admin',
  '/claim',
  '/submission-success',
  '/api',
] as const

/**
 * Check if a path should be excluded from sitemap
 */
function isExcludedPath(path: string): boolean {
  return EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))
}

type FarmShop = {
  slug: string
  name: string
  location: { county: string }
  updatedAt?: string
}

type SitemapEntry = {
  url: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

type SitemapChunk = {
  filename: string
  entries: SitemapEntry[]
}

/**
 * Generate all sitemap chunks
 */
export async function generateSitemapChunks(): Promise<{
  indexSitemap: SitemapEntry[]
  chunks: SitemapChunk[]
}> {
  const base = SITE_URL
  const chunks: SitemapChunk[] = []
  
  // Core pages chunk - only public, indexable pages
  // Excludes: /admin/*, /claim/*, /submission-success, /api/*
  const corePages: SitemapEntry[] = [
    { url: `${base}/`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 1.0 },
    { url: `${base}/map`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: 0.9 },
    { url: `${base}/seasonal`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: 0.8 },
    { url: `${base}/shop`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.8 },
    { url: `${base}/counties`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 },
    { url: `${base}/add`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.4 },
    { url: `${base}/about`, lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.2 },
  ]

  chunks.push({
    filename: 'core-pages.xml',
    entries: corePages
  })

  // Produce pages chunk
  const producePages: SitemapEntry[] = []
  for (const produce of PRODUCE) {
    producePages.push({
      url: `${base}/seasonal/${produce.slug}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.7,
    })
  }

  if (producePages.length > 0) {
    chunks.push({
      filename: 'produce-pages.xml',
      entries: producePages
    })
  }

  // Load farms data from Prisma
  let farms: FarmShop[] = []
  try {
    const prismaFarms = await getFarmData()
    farms = prismaFarms.map(f => ({
      slug: f.slug,
      name: f.name,
      location: { county: f.location.county },
      updatedAt: undefined
    }))
  } catch (error) {
    sitemapGenLogger.warn('Could not load farms data for sitemap', {}, error as Error)
  }

  // Helper function for slugification
  const slugify = (s: string) =>
    s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  // Generate farm shop pages chunks
  const validFarms = farms.filter(f => f?.slug && f?.name)
  const farmChunks = chunkArray(validFarms, SITEMAP_CONFIG.MAX_URLS_PER_SITEMAP)
  
  for (let i = 0; i < farmChunks.length; i++) {
    const farmChunk = farmChunks[i]
    const farmPages: SitemapEntry[] = farmChunk.map(farm => ({
      url: `${base}/shop/${encodeURIComponent(farm.slug)}`,
      lastmod: farm.updatedAt || new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.6,
    }))

    chunks.push({
      filename: `farms-${i + 1}.xml`,
      entries: farmPages
    })
  }

  // Generate county pages chunk
  const counties = new Set<string>()
  for (const farm of farms) {
    const county = farm?.location?.county
    if (county) counties.add(slugify(county))
  }
  
  const countyArray = Array.from(counties)
  const countyChunks = chunkArray(countyArray, SITEMAP_CONFIG.MAX_URLS_PER_SITEMAP)
  
  for (let i = 0; i < countyChunks.length; i++) {
    const countyChunk = countyChunks[i]
    const countyPages: SitemapEntry[] = countyChunk.map(county => ({
      url: `${base}/counties/${county}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.5,
    }))

    chunks.push({
      filename: `counties-${i + 1}.xml`,
      entries: countyPages
    })
  }

  // Generate SEO pages (location+category combinations)
  try {
    const seoPages = await generateSEOPageSitemapEntries()
    const seoChunks = chunkArray(seoPages, SITEMAP_CONFIG.MAX_URLS_PER_SITEMAP)

    for (let i = 0; i < seoChunks.length; i++) {
      chunks.push({
        filename: `seo-pages-${i + 1}.xml`,
        entries: seoChunks[i]
      })
    }

    sitemapGenLogger.info('Generated SEO pages for sitemap', { count: seoPages.length })
  } catch (error) {
    sitemapGenLogger.warn('Could not generate SEO pages for sitemap', {}, error as Error)
  }

  // Generate index sitemap
  const indexSitemap: SitemapEntry[] = chunks.map(chunk => ({
    url: `${base}/${SITEMAP_CONFIG.CHUNK_PREFIX}/${chunk.filename}`,
    lastmod: new Date().toISOString(),
    changefreq: 'daily',
    priority: 0.8,
  }))

  return { indexSitemap, chunks }
}

/**
 * Chunk an array into smaller arrays of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Generate XML sitemap content
 */
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]

  for (const entry of entries) {
    xml.push('  <url>')
    xml.push(`    <loc>${entry.url}</loc>`)
    
    if (entry.lastmod) {
      xml.push(`    <lastmod>${entry.lastmod}</lastmod>`)
    }
    
    if (entry.changefreq) {
      xml.push(`    <changefreq>${entry.changefreq}</changefreq>`)
    }
    
    if (entry.priority !== undefined) {
      xml.push(`    <priority>${entry.priority}</priority>`)
    }
    
    xml.push('  </url>')
  }

  xml.push('</urlset>')
  return xml.join('\n')
}

/**
 * Generate XML sitemap index content
 */
export function generateSitemapIndexXML(entries: SitemapEntry[]): string {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]

  for (const entry of entries) {
    xml.push('  <sitemap>')
    xml.push(`    <loc>${entry.url}</loc>`)
    
    if (entry.lastmod) {
      xml.push(`    <lastmod>${entry.lastmod}</lastmod>`)
    }
    
    xml.push('  </sitemap>')
  }

  xml.push('</sitemapindex>')
  return xml.join('\n')
}
