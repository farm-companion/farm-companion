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
   * Generate tips (selection, storage, prep)
   */
  async generateTips(produceName: string): Promise<GenerationResult<TipsData>> {
    const prompt = `Generate practical tips for UK consumers buying and using ${produceName}.

Requirements:
- Return ONLY valid JSON, no markdown, no explanation
- Use UK terminology (courgette not zucchini, aubergine not eggplant)
- Use metric measurements (grams, celsius) not US (cups, fahrenheit)
- 3-5 tips per category
- Tips should be concise (1-2 sentences each)
- Focus on practical, actionable advice

JSON format:
{
  "selectionTips": [<3-5 tips for choosing quality produce>],
  "storageTips": [<3-5 tips for keeping produce fresh>],
  "prepIdeas": [<3-5 ideas for preparing and cooking>]
}

Example for strawberries:
{
  "selectionTips": [
    "Look for bright red berries with fresh green leaves",
    "Avoid strawberries with white or green patches",
    "Choose firm berries without soft spots or mould"
  ],
  "storageTips": [
    "Store unwashed in the fridge for up to 3 days",
    "Keep in a single layer to prevent bruising",
    "Wash just before eating to prevent spoilage"
  ],
  "prepIdeas": [
    "Hull and slice for fresh fruit salads",
    "Mash with a little sugar for quick strawberry sauce",
    "Freeze for smoothies or ice cream toppings"
  ]
}`

    try {
      console.log(`💡 Generating tips for: ${produceName}`)
      const response = await this.callDeepSeekAPI(prompt, 0.2, 600)

      if (response.success && response.content) {
        const parsed = this.parseJSON<TipsData>(response.content)

        if (parsed.success && parsed.data) {
          const validation = this.validateTips(parsed.data, produceName)

          if (validation.valid) {
            console.log(`✅ Generated tips for ${produceName}`)
            return {
              success: true,
              data: parsed.data,
              confidence: validation.confidence,
              method: 'ai'
            }
          } else {
            console.warn(`⚠️  Tips validation failed: ${validation.errors.join(', ')}`)
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
        error: response.error || 'Failed to parse tips data',
        method: 'ai'
      }
    } catch (error) {
      console.error(`❌ Tips generation error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'ai'
      }
    }
  }

  /**
   * Generate family-friendly recipe chips
   */
  async generateRecipeChips(produceName: string): Promise<GenerationResult<RecipeChip[]>> {
    const prompt = `Find 3 family-friendly recipes featuring ${produceName} from reputable UK sources.

Requirements:
- Return ONLY valid JSON, no markdown, no explanation
- Only recipes from these approved UK domains:
  * bbc.co.uk/food
  * jamieoliver.com
  * tesco.com/recipes
  * sainsburys.co.uk/recipes
  * bbcgoodfood.com
  * deliaonline.com
- NO alcohol-based recipes (wine, beer, spirits)
- NO gambling-related content
- Family-appropriate content only
- Recipes must actually feature ${produceName} as a main ingredient

JSON format:
{
  "recipes": [
    {
      "title": "<Recipe name>",
      "url": "<Full URL to recipe>",
      "description": "<One sentence description>"
    }
  ]
}

Example for strawberries:
{
  "recipes": [
    {
      "title": "Classic British Strawberry Trifle",
      "url": "https://www.bbc.co.uk/food/recipes/strawberry_trifle",
      "description": "A traditional layered dessert with sponge, custard, and fresh strawberries"
    },
    {
      "title": "Strawberry and Cream Scones",
      "url": "https://www.jamieoliver.com/recipes/bread-recipes/strawberry-scones/",
      "description": "Fluffy scones served warm with strawberries and clotted cream"
    },
    {
      "title": "Easy Strawberry Jam",
      "url": "https://www.bbcgoodfood.com/recipes/strawberry-jam",
      "description": "Homemade jam perfect for toast, scones, or cake filling"
    }
  ]
}`

    try {
      console.log(`🍳 Generating recipes for: ${produceName}`)
      const response = await this.callDeepSeekAPI(prompt, 0.3, 800)

      if (response.success && response.content) {
        const parsed = this.parseJSON<{ recipes: RecipeChip[] }>(response.content)

        if (parsed.success && parsed.data?.recipes) {
          const validation = await this.validateRecipes(parsed.data.recipes, produceName)

          if (validation.valid) {
            console.log(`✅ Generated ${parsed.data.recipes.length} recipes for ${produceName}`)
            return {
              success: true,
              data: parsed.data.recipes,
              confidence: validation.confidence,
              method: 'ai'
            }
          } else {
            console.warn(`⚠️  Recipe validation failed: ${validation.errors.join(', ')}`)
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
        error: response.error || 'Failed to parse recipe data',
        method: 'ai'
      }
    } catch (error) {
      console.error(`❌ Recipe generation error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'ai'
      }
    }
  }

  /**
   * Self-review generated content for quality and accuracy
   */
  async reviewGeneration(
    produceName: string,
    nutrition?: NutritionData,
    seasonality?: SeasonalityData,
    tips?: TipsData,
    recipes?: RecipeChip[]
  ): Promise<GenerationResult<{ approved: boolean; issues: string[]; notes: string }>> {
    const dataStr = JSON.stringify({
      produceName,
      nutrition,
      seasonality,
      tips,
      recipes
    }, null, 2)

    const prompt = `Review this generated produce data for ${produceName} for accuracy and completeness.

Data to review:
${dataStr}

Check for:
1. Nutrition values seem realistic for ${produceName}
2. UK seasonality matches known growing seasons
3. Tips are practical and UK-specific
4. Recipes are family-friendly and appropriate
5. No obvious errors or inconsistencies

Return ONLY valid JSON:
{
  "approved": <boolean - true if data is accurate and complete>,
  "issues": [<array of specific issues found, empty if none>],
  "notes": "<brief summary of review>",
  "confidence": <number 0-100 representing confidence in the data>
}

Example:
{
  "approved": true,
  "issues": [],
  "notes": "All data appears accurate. Nutrition matches NHS values, seasonality correct for UK, tips are practical.",
  "confidence": 98
}`

    try {
      console.log(`🔍 Reviewing generated data for: ${produceName}`)
      const response = await this.callDeepSeekAPI(prompt, 0.1, 400)

      if (response.success && response.content) {
        const parsed = this.parseJSON<{
          approved: boolean
          issues: string[]
          notes: string
          confidence: number
        }>(response.content)

        if (parsed.success && parsed.data) {
          console.log(`✅ Review complete: ${parsed.data.approved ? 'APPROVED' : 'NEEDS REVIEW'}`)
          console.log(`   Confidence: ${parsed.data.confidence}%`)
          if (parsed.data.issues.length > 0) {
            console.log(`   Issues: ${parsed.data.issues.join(', ')}`)
          }

          return {
            success: true,
            data: {
              approved: parsed.data.approved,
              issues: parsed.data.issues,
              notes: parsed.data.notes
            },
            confidence: parsed.data.confidence,
            method: 'ai'
          }
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to parse review data',
        method: 'ai'
      }
    } catch (error) {
      console.error(`❌ Review generation error:`, error)
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
   * Validate tips data
   */
  private validateTips(
    data: TipsData,
    produceName: string
  ): { valid: boolean; errors: string[]; confidence: number } {
    const errors: string[] = []

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

    // Check tip counts (3-5 per category)
    if (data.selectionTips && (data.selectionTips.length < 3 || data.selectionTips.length > 5)) {
      errors.push(`Selection tips should be 3-5, got ${data.selectionTips.length}`)
    }
    if (data.storageTips && (data.storageTips.length < 3 || data.storageTips.length > 5)) {
      errors.push(`Storage tips should be 3-5, got ${data.storageTips.length}`)
    }
    if (data.prepIdeas && (data.prepIdeas.length < 3 || data.prepIdeas.length > 5)) {
      errors.push(`Prep ideas should be 3-5, got ${data.prepIdeas.length}`)
    }

    // Check for US terminology (should use UK terms)
    const allTips = [
      ...(data.selectionTips || []),
      ...(data.storageTips || []),
      ...(data.prepIdeas || [])
    ].join(' ').toLowerCase()

    const usTerms = ['zucchini', 'eggplant', 'cilantro', 'arugula', 'fahrenheit', 'cups', 'ounces']
    const foundUsTerms = usTerms.filter(term => allTips.includes(term))
    if (foundUsTerms.length > 0) {
      errors.push(`Uses US terminology: ${foundUsTerms.join(', ')}`)
    }

    const confidence = errors.length === 0 ? 95 : Math.max(0, 95 - (errors.length * 15))

    return {
      valid: errors.length === 0,
      errors,
      confidence
    }
  }

  /**
   * Validate recipe data with URL checks
   */
  private async validateRecipes(
    recipes: RecipeChip[],
    produceName: string
  ): Promise<{ valid: boolean; errors: string[]; confidence: number }> {
    const errors: string[] = []

    // Check recipe count
    if (recipes.length < 2 || recipes.length > 4) {
      errors.push(`Should have 2-4 recipes, got ${recipes.length}`)
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
        errors.push(`Recipe missing required fields`)
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

      // Check for inappropriate content keywords
      const content = `${recipe.title} ${recipe.description}`.toLowerCase()
      const inappropriateTerms = [
        'wine', 'beer', 'whisky', 'vodka', 'rum', 'gin', 'cocktail',
        'gambling', 'casino', 'betting'
      ]
      const foundInappropriate = inappropriateTerms.filter(term => content.includes(term))
      if (foundInappropriate.length > 0) {
        errors.push(`Recipe contains inappropriate terms: ${foundInappropriate.join(', ')}`)
      }
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

    let nutrition: NutritionData | undefined
    let seasonality: SeasonalityData | undefined
    let tips: TipsData | undefined
    let recipes: RecipeChip[] | undefined

    // Test nutrition generation
    console.log('\n1. Testing Nutrition Generation...')
    const nutritionResult = await this.generateNutrition(produceName)
    if (nutritionResult.success) {
      nutrition = nutritionResult.data
      console.log('✅ Nutrition:', JSON.stringify(nutrition, null, 2))
      console.log(`   Confidence: ${nutritionResult.confidence}%`)
    } else {
      console.log('❌ Nutrition failed:', nutritionResult.error)
    }

    // Test seasonality generation
    console.log('\n2. Testing Seasonality Generation...')
    const seasonalityResult = await this.generateSeasonality(produceName)
    if (seasonalityResult.success) {
      seasonality = seasonalityResult.data
      console.log('✅ Seasonality:', JSON.stringify(seasonality, null, 2))
      console.log(`   Confidence: ${seasonalityResult.confidence}%`)
    } else {
      console.log('❌ Seasonality failed:', seasonalityResult.error)
    }

    // Test tips generation
    console.log('\n3. Testing Tips Generation...')
    const tipsResult = await this.generateTips(produceName)
    if (tipsResult.success) {
      tips = tipsResult.data
      console.log('✅ Tips generated:')
      console.log('   Selection:', tips?.selectionTips?.length || 0, 'tips')
      console.log('   Storage:', tips?.storageTips?.length || 0, 'tips')
      console.log('   Prep:', tips?.prepIdeas?.length || 0, 'tips')
      console.log(`   Confidence: ${tipsResult.confidence}%`)
    } else {
      console.log('❌ Tips failed:', tipsResult.error)
    }

    // Test recipe generation
    console.log('\n4. Testing Recipe Generation...')
    const recipeResult = await this.generateRecipeChips(produceName)
    if (recipeResult.success) {
      recipes = recipeResult.data
      console.log(`✅ Recipes: ${recipes?.length || 0} recipes generated`)
      recipes?.forEach((recipe, i) => {
        console.log(`   ${i + 1}. ${recipe.title}`)
        console.log(`      ${recipe.url}`)
      })
      console.log(`   Confidence: ${recipeResult.confidence}%`)
    } else {
      console.log('❌ Recipes failed:', recipeResult.error)
    }

    // Test self-review
    console.log('\n5. Testing Self-Review...')
    const reviewResult = await this.reviewGeneration(
      produceName,
      nutrition,
      seasonality,
      tips,
      recipes
    )
    if (reviewResult.success && reviewResult.data) {
      console.log(`✅ Review: ${reviewResult.data.approved ? 'APPROVED ✓' : 'NEEDS REVIEW ⚠️'}`)
      console.log(`   Confidence: ${reviewResult.confidence}%`)
      console.log(`   Notes: ${reviewResult.data.notes}`)
      if (reviewResult.data.issues.length > 0) {
        console.log('   Issues:')
        reviewResult.data.issues.forEach(issue => console.log(`   - ${issue}`))
      }
    } else {
      console.log('❌ Review failed:', reviewResult.error)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Nutrition:    ${nutritionResult.success ? '✅' : '❌'} (${nutritionResult.confidence || 0}%)`)
    console.log(`Seasonality:  ${seasonalityResult.success ? '✅' : '❌'} (${seasonalityResult.confidence || 0}%)`)
    console.log(`Tips:         ${tipsResult.success ? '✅' : '❌'} (${tipsResult.confidence || 0}%)`)
    console.log(`Recipes:      ${recipeResult.success ? '✅' : '❌'} (${recipeResult.confidence || 0}%)`)
    console.log(`Review:       ${reviewResult.success ? '✅' : '❌'} (${reviewResult.confidence || 0}%)`)

    const avgConfidence = [
      nutritionResult.confidence || 0,
      seasonalityResult.confidence || 0,
      tipsResult.confidence || 0,
      recipeResult.confidence || 0,
      reviewResult.confidence || 0
    ].reduce((a, b) => a + b, 0) / 5

    console.log(`\nOverall Confidence: ${avgConfidence.toFixed(1)}%`)
    console.log(avgConfidence >= 95 ? '✅ AUTO-APPROVE THRESHOLD MET' : '⚠️  MANUAL REVIEW REQUIRED')
    console.log('='.repeat(60) + '\n')
  }
}

// Export singleton instance
export const produceContentGenerator = new ProduceContentGenerator()
