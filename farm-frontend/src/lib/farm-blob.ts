// src/lib/farm-blob.ts
import { head, put, del } from '@vercel/blob'
import sharp from 'sharp'
import { logger } from '@/lib/logger'

const blobLogger = logger.child({ route: 'lib/farm-blob' })

/**
 * Build object key for farm images in Vercel Blob
 * Path pattern: farm-images/{slug}/main.webp
 */
export function buildFarmObjectKey(slug: string): string {
  return `farm-images/${encodeURIComponent(slug)}/main.webp`
}

/**
 * Process image buffer with Sharp: resize, convert to WebP, strip EXIF
 */
export async function processFarmImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(1600, 900, {
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
 * Upload farm image to Vercel Blob with Sharp processing
 */
export async function uploadFarmImage(
  buffer: Buffer,
  slug: string,
  metadata?: {
    farmName?: string
    generatedAt?: string
    allowOverwrite?: boolean
  }
): Promise<{ url: string; pathname: string }> {
  try {
    blobLogger.info('Processing farm image', { slug })

    // Process image with Sharp
    const processedBuffer = await processFarmImage(buffer)

    blobLogger.debug('Farm image processed', {
      slug,
      originalBytes: buffer.length,
      processedBytes: processedBuffer.length
    })

    // Build pathname
    const pathname = buildFarmObjectKey(slug)

    // Upload to Vercel Blob
    const blob = await put(pathname, processedBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000, // 1 year
      ...(metadata?.allowOverwrite && { allowOverwrite: true })
    })

    blobLogger.info('Farm image uploaded to blob', { slug, url: blob.url })

    return {
      url: blob.url,
      pathname
    }
  } catch (error) {
    blobLogger.error('Farm blob upload failed', { slug }, error as Error)
    throw new Error(`Failed to upload farm image: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Get existing farm image URL from Vercel Blob
 */
export async function getFarmImageUrl(slug: string): Promise<string | null> {
  try {
    const pathname = buildFarmObjectKey(slug)
    const blobInfo = await head(pathname)
    return blobInfo?.url || null
  } catch {
    return null
  }
}

/**
 * Check if farm image exists in Vercel Blob
 */
export async function farmImageExists(slug: string): Promise<boolean> {
  try {
    const pathname = buildFarmObjectKey(slug)
    const blobInfo = await head(pathname)
    return !!blobInfo
  } catch {
    return false
  }
}

/**
 * Delete farm image from Vercel Blob
 */
export async function deleteFarmImage(slug: string): Promise<boolean> {
  try {
    const pathname = buildFarmObjectKey(slug)
    await del(pathname)
    blobLogger.info('Deleted farm image', { slug, pathname })
    return true
  } catch (error) {
    blobLogger.error('Farm delete failed', { slug }, error as Error)
    return false
  }
}
