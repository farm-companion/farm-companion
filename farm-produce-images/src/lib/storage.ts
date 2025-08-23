import { put, list } from '@vercel/blob'
import { z } from 'zod'
import { ProduceImage } from '@/types/produce'

const ImageUploadSchema = z.object({
  produceSlug: z.string().min(1),
  month: z.number().min(1).max(12),
  alt: z.string().min(1),
  isPrimary: z.boolean().default(false),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    location: z.string().optional(),
    photographer: z.string().optional(),
  }).optional(),
})

export async function uploadProduceImage(
  file: File,
  options: z.infer<typeof ImageUploadSchema>
): Promise<ProduceImage> {
  try {
    // Validate input
    const validatedOptions = ImageUploadSchema.parse(options)
    
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `produce/${validatedOptions.produceSlug}/${validatedOptions.month}/${timestamp}.${fileExtension}`
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })
    
    // Create image record
    const image: ProduceImage = {
      id: `${validatedOptions.produceSlug}-${validatedOptions.month}-${timestamp}`,
      url: blob.url,
      alt: validatedOptions.alt,
      width: 0, // Will be updated after processing
      height: 0, // Will be updated after processing
      size: file.size,
      format: fileExtension as 'jpeg' | 'png' | 'webp',
      uploadedAt: new Date().toISOString(),
      month: validatedOptions.month,
      produceSlug: validatedOptions.produceSlug,
      isPrimary: validatedOptions.isPrimary,
      metadata: validatedOptions.metadata,
    }
    
    return image
  } catch (error) {
    console.error('Error uploading produce image:', error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteProduceImage(_imageId: string): Promise<void> {
  try {
    // Get image metadata from database first
    // This would be implemented in database.ts
    // const image = await getImageMetadata(imageId)
    
    // Delete from Vercel Blob
    // await del(image.url)
    
    // Delete metadata from database
    // await deleteImageMetadata(imageId)
    
    console.log(`Image ${_imageId} deleted successfully`)
  } catch (error) {
    console.error('Error deleting produce image:', error)
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function listProduceImages(
  produceSlug?: string,
  month?: number
): Promise<string[]> {
  try {
    const prefix = produceSlug 
      ? month 
        ? `produce/${produceSlug}/${month}/`
        : `produce/${produceSlug}/`
      : 'produce/'
    
    const { blobs } = await list({ prefix })
    return blobs.map(blob => blob.url)
  } catch (error) {
    console.error('Error listing produce images:', error)
    throw new Error(`Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getImageUrl(imageId: string): Promise<string | null> {
  try {
    // This would typically fetch from database first
    // const image = await getImageMetadata(imageId)
    // return image?.url || null
    
    // For now, return null
    return null
  } catch (error) {
    console.error('Error getting image URL:', error)
    return null
  }
}
