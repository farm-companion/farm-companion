import type { MetadataRoute } from 'next'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PRODUCE } from '@/data/produce'
import { SITE_URL } from '@/lib/site'

type FarmShop = {
  slug: string
  name: string
  location: { county: string }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL
  const entries: MetadataRoute.Sitemap = [
    // Core pages - High priority
    { url: `${base}/`,                changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/map`,             changeFrequency: 'daily',  priority: 0.9 },
    { url: `${base}/seasonal`,        changeFrequency: 'daily',  priority: 0.8 },
    { url: `${base}/shop`,            changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/counties`,        changeFrequency: 'weekly', priority: 0.7 },
    
    // User pages - Medium priority
    { url: `${base}/add`,             changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/claim`,           changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,         changeFrequency: 'yearly', priority: 0.4 },
    
    // Info pages - Lower priority
    { url: `${base}/about`,           changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`,         changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`,           changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Add all produce pages from data
  for (const produce of PRODUCE) {
    entries.push({
      url: `${base}/seasonal/${produce.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Read farms JSON from /public so sitemap builds without external fetch
  let farms: FarmShop[] = []
  try {
    const file = path.join(process.cwd(), 'data', 'farms.json')
    const raw = await fs.readFile(file, 'utf-8')
    farms = JSON.parse(raw) as FarmShop[]
  } catch (error) {
    console.warn('Could not load farms data for sitemap:', error)
  }

  // Helper
  const slugify = (s: string) =>
    s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  // Add shop pages (limit to first 1000 to avoid sitemap size issues)
  const validFarms = farms.filter(f => f?.slug && f?.name).slice(0, 1000)
  for (const f of validFarms) {
    entries.push({
      url: `${base}/shop/${encodeURIComponent(f.slug)}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  // Add county pages (limit to avoid sitemap size issues)
  const counties = new Set<string>()
  for (const f of farms) {
    const c = f?.location?.county
    if (c) counties.add(slugify(c))
  }
  
  const countyArray = Array.from(counties).slice(0, 100) // Limit to 100 counties
  for (const c of countyArray) {
    entries.push({
      url: `${base}/counties/${c}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  return entries
}
