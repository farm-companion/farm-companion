import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { 
        userAgent: '*', 
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/static/']
      },
      { 
        userAgent: 'Googlebot', 
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/static/']
      },
      { 
        userAgent: 'Bingbot', 
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/static/']
      },
      { 
        userAgent: 'Slurp', 
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/static/']
      },
    ],
    sitemap: 'https://www.farmcompanion.co.uk/sitemap.xml',
    host: 'https://www.farmcompanion.co.uk',
  }
}
