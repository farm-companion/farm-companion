// src/lib/pitti-blob.ts
//
// Vercel-Blob / S3-compatible upload for Pitti Press farm images.
//
// Mirrors `farm-blob.ts` but lives under its own path prefix
// (`pitti-farm-images/`) so a Pitti batch never clobbers the existing
// harvest farm images. The buffer is assumed to already be at target
// dimensions (post-`cropBottomStrip`), so no additional resize.
//
// Slice: 1.1.2k-δ-1
import { put } from '@/lib/blob-adapter'
import { logger } from '@/lib/logger'

const pittiBlobLogger = logger.child({ route: 'lib/pitti-blob' })

/**
 * Build object key for Pitti Press farm images.
 * Path pattern: pitti-farm-images/{slug}/main.webp
 */
export function buildPittiFarmObjectKey(slug: string): string {
  return `pitti-farm-images/${encodeURIComponent(slug)}/main.webp`
}

/**
 * Upload a pre-cropped Pitti Press WebP to blob storage.
 *
 * Does NOT re-process the buffer — caller is expected to have produced
 * a final-dimension WebP via `cropBottomStrip(rawBuffer, targetHeight)`.
 */
export async function uploadPittiFarmImage(
  buffer: Buffer,
  slug: string
): Promise<{ url: string; pathname: string }> {
  const pathname = buildPittiFarmObjectKey(slug)
  try {
    const blob = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000,
      allowOverwrite: true,
    })
    pittiBlobLogger.info('Pitti farm image uploaded', {
      slug,
      url: blob.url,
      bytes: buffer.length,
    })
    return { url: blob.url, pathname }
  } catch (error) {
    pittiBlobLogger.error('Pitti blob upload failed', { slug }, error as Error)
    throw new Error(
      `Failed to upload Pitti farm image: ${
        error instanceof Error ? error.message : 'unknown error'
      }`
    )
  }
}
