import { NextRequest, NextResponse } from 'next/server'
import { uploadProduceImage } from '@/lib/storage'
import { saveImageMetadata } from '@/lib/database'
import { uploadSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting upload to:', request.url)
    
    const formData = await request.formData()
    console.log('📦 Upload data:', Object.fromEntries(formData.entries()))

    // Parse and validate the form data
    const validatedOptions = uploadSchema.parse({
      produceSlug: formData.get('produceSlug'),
      month: parseInt(formData.get('month') as string, 10),
      imagesCount: parseInt(formData.get('imagesCount') as string, 10)
    })

    console.log('✅ Validated options:', validatedOptions)

    const uploadedImages = []
    const errors = []

    // Process each uploaded file
    for (let i = 0; i < validatedOptions.imagesCount; i++) {
      const file = formData.get(`image${i}`) as File
      
      if (!file) {
        console.log(`⚠️ No file found for index ${i}`)
        continue
      }

      console.log(`📁 Processing file ${i}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      })

      try {
        // Upload to blob storage
        const uploadResult = await uploadProduceImage(file, {
          produceSlug: validatedOptions.produceSlug,
          month: validatedOptions.month,
          alt: `${validatedOptions.produceSlug} - ${file.name}`,
          isPrimary: false
        })
        console.log(`✅ Blob upload successful for ${i}:`, uploadResult)

        // Create metadata with default values for dimensions
        const metadata = {
          id: uploadResult.id,
          url: uploadResult.url,
          alt: `${validatedOptions.produceSlug} - ${file.name}`,
          width: 800, // Default width
          height: 600, // Default height
          size: file.size,
          format: uploadResult.format as 'jpeg' | 'png' | 'webp',
          uploadedAt: new Date().toISOString(),
          isPrimary: false,
          produceSlug: validatedOptions.produceSlug,
          month: validatedOptions.month
        }

        // Save metadata to Redis
        await saveImageMetadata(metadata)
        console.log(`✅ Metadata saved for ${i}:`, metadata.id)

        uploadedImages.push({
          id: uploadResult.id,
          url: uploadResult.url,
          alt: metadata.alt
        })

      } catch (error) {
        console.error(`❌ Error processing file ${i}:`, error)
        errors.push(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (uploadedImages.length === 0) {
      console.log('❌ No images were successfully uploaded')
      return NextResponse.json(
        { error: 'No images were successfully uploaded', details: errors },
        { status: 400 }
      )
    }

    console.log(`✅ Upload completed: ${uploadedImages.length} images uploaded`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} images`,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('💥 Error uploading produce images:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
