import sharp from 'sharp'
import { z } from 'zod'

const ImageProcessingOptionsSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  quality: z.number().min(1).max(100).default(85),
  format: z.enum(['jpeg', 'png', 'webp']).default('webp'),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
})

export interface ImageDimensions {
  width: number
  height: number
}

export interface ProcessedImage {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
}

export async function getImageDimensions(buffer: Buffer): Promise<ImageDimensions> {
  try {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    }
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function processImage(
  buffer: Buffer,
  options: z.infer<typeof ImageProcessingOptionsSchema>
): Promise<ProcessedImage> {
  try {
    // Validate options
    const validatedOptions = ImageProcessingOptionsSchema.parse(options)
    
    // Start with the input buffer
    let processor = sharp(buffer)
    
    // Resize if dimensions provided
    if (validatedOptions.width || validatedOptions.height) {
      processor = processor.resize({
        width: validatedOptions.width,
        height: validatedOptions.height,
        fit: validatedOptions.fit,
        withoutEnlargement: true,
      })
    }
    
    // Convert to specified format
    switch (validatedOptions.format) {
      case 'jpeg':
        processor = processor.jpeg({ quality: validatedOptions.quality })
        break
      case 'png':
        processor = processor.png({ quality: validatedOptions.quality })
        break
      case 'webp':
        processor = processor.webp({ quality: validatedOptions.quality })
        break
    }
    
    // Process the image
    const processedBuffer = await processor.toBuffer()
    const metadata = await sharp(processedBuffer).metadata()
    
    return {
      buffer: processedBuffer,
      format: validatedOptions.format,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: processedBuffer.length,
    }
  } catch (error) {
    console.error('Error processing image:', error)
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function createThumbnail(
  buffer: Buffer,
  size: number = 300
): Promise<ProcessedImage> {
  try {
    const thumbnail = await processImage(buffer, {
      width: size,
      height: size,
      quality: 80,
      format: 'webp',
      fit: 'cover',
    })
    
    return thumbnail
  } catch (error) {
    console.error('Error creating thumbnail:', error)
    throw new Error(`Failed to create thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function optimizeForWeb(
  buffer: Buffer,
  maxWidth: number = 1200
): Promise<ProcessedImage> {
  try {
    const metadata = await sharp(buffer).metadata()
    const originalWidth = metadata.width || 0
    
    // Only resize if image is larger than maxWidth
    const targetWidth = originalWidth > maxWidth ? maxWidth : undefined
    
    const optimized = await processImage(buffer, {
      width: targetWidth,
      quality: 85,
      format: 'webp',
      fit: 'inside',
    })
    
    return optimized
  } catch (error) {
    console.error('Error optimizing image for web:', error)
    throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function validateImage(
  buffer: Buffer,
  maxSize: number = 5 * 1024 * 1024 // 5MB
): Promise<{ isValid: boolean; error?: string; dimensions?: ImageDimensions }> {
  try {
    // Check file size
    if (buffer.length > maxSize) {
      return {
        isValid: false,
        error: `Image size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
      }
    }
    
    // Check if it's a valid image
    const metadata = await sharp(buffer).metadata()
    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: 'Invalid image format or corrupted file',
      }
    }
    
    // Check minimum dimensions
    if (metadata.width < 100 || metadata.height < 100) {
      return {
        isValid: false,
        error: 'Image dimensions too small (minimum 100x100 pixels)',
      }
    }
    
    return {
      isValid: true,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

export async function generateImageVariants(
  buffer: Buffer
): Promise<{
  thumbnail: ProcessedImage
  optimized: ProcessedImage
  original: ImageDimensions
}> {
  try {
    const original = await getImageDimensions(buffer)
    const thumbnail = await createThumbnail(buffer, 300)
    const optimized = await optimizeForWeb(buffer, 1200)
    
    return {
      thumbnail,
      optimized,
      original,
    }
  } catch (error) {
    console.error('Error generating image variants:', error)
    throw new Error(`Failed to generate image variants: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
