/**
 * County Image Blob Storage
 *
 * Handles upload, retrieval, and management of county card images in Vercel Blob.
 */

import { head, put, del } from '@vercel/blob'
import sharp from 'sharp'
import { logger } from '@/lib/logger'

const blobLogger = logger.child({ route: 'lib/county-blob' })

/**
 * Build object key for county images in Vercel Blob
 * Path pattern: county-images/{slug}/main.webp
 */
export function buildCountyObjectKey(slug: string): string {
  return `county-images/${encodeURIComponent(slug)}/main.webp`
}

/**
 * Process image buffer with Sharp: resize, convert to WebP, strip EXIF
 */
export async function processCountyImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(2048, 1152, {
      withoutEnlargement: true,
      fit: 'cover',
      position: 'centre'
    })
    .webp({
      quality: 85,
      effort: 4
    })
    .toBuffer() // Strips EXIF by default
}

/**
 * Upload county image to Vercel Blob with Sharp processing
 */
export async function uploadCountyImage(
  buffer: Buffer,
  slug: string,
  metadata?: {
    countyName?: string
    generatedAt?: string
    allowOverwrite?: boolean
  }
): Promise<{ url: string; pathname: string }> {
  try {
    blobLogger.info('Processing county image', { slug })

    // Process image with Sharp
    const processedBuffer = await processCountyImage(buffer)

    blobLogger.debug('County image processed', {
      slug,
      originalBytes: buffer.length,
      processedBytes: processedBuffer.length
    })

    // Build pathname
    const pathname = buildCountyObjectKey(slug)

    // Upload to Vercel Blob
    const blob = await put(pathname, processedBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000, // 1 year
      ...(metadata?.allowOverwrite && { allowOverwrite: true })
    })

    blobLogger.info('County image uploaded to blob', { slug, url: blob.url })

    return {
      url: blob.url,
      pathname
    }
  } catch (error) {
    blobLogger.error('County blob upload failed', { slug }, error as Error)
    throw new Error(`Failed to upload county image: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Get existing county image URL from Vercel Blob
 */
export async function getCountyImageUrl(slug: string): Promise<string | null> {
  try {
    const pathname = buildCountyObjectKey(slug)
    const blobInfo = await head(pathname)
    return blobInfo?.url || null
  } catch {
    return null
  }
}

/**
 * Check if county image exists in Vercel Blob
 */
export async function countyImageExists(slug: string): Promise<boolean> {
  try {
    const pathname = buildCountyObjectKey(slug)
    const blobInfo = await head(pathname)
    return !!blobInfo
  } catch {
    return false
  }
}

/**
 * Delete county image from Vercel Blob
 */
export async function deleteCountyImage(slug: string): Promise<boolean> {
  try {
    const pathname = buildCountyObjectKey(slug)
    await del(pathname)
    blobLogger.info('Deleted county image', { slug, pathname })
    return true
  } catch (error) {
    blobLogger.error('County delete failed', { slug }, error as Error)
    return false
  }
}

/**
 * Upload multiple county images
 */
export async function uploadCountyImages(
  images: Array<{ slug: string; buffer: Buffer; name: string }>,
  allowOverwrite: boolean = false
): Promise<Array<{ slug: string; url: string; success: boolean; error?: string }>> {
  const results: Array<{ slug: string; url: string; success: boolean; error?: string }> = []

  for (const image of images) {
    try {
      const { url } = await uploadCountyImage(image.buffer, image.slug, {
        countyName: image.name,
        generatedAt: new Date().toISOString(),
        allowOverwrite
      })

      results.push({ slug: image.slug, url, success: true })

      // Rate limit between uploads
      if (images.indexOf(image) < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      blobLogger.error('Failed to upload county image', { slug: image.slug, error: message })
      results.push({ slug: image.slug, url: '', success: false, error: message })
    }
  }

  return results
}
