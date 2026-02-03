import type { MetadataRoute } from 'next'
import { generateComprehensiveSitemap } from '@/lib/enhanced-sitemap'
import { SITE_URL } from '@/lib/site'

/**
 * Enhanced sitemap with comprehensive SEO optimization
 * This is the entry point that search engines will crawl
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { indexSitemap } = await generateComprehensiveSitemap()

  // Convert to Next.js MetadataRoute.Sitemap format
  // Entries use relative paths internally; Next.js requires absolute URLs
  return indexSitemap.map(entry => ({
    url: `${SITE_URL}${entry.url}`,
    lastModified: entry.lastModified || new Date(),
    changeFrequency: entry.changeFrequency as any,
    priority: entry.priority,
  }))
}
