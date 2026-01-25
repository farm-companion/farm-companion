import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FarmImageGenerator } from '@/lib/farm-image-generator'
import { uploadFarmImage } from '@/lib/farm-blob'
import { isAuthenticated } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError, errors } from '@/lib/errors'

const logger = createRouteLogger('admin/generate-images')

/**
 * POST /api/admin/generate-images
 *
 * Generate AI images for farms without photos.
 * Requires admin authentication.
 *
 * Query params:
 * - limit: Max farms to process (default: 5, max: 20)
 * - dryRun: If "true", don't upload or save (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const auth = await isAuthenticated()
    if (!auth) {
      throw errors.authentication('Admin authentication required')
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)
    const dryRun = searchParams.get('dryRun') === 'true'

    logger.info('Starting image generation', { limit, dryRun })

    // Find farms without images
    const farmsWithoutImages = await prisma.farm.findMany({
      where: {
        images: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        county: true,
        description: true
      },
      take: limit
    })

    if (farmsWithoutImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All farms already have images',
        processed: 0,
        results: []
      })
    }

    logger.info(`Found ${farmsWithoutImages.length} farms without images`)

    const generator = new FarmImageGenerator()
    const results: Array<{
      slug: string
      name: string
      success: boolean
      url?: string
      error?: string
    }> = []

    for (const farm of farmsWithoutImages) {
      try {
        logger.info(`Processing: ${farm.name}`)

        // Generate the image
        const imageBuffer = await generator.generateFarmImage(
          farm.name,
          farm.slug,
          { county: farm.county || 'England' }
        )

        if (!imageBuffer) {
          throw new Error('Failed to generate image - no buffer returned')
        }

        if (dryRun) {
          results.push({
            slug: farm.slug,
            name: farm.name,
            success: true,
            url: '[dry-run - not uploaded]'
          })
          continue
        }

        // Upload to Vercel Blob
        const { url } = await uploadFarmImage(imageBuffer, farm.slug, {
          allowOverwrite: false
        })

        // Create Image record in database
        await prisma.image.create({
          data: {
            farmId: farm.id,
            url: url,
            altText: `${farm.name} farm shop`,
            uploadedBy: 'ai_generator',
            status: 'approved',
            displayOrder: 0
          }
        })

        logger.info(`Generated image for ${farm.name}`, { url })
        results.push({
          slug: farm.slug,
          name: farm.name,
          success: true,
          url
        })

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Failed to generate image for ${farm.name}`, { error: message })
        results.push({
          slug: farm.slug,
          name: farm.name,
          success: false,
          error: message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    logger.info('Image generation complete', { successCount, failureCount })

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} images, ${failureCount} failures`,
      processed: results.length,
      results
    })

  } catch (error) {
    return handleApiError(error, 'admin/generate-images')
  }
}

/**
 * GET /api/admin/generate-images
 *
 * Get stats on farms needing images.
 */
export async function GET() {
  try {
    const auth = await isAuthenticated()
    if (!auth) {
      throw errors.authentication('Admin authentication required')
    }

    const [totalFarms, farmsWithImages, farmsWithoutImages] = await Promise.all([
      prisma.farm.count(),
      prisma.farm.count({
        where: {
          images: {
            some: {}
          }
        }
      }),
      prisma.farm.findMany({
        where: {
          images: {
            none: {}
          }
        },
        select: {
          slug: true,
          name: true,
          county: true
        },
        take: 50
      })
    ])

    return NextResponse.json({
      totalFarms,
      farmsWithImages,
      farmsNeedingImages: totalFarms - farmsWithImages,
      sampleFarmsNeedingImages: farmsWithoutImages
    })

  } catch (error) {
    return handleApiError(error, 'admin/generate-images')
  }
}
