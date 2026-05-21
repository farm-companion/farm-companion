// src/lib/apothecary-blob.ts
//
// Blob upload helper for Apothecary botanical-engraving farm images.
//
// Mirrors `pitti-blob.ts` exactly but writes to its own path prefix
// (`apothecary-farm-illustrations/`) so Apothecary and Pitti are
// completely isolated in the bucket — neither style can overwrite the
// other, and an audit query can grep paths to distinguish the two.
//
// Slice: 1.1.3a
import { put } from '@/lib/blob-adapter'
import { logger } from '@/lib/logger'

const apothecaryBlobLogger = logger.child({ route: 'lib/apothecary-blob' })

/**
 * Build object key for Apothecary farm illustrations.
 * Path pattern: apothecary-farm-illustrations/{slug}/main.webp
 */
export function buildApothecaryFarmObjectKey(slug: string): string {
  return `apothecary-farm-illustrations/${encodeURIComponent(slug)}/main.webp`
}

/**
 * Upload a pre-cropped Apothecary WebP to blob storage.
 *
 * Caller is expected to have produced a final-dimension WebP via
 * `cropBottomStrip(rawBuffer, targetHeight)` to remove any FLUX corner
 * watermark — Apothecary buffers are vulnerable to the same artefact
 * Pitti suffered from in Slice 1.1.2k-γ.
 */
export async function uploadApothecaryFarmImage(
  buffer: Buffer,
  slug: string,
): Promise<{ url: string; pathname: string }> {
  const pathname = buildApothecaryFarmObjectKey(slug)
  try {
    const blob = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000,
      allowOverwrite: true,
    })
    apothecaryBlobLogger.info('Apothecary farm image uploaded', {
      slug,
      url: blob.url,
      bytes: buffer.length,
    })
    return { url: blob.url, pathname }
  } catch (error) {
    apothecaryBlobLogger.error(
      'Apothecary blob upload failed',
      { slug },
      error as Error,
    )
    throw new Error(
      `Failed to upload Apothecary farm image: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    )
  }
}
