// src/lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { logger } from '@/lib/logger'

const storageLogger = logger.child({ route: 'lib/supabase-storage' })

// Initialize Supabase client with service role key for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  storageLogger.warn('Supabase credentials not configured')
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

const BUCKET_NAME = 'farm-images'

/**
 * Build object path for farm images
 * Path pattern: {slug}/main.webp
 */
export function buildFarmObjectPath(slug: string): string {
  return `${encodeURIComponent(slug)}/main.webp`
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
 * Ensure the farm-images bucket exists
 */
async function ensureBucketExists(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (!bucketExists) {
    storageLogger.info('Creating farm-images bucket')
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png']
    })
    if (error && !error.message.includes('already exists')) {
      throw error
    }
  }
}

/**
 * Upload farm image to Supabase Storage
 */
export async function uploadFarmImageToSupabase(
  buffer: Buffer,
  slug: string,
  metadata?: {
    farmName?: string
    generatedAt?: string
    allowOverwrite?: boolean
  }
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  try {
    storageLogger.info('Processing farm image for Supabase', { slug })

    // Ensure bucket exists
    await ensureBucketExists()

    // Process image with Sharp
    const processedBuffer = await processFarmImage(buffer)

    storageLogger.debug('Farm image processed', {
      slug,
      originalBytes: buffer.length,
      processedBytes: processedBuffer.length
    })

    // Build path
    const path = buildFarmObjectPath(slug)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, processedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year
        upsert: metadata?.allowOverwrite ?? true
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path)

    const url = urlData.publicUrl

    storageLogger.info('Farm image uploaded to Supabase', { slug, url })

    return { url, path }
  } catch (error) {
    storageLogger.error('Supabase upload failed', { slug }, error as Error)
    throw new Error(`Failed to upload farm image: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

/**
 * Check if farm image exists in Supabase Storage
 */
export async function farmImageExistsInSupabase(slug: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const path = buildFarmObjectPath(slug)
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .list(encodeURIComponent(slug))

    return data?.some(f => f.name === 'main.webp') ?? false
  } catch {
    return false
  }
}

/**
 * Get farm image URL from Supabase Storage
 */
export function getFarmImageUrlFromSupabase(slug: string): string | null {
  if (!supabase) return null

  const path = buildFarmObjectPath(slug)
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Delete farm image from Supabase Storage
 */
export async function deleteFarmImageFromSupabase(slug: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const path = buildFarmObjectPath(slug)
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) throw error

    storageLogger.info('Deleted farm image from Supabase', { slug })
    return true
  } catch (error) {
    storageLogger.error('Supabase delete failed', { slug }, error as Error)
    return false
  }
}
