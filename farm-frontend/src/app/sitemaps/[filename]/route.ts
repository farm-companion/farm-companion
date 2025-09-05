import { NextRequest, NextResponse } from 'next/server'
import { generateSitemapChunks, generateSitemapXML } from '@/lib/sitemap-generator'

/**
 * Dynamic sitemap chunk endpoint
 * Serves individual sitemap chunks like /sitemaps/farms-1.xml, /sitemaps/counties-1.xml, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Validate filename format
    if (!filename || !filename.endsWith('.xml')) {
      return new NextResponse('Invalid sitemap filename', { status: 400 })
    }

    // Generate all sitemap chunks
    const { chunks } = await generateSitemapChunks()
    
    // Find the requested chunk
    const chunk = chunks.find(c => c.filename === filename)
    
    if (!chunk) {
      return new NextResponse('Sitemap chunk not found', { status: 404 })
    }

    // Generate XML content
    const xmlContent = generateSitemapXML(chunk.entries)
    
    // Return XML response with proper headers
    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error generating sitemap chunk:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
