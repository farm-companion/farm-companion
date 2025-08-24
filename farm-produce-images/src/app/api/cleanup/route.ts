import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/database'

export async function POST() {
  try {
    console.log('🧹 Starting database cleanup to keep only numbered images...')

    const cleanedImages = []
    const removedImages = []

    // Get all produce keys
    const produceKeys = await redis.keys('produce:*:images')

    for (const key of produceKeys) {
      try {
        // Get all image IDs for this produce
        const imageIds = await redis.lRange(key, 0, -1)

        if (imageIds.length === 0) continue

        // Get all image metadata
        const images = []
        for (const imageId of imageIds) {
          const imageData = await redis.get(`image:${imageId}`)
          if (imageData) {
            const image = JSON.parse(imageData)
            images.push(image)
          }
        }

        // Extract produce slug from key
        const produceSlug = key.split(':')[1]
        console.log(`📁 Processing ${produceSlug}: ${images.length} images`)

        // Keep only numbered images (image1, image2, image3, image4)
        const numberedImages = []
        const imagesToRemove = []
        
        for (const image of images) {
          const filename = image.url.split('/').pop() || ''
          // Very flexible pattern to handle various naming conventions
          // Matches: produceSlug1.jpg, produceSlug-fresh1.jpg, produceSlug_1.jpg, etc.
          const isNumbered = new RegExp(`^${produceSlug}[^\\d]*(1|2|3|4)\\.(jpg|jpeg|png|webp)$`, 'i').test(filename)
          
          if (isNumbered) {
            numberedImages.push(image)
            console.log(`✅ Keeping numbered image: ${filename}`)
          } else {
            imagesToRemove.push(image)
            console.log(`🗑️ Marking for removal: ${filename}`)
          }
        }

        // Remove duplicates based on URL (keep only one entry per unique image)
        const uniqueImages = []
        const seenUrls = new Set()
        
        for (const image of numberedImages) {
          if (!seenUrls.has(image.url)) {
            seenUrls.add(image.url)
            uniqueImages.push(image)
          } else {
            imagesToRemove.push(image)
            console.log(`🗑️ Marking duplicate for removal: ${image.url}`)
          }
        }

        // Remove non-numbered images and duplicates
        for (const image of imagesToRemove) {
          await redis.del(`image:${image.id}`)
          await redis.lRem(key, 1, image.id)
          removedImages.push({
            id: image.id,
            url: image.url,
            produceKey: key,
            reason: image.url.includes('.txt') ? 'Text file' : 'Duplicate or non-numbered image'
          })
        }

        // Update the produce images list with only unique numbered images
        if (imagesToRemove.length > 0) {
          await redis.del(key)
          for (const image of uniqueImages) {
            await redis.rPush(key, image.id)
          }
          console.log(`✅ Cleaned ${key}: ${images.length} → ${uniqueImages.length} images`)
        }

        cleanedImages.push({
          produceKey: key,
          produceSlug,
          originalCount: images.length,
          finalCount: uniqueImages.length,
          removedCount: imagesToRemove.length
        })

      } catch (error) {
        console.error(`❌ Error cleaning ${key}:`, error)
      }
    }

    console.log(`✅ Cleanup completed: ${removedImages.length} images removed`)

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned database to keep only unique numbered images`,
      summary: {
        totalProduceCleaned: cleanedImages.length,
        totalImagesRemoved: removedImages.length,
        totalImagesKept: cleanedImages.reduce((sum, item) => sum + item.finalCount, 0)
      },
      cleanedImages,
      removedImages
    })

  } catch (error) {
    console.error('💥 Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
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
