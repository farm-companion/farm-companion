// Image utility system for produce pages
// Handles validation, fallbacks, and optimization

export type ImageSource = {
  src: string
  alt: string
  credit?: string
  isLocal?: boolean
  fallback?: string
}

export type ImageValidation = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// Image validation rules
const IMAGE_RULES = {
  minWidth: 800,
  minHeight: 600,
  maxFileSize: 500, // KB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  requiredAltText: true,
  maxAltLength: 150,
}

// Validate a single image
export function validateImage(image: ImageSource): ImageValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Check if image source exists
  if (!image.src) {
    errors.push('Image source is required')
    return { isValid: false, errors, warnings, suggestions }
  }

  // Check if it's a local image
  const isLocal = image.src.startsWith('/images/')
  
  // Validate external URLs
  if (!isLocal) {
    if (!image.src.startsWith('https://')) {
      errors.push('External images must use HTTPS')
    }
    
    // Check for Unsplash optimization parameters
    if (image.src.includes('unsplash.com') && !image.src.includes('w=800')) {
      warnings.push('Unsplash images should include size parameters for optimization')
      suggestions.push('Add ?w=800&h=600&fit=crop to Unsplash URLs')
    }
  }

  // Validate alt text
  if (!image.alt || image.alt.trim().length === 0) {
    errors.push('Alt text is required for accessibility')
  } else if (image.alt.length > IMAGE_RULES.maxAltLength) {
    warnings.push(`Alt text is too long (${image.alt.length} chars, max ${IMAGE_RULES.maxAltLength})`)
  }

  // Check for common issues
  if (image.alt.toLowerCase().includes('blueberry') && !image.src.toLowerCase().includes('blackberry')) {
    errors.push('Alt text mentions blueberries but image may not be blackberries')
  }

  if (image.alt.toLowerCase().includes('trouser') || image.alt.toLowerCase().includes('pant')) {
    errors.push('Alt text contains inappropriate content (trousers/pants)')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

// Validate all images for a produce item
export function validateProduceImages(images: ImageSource[]): {
  overall: ImageValidation
  individual: ImageValidation[]
} {
  const individual = images.map(validateImage)
  const allErrors = individual.flatMap(v => v.errors)
  const allWarnings = individual.flatMap(v => v.warnings)
  const allSuggestions = individual.flatMap(v => v.suggestions)

  return {
    overall: {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions
    },
    individual
  }
}

// Get optimized image URL
export function getOptimizedImageUrl(src: string, width: number = 800, height: number = 600): string {
  if (src.startsWith('/images/')) {
    // Local images - Next.js will optimize automatically
    return src
  }
  
  if (src.includes('unsplash.com')) {
    // Add optimization parameters if not present
    const url = new URL(src)
    if (!url.searchParams.has('w')) {
      url.searchParams.set('w', width.toString())
      url.searchParams.set('h', height.toString())
      url.searchParams.set('fit', 'crop')
    }
    return url.toString()
  }
  
  return src
}

// Get fallback image for failed loads
export function getFallbackImage(_produceName: string): string {
  // Return a placeholder or default image
  return `https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop&auto=format&q=80`
}

// Check if image is local
export function isLocalImage(src: string): boolean {
  return src.startsWith('/images/')
}

// Get image priority (hero images should load first)
export function getImagePriority(index: number): boolean {
  return index === 0 // First image (hero) gets priority
}

// Generate image sizes for responsive loading
export function getImageSizes(containerWidth: string = '100vw'): string {
  return `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${containerWidth}`
}

// Validate produce image data structure
export function validateProduceImageData(produce: {
  slug: string
  name: string
  images: ImageSource[]
}): ImageValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Check if produce has images
  if (!produce.images || produce.images.length === 0) {
    errors.push(`${produce.name} has no images`)
    return { isValid: false, errors, warnings, suggestions: [] }
  }

  // Validate each image
  const imageValidation = validateProduceImages(produce.images)
  
  // Check for minimum image count
  if (produce.images.length < 2) {
    warnings.push(`${produce.name} should have at least 2 images (hero + gallery)`)
  }

  // Check for local images
  const localImages = produce.images.filter(img => isLocalImage(img.src))
  if (localImages.length === 0) {
    suggestions.push(`Consider adding local images for ${produce.name} to ensure accuracy`)
  }

  return {
    isValid: imageValidation.overall.isValid,
    errors: [...errors, ...imageValidation.overall.errors],
    warnings: [...warnings, ...imageValidation.overall.warnings],
    suggestions: [...suggestions, ...imageValidation.overall.suggestions]
  }
}
