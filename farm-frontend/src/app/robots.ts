import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'bingbot', allow: '/' },
      { userAgent: 'msnbot', allow: '/' },
    ],
    sitemap: 'https://www.farmcompanion.co.uk/sitemap.xml',
  }
}
