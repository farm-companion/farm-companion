import { NextResponse } from 'next/server'
import { generateComprehensiveSitemap, generateSitemapIndexXML } from '@/lib/enhanced-sitemap'

// Emit the root sitemap as a `<sitemapindex>` (not `<urlset>`).
// Replaces the prior `app/sitemap.ts` convention file, which Next.js renders
// as `<urlset>` + `<url>` regardless of intent — incorrect for an index of
// sub-sitemaps. Sub-sitemaps continue to be served by `app/sitemaps/[filename]/route.ts`.

export async function GET() {
  try {
    const { indexSitemap } = await generateComprehensiveSitemap()
    const xml = generateSitemapIndexXML(indexSitemap)
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch {
    return new NextResponse('Sitemap generation failed', { status: 500 })
  }
}
