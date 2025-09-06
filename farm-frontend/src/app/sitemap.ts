import type { MetadataRoute } from 'next'
import { generateComprehensiveSitemap } from '@/lib/enhanced-sitemap'

/**
 * Enhanced sitemap with comprehensive SEO optimization
 * This is the entry point that search engines will crawl
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { indexSitemap } = await generateComprehensiveSitemap()
  
  // Convert to Next.js MetadataRoute.Sitemap format
  return indexSitemap.map(entry => ({
    url: entry.url,
    lastModified: entry.lastModified || new Date(),
    changeFrequency: entry.changeFrequency as any,
    priority: entry.priority,
  }))
}
