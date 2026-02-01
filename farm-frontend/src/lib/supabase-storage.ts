/**
 * Supabase Storage - God-tier image storage
 *
 * Unified storage solution using Supabase's built-in storage.
 * Benefits:
 * - Single infrastructure (database + storage)
 * - Built-in CDN with global edge caching
 * - No additional tokens or billing
 * - Simple, reliable API
 *
 * Bucket structure:
 *   farm-images/{slug}/hero.webp
 *   farm-images/{slug}/gallery-{n}.webp
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Storage operations will fail.')
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '')

const BUCKET_NAME = 'farm-images'

/**
 * Process image with Sharp: resize, convert to WebP, optimize
 */
export async function processImage(buffer: Buffer, options?: {
  width?: number
  height?: number
  quality?: number
}): Promise<Buffer> {
  const { width = 1600, height = 900, quality = 85 } = options || {}

  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(width, height, {
      withoutEnlargement: true,
      fit: 'cover',
      position: 'centre'
    })
    .webp({
      quality,
      effort: 4
    })
    .toBuffer()
}

/**
 * Upload farm hero image to Supabase Storage
 */
export async function uploadFarmImageToSupabase(
  buffer: Buffer,
  slug: string,
  options?: {
    processImage?: boolean
    upsert?: boolean
  }
): Promise<{ url: string; path: string }> {
  const { processImage: shouldProcess = true, upsert = true } = options || {}

  // Process image if requested
  const finalBuffer = shouldProcess ? await processImage(buffer) : buffer

  const filePath = `${slug}/hero.webp`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, finalBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000', // 1 year
      upsert
    })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: data.path
  }
}

/**
 * Check if farm image exists in Supabase Storage
 */
export async function farmImageExistsInSupabase(slug: string): Promise<boolean> {
  const filePath = `${slug}/hero.webp`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(slug, { limit: 1, search: 'hero.webp' })

  if (error) {
    return false
  }

  return data && data.length > 0
}

/**
 * Get farm image URL from Supabase Storage
 */
export function getFarmImageUrl(slug: string): string {
  const filePath = `${slug}/hero.webp`

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Delete farm image from Supabase Storage
 */
export async function deleteFarmImage(slug: string): Promise<boolean> {
  const filePath = `${slug}/hero.webp`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  return !error
}

/**
 * Ensure the farm-images bucket exists with proper configuration
 * Note: On self-hosted Supabase, this may fail if bucket already exists or JWT issues
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.warn('Could not list buckets (may be fine if bucket exists):', listError.message)
      return // Continue anyway, upload will fail with clear error if bucket missing
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB max
        allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png']
      })

      if (error && !error.message.includes('already exists')) {
        console.warn('Could not create bucket:', error.message)
        // Don't throw - bucket might exist, let upload fail with clear error
      }
    }
  } catch (err) {
    console.warn('Bucket check failed (continuing anyway):', err)
    // Continue - upload will fail with clear error if there's a real problem
  }
}
