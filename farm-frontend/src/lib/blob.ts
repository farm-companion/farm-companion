// src/lib/blob.ts
import { head, put } from '@vercel/blob'

export function buildObjectKey(farmSlug: string, photoId: string, contentType?: string) {
  // Determine file extension from content type
  let extension = 'webp' // default to webp
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = 'jpg'
    } else if (contentType.includes('png')) {
      extension = 'png'
    } else if (contentType.includes('webp')) {
      extension = 'webp'
    } else if (contentType.includes('heic')) {
      extension = 'heic'
    }
  }
  
  return `farm-photos/${encodeURIComponent(farmSlug)}/${photoId}/main.${extension}`
}

export function fixPhotoUrl(url: string): string {
  // If the URL doesn't have a file extension, try to add one
  if (url && !url.includes('.') && url.includes('/main')) {
    // Try common extensions
    const extensions = ['webp', 'jpg', 'png', 'jpeg']
    for (const ext of extensions) {
      const fixedUrl = url.replace('/main', `/main.${ext}`)
      console.log(`Trying fixed URL: ${fixedUrl}`)
      // Note: We can't actually test the URL here, but we can return the most likely one
      if (ext === 'webp') return fixedUrl // Default to webp
    }
  }
  return url
}

export async function uploadToBlob(file: File, pathname: string): Promise<{ url: string }> {
  try {
    const blob = await put(pathname, file, { access: 'public', addRandomSuffix: false })
    return { url: blob.url }
  } catch (error) {
    console.error('Blob upload error:', error)
    throw new Error('Failed to upload to blob storage')
  }
}

export async function createUploadUrl(opts: {
  pathname: string
  contentType: string
  contentLength: number
}): Promise<{ uploadUrl: string }> {
  try {
    // Return the upload endpoint URL - the data will be sent in the form body
    return { 
      uploadUrl: `/api/photos/upload-blob`
    }
  } catch (error) {
    console.error('Error creating upload URL:', error)
    throw new Error('Failed to create upload URL')
  }
}

export async function headBlob(pathname: string): Promise<boolean> {
  try {
    const blobInfo = await head(pathname)
    return !!blobInfo
  } catch {
    return false
  }
}

// Wrapper function to get blob info with URL
export async function getBlobInfo(pathname: string) {
  try {
    return await head(pathname)
  } catch {
    return null
  }
}
