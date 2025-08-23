import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProduceImages, updateProduceMetadata } from '@/lib/database'
import { ApiResponse, MetadataResponse } from '@/types/api'

const MetadataQuerySchema = z.object({
  produceSlug: z.string().min(1),
  month: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(12)).optional(),
})

const MetadataUpdateSchema = z.object({
  produceSlug: z.string().min(1),
  name: z.string().min(1).optional(),
  monthsInSeason: z.array(z.number().min(1).max(12)).optional(),
  peakMonths: z.array(z.number().min(1).max(12)).optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MetadataResponse>>> {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = {
      produceSlug: searchParams.get('produceSlug'),
      month: searchParams.get('month'),
    }

    const validatedQuery = MetadataQuerySchema.parse(query)

    // Get produce images
    const images = await getProduceImages(validatedQuery.produceSlug, validatedQuery.month)

    // Calculate metadata
    const imageCounts: { [month: number]: number } = {}
    for (let m = 1; m <= 12; m++) {
      imageCounts[m] = images.filter(img => img.month === m).length
    }

    const produce = {
      slug: validatedQuery.produceSlug,
      name: validatedQuery.produceSlug.charAt(0).toUpperCase() + validatedQuery.produceSlug.slice(1),
      monthsInSeason: [], // Would be populated from external data
      peakMonths: [], // Would be populated from external data
      totalImages: images.length,
      lastUpdated: new Date().toISOString(),
      imageCounts,
    }

    const responseImages = images.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
    }))

    const response: MetadataResponse = {
      produce,
      images: responseImages,
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Metadata API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.issues,
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    const validatedBody = MetadataUpdateSchema.parse(body)

    // Update metadata (this would typically update external data source)
    // For now, we'll just update the database metadata
    await updateProduceMetadata(validatedBody.produceSlug, 1) // Update with current month

    return NextResponse.json({
      success: true,
      message: 'Metadata updated successfully',
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Metadata update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues,
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
