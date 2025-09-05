import type { MetadataRoute } from 'next'
import { generateSitemapChunks, generateSitemapIndexXML } from '@/lib/sitemap-generator'

/**
 * Main sitemap index - references all child sitemaps
 * This is the entry point that search engines will crawl
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { indexSitemap } = await generateSitemapChunks()
  
  // Convert to Next.js MetadataRoute.Sitemap format
  return indexSitemap.map(entry => ({
    url: entry.url,
    lastModified: entry.lastmod ? new Date(entry.lastmod) : new Date(),
    changeFrequency: entry.changefreq as any,
    priority: entry.priority,
  }))
}
