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
  const keywords = keywordMatch 
    ? keywordMatch[1].split(',').map(k => k.trim()).filter(Boolean)
    : []

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
