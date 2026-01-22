/**
 * Produce Data Validator
 *
 * Comprehensive validation for complete produce items
 * Checks nutrition, seasonality, tips, recipes, and images
 */

import type {
  NutritionData,
  SeasonalityData,
  TipsData,
  RecipeChip
} from './produce-content-generator'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  confidence: number
}

export interface CompleteValidationResult {
  overall: ValidationResult
  nutrition?: ValidationResult
  seasonality?: ValidationResult
  tips?: ValidationResult
  recipes?: ValidationResult
}

export class ProduceValidator {
  /**
   * Validate complete produce data
   */
  validateComplete(data: {
    name: string
    slug: string
    nutrition?: NutritionData
    seasonality?: SeasonalityData
    tips?: TipsData
    recipes?: RecipeChip[]
  }): CompleteValidationResult {
    const results: CompleteValidationResult = {
      overall: {
        valid: true,
        errors: [],
        warnings: [],
        confidence: 100
      }
    }

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      results.overall.errors.push('Missing produce name')
    }
    if (!data.slug || data.slug.trim() === '') {
      results.overall.errors.push('Missing slug')
    }

    // Validate slug format
    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      results.overall.errors.push('Slug must be lowercase alphanumeric with hyphens')
    }

    // Validate nutrition if present
    if (data.nutrition) {
      results.nutrition = this.validateNutrition(data.nutrition, data.name)
      if (!results.nutrition.valid) {
        results.overall.errors.push(...results.nutrition.errors.map(e => `Nutrition: ${e}`))
      }
      results.overall.warnings.push(...results.nutrition.warnings.map(w => `Nutrition: ${w}`))
    }

    // Validate seasonality if present
    if (data.seasonality) {
      results.seasonality = this.validateSeasonality(data.seasonality, data.name)
      if (!results.seasonality.valid) {
        results.overall.errors.push(...results.seasonality.errors.map(e => `Seasonality: ${e}`))
      }
      results.overall.warnings.push(...results.seasonality.warnings.map(w => `Seasonality: ${w}`))
    }

    // Validate tips if present
    if (data.tips) {
      results.tips = this.validateTips(data.tips, data.name)
      if (!results.tips.valid) {
        results.overall.errors.push(...results.tips.errors.map(e => `Tips: ${e}`))
      }
      results.overall.warnings.push(...results.tips.warnings.map(w => `Tips: ${w}`))
    }

    // Validate recipes if present
    if (data.recipes) {
      results.recipes = this.validateRecipes(data.recipes, data.name)
      if (!results.recipes.valid) {
        results.overall.errors.push(...results.recipes.errors.map(e => `Recipes: ${e}`))
      }
      results.overall.warnings.push(...results.recipes.warnings.map(w => `Recipes: ${w}`))
    }

    // Calculate overall confidence
    const componentConfidences = [
      results.nutrition?.confidence,
      results.seasonality?.confidence,
      results.tips?.confidence,
      results.recipes?.confidence
    ].filter((c): c is number => c !== undefined)

    if (componentConfidences.length > 0) {
      results.overall.confidence = componentConfidences.reduce((a, b) => a + b, 0) / componentConfidences.length
    }

    // Penalize for errors
    results.overall.confidence -= results.overall.errors.length * 15
    results.overall.confidence -= results.overall.warnings.length * 5
    results.overall.confidence = Math.max(0, Math.min(100, results.overall.confidence))

    results.overall.valid = results.overall.errors.length === 0

    return results
  }

  /**
   * Validate nutrition data
   */
  private validateNutrition(data: NutritionData, produceName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Range checks
    if (data.kcal < 0 || data.kcal > 900) {
      errors.push(`kcal ${data.kcal} out of range (0-900)`)
    }
    if (data.protein < 0 || data.protein > 30) {
      errors.push(`protein ${data.protein}g out of range (0-30g)`)
    }
    if (data.carbs < 0 || data.carbs > 100) {
      errors.push(`carbs ${data.carbs}g out of range (0-100g)`)
    }
    if (data.fat && (data.fat < 0 || data.fat > 100)) {
      errors.push(`fat ${data.fat}g out of range (0-100g)`)
    }

    // Energy calculation check
    const calculatedKcal = (data.protein * 4) + (data.carbs * 4) + ((data.fat || 0) * 9)
    const energyDiff = Math.abs(data.kcal - calculatedKcal)
    const energyAccuracy = energyDiff / data.kcal

    if (energyAccuracy > 0.25) {
      errors.push(`Energy calculation off by ${(energyAccuracy * 100).toFixed(1)}%`)
    } else if (energyAccuracy > 0.15) {
      warnings.push(`Energy calculation off by ${(energyAccuracy * 100).toFixed(1)}%`)
    }

    let confidence = 100
    confidence -= errors.length * 20
    confidence -= warnings.length * 10

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: Math.max(0, confidence)
    }
  }

  /**
   * Validate seasonality data
   */
  private validateSeasonality(data: SeasonalityData, produceName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate month ranges
    const allMonths = [...data.monthsInSeason, ...data.peakMonths]
    if (allMonths.some(m => m < 1 || m > 12)) {
      errors.push('Month numbers must be 1-12')
    }

    // Validate peak months are subset of in-season months
    const notInSeason = data.peakMonths.filter(pm => !data.monthsInSeason.includes(pm))
    if (notInSeason.length > 0) {
      errors.push(`Peak months [${notInSeason.join(', ')}] not in monthsInSeason`)
    }

    // Validate season length
    if (data.monthsInSeason.length === 0) {
      errors.push('Must have at least one month in season')
    }
    if (data.monthsInSeason.length === 12) {
      warnings.push('Year-round produce - verify this is correct')
    }

    let confidence = 95
    confidence -= errors.length * 20
    confidence -= warnings.length * 5

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: Math.max(0, confidence)
    }
  }

  /**
   * Validate tips data
   */
  private validateTips(data: TipsData, produceName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for required categories
    if (!data.selectionTips || data.selectionTips.length === 0) {
      errors.push('Missing selection tips')
    }
    if (!data.storageTips || data.storageTips.length === 0) {
      errors.push('Missing storage tips')
    }
    if (!data.prepIdeas || data.prepIdeas.length === 0) {
      errors.push('Missing prep ideas')
    }

    // Check tip counts
    if (data.selectionTips && (data.selectionTips.length < 3 || data.selectionTips.length > 5)) {
      warnings.push(`Selection tips: ${data.selectionTips.length} (expected 3-5)`)
    }
    if (data.storageTips && (data.storageTips.length < 3 || data.storageTips.length > 5)) {
      warnings.push(`Storage tips: ${data.storageTips.length} (expected 3-5)`)
    }
    if (data.prepIdeas && (data.prepIdeas.length < 3 || data.prepIdeas.length > 5)) {
      warnings.push(`Prep ideas: ${data.prepIdeas.length} (expected 3-5)`)
    }

    // Check for US terminology
    const allTips = [
      ...(data.selectionTips || []),
      ...(data.storageTips || []),
      ...(data.prepIdeas || [])
    ].join(' ').toLowerCase()

    const usTerms = ['zucchini', 'eggplant', 'cilantro', 'arugula', 'fahrenheit']
    const foundUsTerms = usTerms.filter(term => allTips.includes(term))
    if (foundUsTerms.length > 0) {
      errors.push(`Uses US terminology: ${foundUsTerms.join(', ')}`)
    }

    let confidence = 95
    confidence -= errors.length * 15
    confidence -= warnings.length * 5

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: Math.max(0, confidence)
    }
  }

  /**
   * Validate recipes data
   */
  private validateRecipes(recipes: RecipeChip[], produceName: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check recipe count
    if (recipes.length < 2) {
      warnings.push(`Only ${recipes.length} recipes (expected 2-4)`)
    } else if (recipes.length > 4) {
      warnings.push(`${recipes.length} recipes (expected 2-4)`)
    }

    // Approved UK domains
    const approvedDomains = [
      'bbc.co.uk',
      'jamieoliver.com',
      'tesco.com',
      'sainsburys.co.uk',
      'bbcgoodfood.com',
      'deliaonline.com'
    ]

    for (const recipe of recipes) {
      // Check required fields
      if (!recipe.title || !recipe.url || !recipe.description) {
        errors.push('Recipe missing required fields')
        continue
      }

      // Check URL format
      try {
        const url = new URL(recipe.url)

        // Check if domain is approved
        const isApproved = approvedDomains.some(domain =>
          url.hostname.includes(domain)
        )
        if (!isApproved) {
          errors.push(`Recipe URL not from approved domain: ${url.hostname}`)
        }
      } catch (e) {
        errors.push(`Invalid recipe URL: ${recipe.url}`)
      }

      // Check for inappropriate content
      const content = `${recipe.title} ${recipe.description}`.toLowerCase()
      const inappropriateTerms = ['wine', 'beer', 'whisky', 'vodka', 'rum', 'gin', 'cocktail']
      const foundInappropriate = inappropriateTerms.filter(term => content.includes(term))
      if (foundInappropriate.length > 0) {
        errors.push(`Recipe contains alcohol: ${foundInappropriate.join(', ')}`)
      }
    }

    let confidence = 95
    confidence -= errors.length * 20
    confidence -= warnings.length * 5

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence: Math.max(0, confidence)
    }
  }
}

// Export singleton instance
export const produceValidator = new ProduceValidator()
