// src/lib/blob.ts
import { head, put } from '@vercel/blob'

/**
 * We generate a deterministic object key:
 *   farm-photos/{farmSlug}/{photoId}/main
 * Vercel Blob will add the correct extension based on content-type.
 */
export function buildObjectKey(farmSlug: string, photoId: string) {
  return `farm-photos/${encodeURIComponent(farmSlug)}/${photoId}/main`
}

/**
 * Upload file directly to Vercel Blob using the SDK
 * This replaces the manual upload URL creation
 */
export async function uploadToBlob(file: File, pathname: string): Promise<{ url: string }> {
  try {
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false
    })
    
    return { url: blob.url }
  } catch (error) {
    console.error('Blob upload error:', error)
    throw new Error('Failed to upload to blob storage')
  }
}

/**
 * Create a pre-signed upload URL for client-side uploads
 * This uses the proper Vercel Blob SDK approach
 */
export async function createUploadUrl(opts: {
  pathname: string
  contentType: string
  contentLength: number
}): Promise<{ uploadUrl: string }> {
  // For now, we'll use a server-side upload approach since the direct API isn't working
  // This is a workaround that uploads the file server-side and returns the URL
  
  // Return a URL that points to our server-side upload endpoint
  return { 
    uploadUrl: `/api/photos/upload-blob?pathname=${encodeURIComponent(opts.pathname)}&contentType=${encodeURIComponent(opts.contentType)}` 
  }
}

/** HEAD check to confirm the blob exists after client upload */
export async function headBlob(pathname: string): Promise<boolean> {
  try {
    const meta = await head(pathname) // throws if not found
    return !!meta && typeof meta?.size === 'number'
  } catch {
    return false
  }
}
