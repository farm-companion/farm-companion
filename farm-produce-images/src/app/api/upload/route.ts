import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { uploadProduceImage } from '@/lib/storage'
import { saveImageMetadata } from '@/lib/database'
import { validateImage, generateImageVariants } from '@/lib/image-processing'
import { ApiResponse, UploadResponse } from '@/types/api'

const UploadRequestSchema = z.object({
  produceSlug: z.string().min(1),
  month: z.number().min(1).max(12),
  alt: z.string().min(1),
  isPrimary: z.boolean().default(false),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    location: z.string().optional(),
    photographer: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  try {
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const produceSlug = formData.get('produceSlug') as string
    const month = parseInt(formData.get('month') as string)
    const alt = formData.get('alt') as string
    const isPrimary = formData.get('isPrimary') === 'true'
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined

    // Validate request
    const validatedRequest = UploadRequestSchema.parse({
      produceSlug,
      month,
      alt,
      isPrimary,
      metadata,
    })

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images provided',
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    const uploadedImages = []
    let totalSize = 0

    // Process each image
    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Validate image
        const validation = await validateImage(buffer)
        if (!validation.isValid) {
          console.error(`Image validation failed: ${validation.error}`)
          continue
        }

        // Generate image variants
        const variants = await generateImageVariants(buffer)

        // Upload optimized image
        const optimizedFile = new File([variants.optimized.buffer], file.name, {
          type: `image/${variants.optimized.format}`,
        })

        const image = await uploadProduceImage(optimizedFile, {
          ...validatedRequest,
          alt: `${validatedRequest.alt} - ${file.name}`,
        })

        // Update with actual dimensions
        image.width = variants.optimized.width
        image.height = variants.optimized.height
        image.size = variants.optimized.size

        // Save metadata to database
        await saveImageMetadata(image)

        uploadedImages.push({
          id: image.id,
          url: image.url,
          alt: image.alt,
          width: image.width,
          height: image.height,
          size: image.size,
          format: image.format,
        })

        totalSize += image.size
      } catch (error) {
        console.error(`Error processing image ${file.name}:`, error)
        // Continue with other images
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images were successfully uploaded',
        timestamp: new Date().toISOString(),
      }, { status: 400 })
    }

    const response: UploadResponse = {
      uploadedImages,
      totalUploaded: uploadedImages.length,
      totalSize,
      metadata: {
        produceSlug: validatedRequest.produceSlug,
        month: validatedRequest.month,
        uploadedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: `Successfully uploaded ${uploadedImages.length} images`,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Upload API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
