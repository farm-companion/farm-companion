// SEO utilities for farm data processing

export interface ProcessedFarmData {
  cleanDescription: string
  keywords: string[]
  seoDescription: string
}

/**
 * Extract keywords from farm description and clean for user display
 */
export function processFarmDescription(description: string): ProcessedFarmData {
  if (!description) {
    return {
      cleanDescription: '',
      keywords: [],
      seoDescription: ''
    }
  }

  // Extract keywords from *(Keywords: ...)* pattern
  const keywordMatch = description.match(/\*\(Keywords:([^)]*)\)\*/)
  const baseKeywords = keywordMatch 
    ? keywordMatch[1].split(',').map(k => k.trim()).filter(Boolean)
    : []

  // Add location-based keywords for better SEO
  const locationKeywords = [
    'farm shop near me',
    'farmshopsnearme',
    'farm shop near you',
    'farms near me',
    'farm shops near me',
    'farm shops near you',
    'farm shop directory near me',
    'farm shop finder',
    'farm shop search',
    'farm shop locator',
    'farm shops in my area',
    'farm shops nearby',
    'farm shops close to me'
  ]

  const keywords = [...baseKeywords, ...locationKeywords]

  // Clean description by removing keyword annotations
  const cleanDescription = description
    .replace(/\*\(Keywords:[^)]*\)\*/g, '')
    .trim()

  // Create SEO description that includes keywords
  const seoDescription = keywords.length > 0
    ? `${cleanDescription} ${keywords.join(', ')}`
    : cleanDescription

  return {
    cleanDescription,
    keywords,
    seoDescription
  }
}

/**
 * Extract keywords from farm description for structured data
 */
export function extractKeywords(description: string): string[] {
  if (!description) return []
  
  const keywordMatch = description.match(/\*\(Keywords:([^)]*)\)\*/)
  return keywordMatch 
    ? keywordMatch[1].split(',').map(k => k.trim()).filter(Boolean)
    : []
}

/**
 * Clean description for user display
 */
export function cleanDescription(description: string): string {
  if (!description) return ''
  
  return description
    .replace(/\*\(Keywords:[^)]*\)\*/g, '')
    .trim()
}
