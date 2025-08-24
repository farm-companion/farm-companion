import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { saveImageMetadata } from '@/lib/database'
import { ImageMetadataSchema } from '@/lib/database'

export async function POST() {
  try {
    console.log('🔄 Starting blob to Redis sync...')

    // List all blobs in the produce directory
    const { blobs } = await list({ prefix: 'produce/' })
    console.log(`📁 Found ${blobs.length} files in blob storage`)

    const syncedImages = []
    const errors = []

    for (const blob of blobs) {
      try {
        // Parse the path to extract produce info
        // Expected format: produce/{produceSlug}/{month}/{filename}
        const pathParts = blob.pathname.split('/')
        if (pathParts.length < 4 || pathParts[0] !== 'produce') {
          console.log('⚠️ Skipping non-produce file:', blob.pathname)
          continue
        }

        const [, produceSlug, monthStr, filename] = pathParts
        const month = parseInt(monthStr, 10)

        if (!produceSlug || !month || isNaN(month)) {
          console.log('⚠️ Invalid path format:', blob.pathname)
          continue
        }

        // Generate image ID
        const timestamp = Date.now()
        const imageId = `${produceSlug}-${month}-${timestamp}`

        // Create metadata entry
        const metadata = {
          id: imageId,
          url: blob.url,
          alt: `${produceSlug} - ${filename}`,
          width: 800, // Default values
          height: 600,
          size: blob.size,
          format: getFormatFromFilename(filename),
          uploadedAt: new Date().toISOString(),
          isPrimary: false,
          produceSlug,
          month
        }

        // Validate metadata
        const validatedMetadata = ImageMetadataSchema.parse(metadata)

        // Save to Redis
        await saveImageMetadata(validatedMetadata)

        syncedImages.push({
          id: imageId,
          url: blob.url,
          pathname: blob.pathname
        })

        console.log('✅ Synced image:', imageId)

      } catch (error) {
        console.error('❌ Error syncing image:', blob.pathname, error)
        errors.push(`Failed to sync ${blob.pathname}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`✅ Sync completed: ${syncedImages.length} images synced`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedImages.length} images`,
      syncedImages,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('💥 Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}

function getFormatFromFilename(filename: string): 'jpeg' | 'png' | 'webp' {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    default:
      return 'jpeg'
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
