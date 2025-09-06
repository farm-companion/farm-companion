import { NextRequest, NextResponse } from 'next/server'
import { generateComprehensiveSitemap, generateSitemapXML } from '@/lib/enhanced-sitemap'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Validate filename format
    if (!filename.match(/^sitemap-\d+\.xml$/)) {
      return NextResponse.json({ error: 'Invalid sitemap filename' }, { status: 400 })
    }
    
    // Extract sitemap index from filename
    const match = filename.match(/^sitemap-(\d+)\.xml$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid sitemap filename format' }, { status: 400 })
    }
    
    const sitemapIndex = parseInt(match[1]) - 1 // Convert to 0-based index
    
    // Generate sitemaps
    const { sitemaps } = await generateComprehensiveSitemap()
    
    // Check if requested sitemap exists
    if (sitemapIndex < 0 || sitemapIndex >= sitemaps.length) {
      return NextResponse.json({ error: 'Sitemap not found' }, { status: 404 })
    }
    
    // Get the requested sitemap
    const sitemapEntries = sitemaps[sitemapIndex]
    
    // Generate XML content
    const xmlContent = generateSitemapXML(sitemapEntries)
    
    // Return XML response
    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Sitemap-Index': sitemapIndex.toString(),
        'X-Sitemap-Entries': sitemapEntries.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}