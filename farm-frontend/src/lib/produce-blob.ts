// src/lib/produce-blob.ts
import { head, put, del } from '@vercel/blob'
import sharp from 'sharp'

/**
 * Build object key for produce images in Vercel Blob
 * Path pattern: produce-images/{slug}/{variation}/main.webp
 */
export function buildProduceObjectKey(slug: string, variationId: number | string): string {
  return `produce-images/${encodeURIComponent(slug)}/${variationId}/main.webp`
}

/**
 * Process image buffer with Sharp: resize, convert to WebP, strip EXIF
 */
export async function processProduceImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(1600, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .webp({
      quality: 82,
      effort: 4
    })
    .toBuffer() // Strips EXIF by default unless withMetadata() is called
}

/**
 * Upload produce image to Vercel Blob with Sharp processing
 */
export async function uploadProduceImage(
  buffer: Buffer,
  slug: string,
  variationId: number | string,
  metadata?: {
    produceName?: string
    generatedAt?: string
    allowOverwrite?: boolean
  }
): Promise<{ url: string; pathname: string }> {
  try {
    console.log(`📤 Processing image for ${slug} variation ${variationId}...`)

    // Process image with Sharp
    const processedBuffer = await processProduceImage(buffer)

    console.log(`✅ Processed: ${buffer.length} bytes → ${processedBuffer.length} bytes`)

    // Build pathname
    const pathname = buildProduceObjectKey(slug, variationId)

    // Upload to Vercel Blob
    const blob = await put(pathname, processedBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000, // 1 year
      ...(metadata?.allowOverwrite && { allowOverwrite: true })
    })

    console.log(`✅ Uploaded to blob: ${blob.url}`)

    return {
      url: blob.url,
      pathname
    }
  } catch (error) {
    console.error(`❌ Blob upload failed for ${slug}/${variationId}:`, error)
    throw new Error(`Failed to upload produce image: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Get existing produce image URL from Vercel Blob
 */
export async function getProduceImageUrl(
  slug: string,
  variationId: number | string
): Promise<string | null> {
  try {
    const pathname = buildProduceObjectKey(slug, variationId)
    const blobInfo = await head(pathname)
    return blobInfo?.url || null
  } catch {
    return null
  }
}

/**
 * Check if produce image exists in Vercel Blob
 */
export async function produceImageExists(
  slug: string,
  variationId: number | string
): Promise<boolean> {
  try {
    const pathname = buildProduceObjectKey(slug, variationId)
    const blobInfo = await head(pathname)
    return !!blobInfo
  } catch {
    return false
  }
}

/**
 * Delete produce image from Vercel Blob
 */
export async function deleteProduceImage(
  slug: string,
  variationId: number | string
): Promise<boolean> {
  try {
    const pathname = buildProduceObjectKey(slug, variationId)
    await del(pathname)
    console.log(`🗑️  Deleted: ${pathname}`)
    return true
  } catch (error) {
    console.error(`❌ Delete failed for ${slug}/${variationId}:`, error)
    return false
  }
}

/**
 * Upload multiple variations for a produce item
 */
export async function uploadProduceVariations(
  buffers: Buffer[],
  slug: string,
  produceName: string
): Promise<Array<{ url: string; variationId: number }>> {
  const results: Array<{ url: string; variationId: number }> = []

  for (let i = 0; i < buffers.length; i++) {
    const variationId = i + 1

    try {
      const { url } = await uploadProduceImage(
        buffers[i],
        slug,
        variationId,
        {
          produceName,
          generatedAt: new Date().toISOString()
        }
      )

      results.push({ url, variationId })

      // Rate limit between uploads
      if (i < buffers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`⚠️  Failed to upload variation ${variationId}:`, error)
      // Continue with other variations
    }
  }

  return results
}
