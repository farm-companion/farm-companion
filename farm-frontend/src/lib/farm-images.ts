/**
 * Farm Image Priority Logic
 *
 * Determines which image to display for a farm based on source priority.
 * Priority order: owner > user > google > runware > upload
 */

import { getGooglePhotoUrl } from './google-photos'

// Image sources in priority order (highest first)
const SOURCE_PRIORITY: string[] = ['owner', 'user', 'google', 'runware', 'upload']

export interface FarmImage {
  id: string
  url: string
  altText?: string | null
  source: string
  isHero: boolean
  googlePhotoRef?: string | null
  googleAttribution?: string | null
}

/**
 * Get the hero image for a farm, respecting source priority.
 *
 * @param images - Array of approved images for the farm
 * @returns The best image to display, or null if none available
 */
export function getHeroImage(images: FarmImage[]): FarmImage | null {
  if (!images || images.length === 0) return null

  // First try to find a hero image by priority
  for (const source of SOURCE_PRIORITY) {
    const heroImage = images.find(
      img => img.source === source && img.isHero
    )
    if (heroImage) return heroImage
  }

  // Fallback: any image by priority
  for (const source of SOURCE_PRIORITY) {
    const image = images.find(img => img.source === source)
    if (image) return image
  }

  // Last resort: first available image
  return images[0] || null
}

/**
 * Get all images for a farm, sorted by priority.
 *
 * @param images - Array of approved images
 * @returns Sorted array with highest priority first
 */
export function getSortedImages(images: FarmImage[]): FarmImage[] {
  if (!images || images.length === 0) return []

  return [...images].sort((a, b) => {
    // Hero images first
    if (a.isHero && !b.isHero) return -1
    if (!a.isHero && b.isHero) return 1

    // Then by source priority
    const priorityA = SOURCE_PRIORITY.indexOf(a.source)
    const priorityB = SOURCE_PRIORITY.indexOf(b.source)

    // Unknown sources go last
    const effectiveA = priorityA === -1 ? SOURCE_PRIORITY.length : priorityA
    const effectiveB = priorityB === -1 ? SOURCE_PRIORITY.length : priorityB

    return effectiveA - effectiveB
  })
}

/**
 * Resolve the display URL for an image.
 *
 * For Google photos, this fetches the URL from the photo reference.
 * For other sources, returns the stored URL.
 *
 * @param image - The image to resolve
 * @param maxWidth - Maximum width for Google photos
 * @returns The display URL or null
 */
export function resolveImageUrl(
  image: FarmImage,
  maxWidth: number = 800
): string | null {
  if (!image) return null

  // For Google photos, use the photo reference
  if (image.source === 'google' && image.googlePhotoRef) {
    return getGooglePhotoUrl(image.googlePhotoRef, maxWidth)
  }

  // For other sources, use the stored URL
  return image.url || null
}

/**
 * Get display-ready hero image URL for a farm.
 *
 * @param images - Array of approved images
 * @param maxWidth - Maximum width for Google photos
 * @returns Object with URL and attribution, or null
 */
export function getHeroImageUrl(
  images: FarmImage[],
  maxWidth: number = 800
): { url: string; attribution?: string } | null {
  const hero = getHeroImage(images)
  if (!hero) return null

  const url = resolveImageUrl(hero, maxWidth)
  if (!url) return null

  return {
    url,
    attribution: hero.googleAttribution || undefined,
  }
}

/**
 * Check if a farm has any approved images.
 */
export function hasImages(images: FarmImage[]): boolean {
  return images && images.length > 0
}

/**
 * Get image source label for display.
 */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    owner: 'Owner Photo',
    user: 'Community Photo',
    google: 'Google',
    runware: 'AI Generated',
    upload: 'Uploaded',
  }
  return labels[source] || source
}
