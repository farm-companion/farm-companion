import type { MetadataRoute } from 'next'
import { SITE_URL, IS_PROD } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: IS_PROD ? [{ userAgent: '*', allow: '/' }] : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
