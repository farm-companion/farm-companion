import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProduceImages, getMonthImages } from '@/lib/database'
import { ApiResponse, ImageListResponse } from '@/types/api'

const ImageListQuerySchema = z.object({
  produceSlug: z.string().optional(),
  month: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(12)).optional(),
  format: z.enum(['jpeg', 'png', 'webp']).optional(),
  isPrimary: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default(20),
  offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).default(0),
})

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ImageListResponse>>> {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const query = {
      produceSlug: searchParams.get('produceSlug') || undefined,
      month: searchParams.get('month') || undefined,
      format: searchParams.get('format') || undefined,
      isPrimary: searchParams.get('isPrimary') || undefined,
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    }

    const validatedQuery = ImageListQuerySchema.parse(query)

    let images = []

    // Get images based on filters
    if (validatedQuery.produceSlug) {
      images = await getProduceImages(validatedQuery.produceSlug, validatedQuery.month)
    } else if (validatedQuery.month) {
      images = await getMonthImages(validatedQuery.month)
    } else {
      // Get all images (limited for performance)
      images = await getMonthImages(1) // Start with January, could be enhanced
    }

    // Apply additional filters
    if (validatedQuery.format) {
      images = images.filter(img => img.format === validatedQuery.format)
    }

    if (validatedQuery.isPrimary !== undefined) {
      images = images.filter(img => img.isPrimary === validatedQuery.isPrimary)
    }

    // Apply pagination
    const total = images.length
    const startIndex = validatedQuery.offset
    const endIndex = startIndex + validatedQuery.limit
    const paginatedImages = images.slice(startIndex, endIndex)

    // Transform to response format
    const responseImages = paginatedImages.map(img => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      width: img.width,
      height: img.height,
      size: img.size,
      format: img.format,
      uploadedAt: img.uploadedAt,
      isPrimary: img.isPrimary,
      produceSlug: img.produceSlug,
      month: img.month,
    }))

    const response: ImageListResponse = {
      images: responseImages,
      total,
      page: Math.floor(startIndex / validatedQuery.limit) + 1,
      limit: validatedQuery.limit,
      hasMore: endIndex < total,
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Images API error:', error)
    
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
