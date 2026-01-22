import axios from 'axios'

/**
 * Produce Content Generator using DeepSeek API
 *
 * Generates high-quality produce metadata:
 * - Nutrition facts (validated against UK/NHS data)
 * - UK seasonality data (months in season, peak months)
 * - Selection, storage, and prep tips
 * - Family-friendly recipe suggestions
 *
 * Following proven patterns from twitter-workflow/src/lib/content-generator.js
 */

export interface NutritionData {
  kcal: number
  protein: number
  carbs: number
  sugars?: number
  fiber?: number
  fat?: number
}

export interface SeasonalityData {
  monthsInSeason: number[]
  peakMonths: number[]
}

export interface TipsData {
  selectionTips: string[]
  storageTips: string[]
  prepIdeas: string[]
}

export interface RecipeChip {
  title: string
  url: string
  description: string
}

export interface GenerationResult<T> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  method: 'ai' | 'fallback'
}

export class ProduceContentGenerator {
  private apiKey: string | undefined
  private baseUrl: string
  private maxRetries: number
  private retryDelay: number

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    this.maxRetries = 3
    this.retryDelay = 1000
  }

  /**
   * Generate nutrition data for a produce item
   */
  async generateNutrition(produceName: string): Promise<GenerationResult<NutritionData>> {
    const prompt = `Generate accurate nutrition facts per 100g for UK fresh ${produceName}.

Requirements:
- Use official UK NHS or USDA FoodData Central values
- Return ONLY valid JSON, no markdown, no explanation
- All values must be numbers (use 0 if trace amounts)
- Energy from protein (4 kcal/g) + carbs (4 kcal/g) + fat (9 kcal/g) should approximately equal total kcal

JSON format:
{
  "kcal": <number>,
  "protein": <number>,
  "carbs": <number>,
  "sugars": <number>,
  "fiber": <number>,
  "fat": <number>
}

Example for strawberries:
{
  "kcal": 32,
  "protein": 0.7,
  "carbs": 7.7,
  "sugars": 4.9,
  "fiber": 2.0,
  "fat": 0.3
}`

    try {
      console.log(`🍎 Generating nutrition for: ${produceName}`)
      const response = await this.callDeepSeekAPI(prompt, 0.1, 300)

      if (response.success && response.content) {
        const parsed = this.parseJSON<NutritionData>(response.content)

        if (parsed.success && parsed.data) {
          const validation = this.validateNutrition(parsed.data, produceName)

          if (validation.valid) {
            console.log(`✅ Generated nutrition for ${produceName}`)
            return {
              success: true,
              data: parsed.data,
              confidence: validation.confidence,
              method: 'ai'
            }
          } else {
            console.warn(`⚠️  Nutrition validation failed: ${validation.errors.join(', ')}`)
            return {
              success: false,
              error: validation.errors.join(', '),
              method: 'ai'
            }
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to parse nutrition data',
        method: 'ai'
      }
    } catch (error) {
      console.error(`❌ Nutrition generation error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'ai'
      }
    }
  }

  /**
   * Generate UK seasonality data
   */
  async generateSeasonality(produceName: string): Promise<GenerationResult<SeasonalityData>> {
    const prompt = `Generate accurate UK seasonality data for ${produceName}.

Requirements:
- Use official UK seasonal food calendars (e.g., from Eat Seasonably, DEFRA)
- Return ONLY valid JSON, no markdown, no explanation
- monthsInSeason: array of month numbers (1-12) when produce is available in UK
- peakMonths: array of month numbers when produce is at its best quality and abundance
- peakMonths must be a subset of monthsInSeason

JSON format:
{
  "monthsInSeason": [<month numbers>],
  "peakMonths": [<month numbers>]
}

Example for strawberries:
{
  "monthsInSeason": [5, 6, 7, 8, 9],
  "peakMonths": [6, 7]
}`

    try {
      console.log(`📅 Generating seasonality for: ${produceName}`)
      const response = await this.callDeepSeekAPI(prompt, 0.1, 200)

      if (response.success && response.content) {
        const parsed = this.parseJSON<SeasonalityData>(response.content)

        if (parsed.success && parsed.data) {
          const validation = this.validateSeasonality(parsed.data, produceName)

          if (validation.valid) {
            console.log(`✅ Generated seasonality for ${produceName}`)
            return {
              success: true,
              data: parsed.data,
              confidence: validation.confidence,
              method: 'ai'
            }
          } else {
            console.warn(`⚠️  Seasonality validation failed: ${validation.errors.join(', ')}`)
            return {
              success: false,
              error: validation.errors.join(', '),
              method: 'ai'
            }
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to parse seasonality data',
        method: 'ai'
      }
    } catch (error) {
      console.error(`❌ Seasonality generation error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'ai'
      }
    }
  }

  /**
   * Call DeepSeek API with retry logic
   * Pattern from twitter-workflow/src/lib/content-generator.js
   */
  private async callDeepSeekAPI(
    prompt: string,
    temperature: number = 0.3,
    maxTokens: number = 500
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local'
      }
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/v1/chat/completions`,
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: false
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        )

        if (response.data?.choices?.[0]?.message?.content) {
          return {
            success: true,
            content: response.data.choices[0].message.content.trim()
          }
        } else {
          throw new Error('Invalid response format from DeepSeek API')
        }

      } catch (error) {
        console.error(`❌ DeepSeek API attempt ${attempt}/${this.maxRetries} failed:`,
          error instanceof Error ? error.message : 'Unknown error')

        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: `DeepSeek API failed after ${this.maxRetries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          }
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }

    return {
      success: false,
      error: 'API call exhausted all retries'
    }
  }

  /**
   * Parse JSON response with error handling
   */
  private parseJSON<T>(content: string): { success: boolean; data?: T; error?: string } {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim()
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '').trim()
      }

      const parsed = JSON.parse(cleaned) as T
      return { success: true, data: parsed }
    } catch (error) {
      return {
        success: false,
        error: `JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Validate nutrition data ranges
   */
  private validateNutrition(
    data: NutritionData,
    produceName: string
  ): { valid: boolean; errors: string[]; confidence: number } {
    const errors: string[] = []

    // Range checks
    if (data.kcal < 0 || data.kcal > 900) errors.push('kcal out of range (0-900)')
    if (data.protein < 0 || data.protein > 30) errors.push('protein out of range (0-30g)')
    if (data.carbs < 0 || data.carbs > 100) errors.push('carbs out of range (0-100g)')
    if (data.fat && (data.fat < 0 || data.fat > 100)) errors.push('fat out of range (0-100g)')

    // Energy calculation check (protein and carbs = 4 kcal/g, fat = 9 kcal/g)
    const calculatedKcal = (data.protein * 4) + (data.carbs * 4) + ((data.fat || 0) * 9)
    const energyAccuracy = Math.abs(data.kcal - calculatedKcal) / data.kcal

    if (energyAccuracy > 0.20) { // Allow 20% margin for rounding and fiber
      errors.push(`Energy calculation off by ${(energyAccuracy * 100).toFixed(1)}%`)
    }

    // Confidence scoring
    let confidence = 100
    if (energyAccuracy > 0.15) confidence -= 10
    if (energyAccuracy > 0.20) confidence -= 15
    if (errors.length > 0) confidence -= (errors.length * 10)

    return {
      valid: errors.length === 0,
      errors,
      confidence: Math.max(0, confidence)
    }
  }

  /**
   * Validate seasonality data
   */
  private validateSeasonality(
    data: SeasonalityData,
    produceName: string
  ): { valid: boolean; errors: string[]; confidence: number } {
    const errors: string[] = []

    // Validate month ranges
    const allMonths = [...data.monthsInSeason, ...data.peakMonths]
    if (allMonths.some(m => m < 1 || m > 12)) {
      errors.push('Month numbers must be between 1-12')
    }

    // Validate peak months are subset of in-season months
    const notInSeason = data.peakMonths.filter(pm => !data.monthsInSeason.includes(pm))
    if (notInSeason.length > 0) {
      errors.push(`Peak months ${notInSeason.join(', ')} not in monthsInSeason`)
    }

    // Validate reasonable season length
    if (data.monthsInSeason.length === 0) {
      errors.push('Must have at least one month in season')
    }
    if (data.monthsInSeason.length > 12) {
      errors.push('Cannot have more than 12 months in season')
    }

    const confidence = errors.length === 0 ? 95 : Math.max(0, 95 - (errors.length * 20))

    return {
      valid: errors.length === 0,
      errors,
      confidence
    }
  }

  /**
   * Test the generator with a sample produce item
   */
  async testGeneration(produceName: string = 'strawberries'): Promise<void> {
    console.log(`\n🧪 Testing ProduceContentGenerator with: ${produceName}`)
    console.log('='.repeat(60))

    // Test nutrition generation
    console.log('\n1. Testing Nutrition Generation...')
    const nutritionResult = await this.generateNutrition(produceName)
    if (nutritionResult.success) {
      console.log('✅ Nutrition:', JSON.stringify(nutritionResult.data, null, 2))
      console.log(`   Confidence: ${nutritionResult.confidence}%`)
    } else {
      console.log('❌ Nutrition failed:', nutritionResult.error)
    }

    // Test seasonality generation
    console.log('\n2. Testing Seasonality Generation...')
    const seasonalityResult = await this.generateSeasonality(produceName)
    if (seasonalityResult.success) {
      console.log('✅ Seasonality:', JSON.stringify(seasonalityResult.data, null, 2))
      console.log(`   Confidence: ${seasonalityResult.confidence}%`)
    } else {
      console.log('❌ Seasonality failed:', seasonalityResult.error)
    }

    console.log('\n' + '='.repeat(60))
  }
}

// Export singleton instance
export const produceContentGenerator = new ProduceContentGenerator()
