import axios from 'axios'
import { logger } from '@/lib/logger'

const imageGenLogger = logger.child({ route: 'lib/farm-image-generator' })

const NO_FACE_NEGATIVE = 'no people, no person, no faces, no humans, no portrait, no crowds, no watermark, no text, no logo, no signs with text, no distorted buildings, no modern architecture'

interface FarmImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  county?: string
}

/**
 * FarmImageGenerator - Generate AI images for farm shops
 * Uses fal.ai FLUX with Pollinations as fallback
 */
export class FarmImageGenerator {
  private falApiKey: string | undefined
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  constructor() {
    this.falApiKey = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY
  }

  /**
   * Generate editorial photography for a farm shop
   */
  async generateFarmImage(
    farmName: string,
    slug: string,
    options: FarmImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating farm image', { farmName, slug })

      const width = options.width ?? 1600
      const height = options.height ?? 900
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createFarmPrompt(farmName, options)

      imageGenLogger.debug('Image prompt created', { promptPreview: prompt.substring(0, 100) })

      // Try fal.ai FLUX first
      let imageBuffer = await this.callFalAI(prompt, { width, height, seed, maxAttempts: 3 })

      // Fallback to Pollinations
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { farmName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('Farm image generated successfully', { farmName, bytes: imageBuffer.length })
        return imageBuffer
      }

      imageGenLogger.warn('Farm image generation returned null', { farmName })
      return null
    } catch (error) {
      imageGenLogger.error('Farm image generation failed', { farmName }, error as Error)
      return null
    }
  }

  /**
   * Create editorial photography prompts for UK farm shops
   */
  private createFarmPrompt(farmName: string, options: FarmImageOptions): string {
    const hash = this.hashString(farmName)

    // UK farm shop and rural scene types
    const sceneTypes = [
      'charming British farm shop exterior with rustic wooden signage',
      'traditional stone-built farm shop in English countryside',
      'quaint village farm shop with thatched roof details',
      'picturesque farm shop entrance with flower baskets',
      'idyllic UK farm shop with rolling green hills background',
      'cozy farm shop storefront with vintage character',
      'beautiful country farm shop at golden hour',
      'welcoming British farm shop with cobblestone courtyard'
    ]

    const selectedScene = sceneTypes[hash % sceneTypes.length]

    // Architectural details typical of UK farm shops
    const details = [
      'weathered oak beams and stone walls',
      'traditional brick and flint construction',
      'climbing roses on cottage walls',
      'vintage wooden crates with produce display',
      'rustic barn conversion with original features',
      'whitewashed walls with slate roof',
      'period windows with leaded glass',
      'heritage red telephone box nearby'
    ]

    const selectedDetail = details[(hash + 3) % details.length]

    // Atmospheric conditions
    const atmospheres = [
      'soft morning mist over green fields',
      'warm golden afternoon sunlight',
      'clear blue sky with fluffy clouds',
      'gentle English summer day',
      'crisp autumn morning with dew',
      'bright spring day with blossom'
    ]

    const selectedAtmosphere = atmospheres[(hash + 7) % atmospheres.length]

    // Regional hints based on county
    let regionalHint = ''
    if (options.county) {
      const countyLower = options.county.toLowerCase()
      if (countyLower.includes('cornwall') || countyLower.includes('devon')) {
        regionalHint = 'West Country coastal charm, pastel colors'
      } else if (countyLower.includes('cotswold') || countyLower.includes('gloucester')) {
        regionalHint = 'honey-colored Cotswold stone architecture'
      } else if (countyLower.includes('yorkshire')) {
        regionalHint = 'rugged Yorkshire stone buildings, moorland backdrop'
      } else if (countyLower.includes('kent') || countyLower.includes('sussex')) {
        regionalHint = 'traditional oast houses and hop gardens nearby'
      } else if (countyLower.includes('scotland') || countyLower.includes('highland')) {
        regionalHint = 'Scottish highland scenery, heather and mountains'
      }
    }

    const parts = [
      selectedScene,
      'professional architectural photography',
      selectedDetail,
      selectedAtmosphere,
      'British countryside setting',
      'inviting and authentic atmosphere',
      'editorial quality composition',
      'sharp focus on building',
      regionalHint,
      options.styleHint,
      `Negative: ${NO_FACE_NEGATIVE}`
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Call fal.ai FLUX API
   */
  private async callFalAI(
    prompt: string,
    opts: { width: number; height: number; seed: number; maxAttempts: number }
  ): Promise<Buffer | null> {
    if (!this.falApiKey) {
      imageGenLogger.warn('FAL_KEY not found, skipping fal.ai')
      return null
    }

    for (let i = 0; i < opts.maxAttempts; i++) {
      const attemptSeed = (opts.seed + i * 9973) >>> 0

      try {
        imageGenLogger.debug('fal.ai attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts, seed: attemptSeed })

        // Map dimensions to image_size
        let imageSize = 'landscape_16_9'
        if (opts.width === 1024 && opts.height === 1024) imageSize = 'square'
        else if (opts.width === 900 && opts.height === 1600) imageSize = 'portrait_16_9'

        const response = await axios.post(
          'https://fal.run/fal-ai/flux',
          {
            prompt,
            image_size: imageSize,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            seed: attemptSeed,
            enable_safety_checker: true
          },
          {
            headers: {
              'Authorization': `Key ${this.falApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000
          }
        )

        if (response.data?.images?.[0]?.url) {
          const imageUrl = response.data.images[0].url
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
          })

          if (imageResponse.data?.length > 0) {
            imageGenLogger.info('fal.ai generated farm image', { bytes: imageResponse.data.length })
            return Buffer.from(imageResponse.data)
          }
        }

        await this.sleep(400 * (i + 1))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        imageGenLogger.warn('fal.ai attempt failed', { attempt: i + 1, error: message })
        await this.sleep(400 * (i + 1))
      }
    }

    return null
  }

  /**
   * Call Pollinations AI API
   */
  private async callPollinations(
    prompt: string,
    opts: { width: number; height: number; seed: number; maxAttempts: number }
  ): Promise<Buffer | null> {
    for (let i = 0; i < opts.maxAttempts; i++) {
      const attemptSeed = (opts.seed + i * 9973) >>> 0

      const params = new URLSearchParams({
        width: String(opts.width),
        height: String(opts.height),
        model: 'flux',
        nologo: 'true',
        seed: String(attemptSeed)
      })

      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated farm image', { bytes: response.data.length })
          return Buffer.from(response.data)
        }

        await this.sleep(400 * (i + 1))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        imageGenLogger.warn('Pollinations attempt failed', { attempt: i + 1, error: message })
        await this.sleep(400 * (i + 1))
      }
    }

    return null
  }

  /**
   * Hash string to number for deterministic randomization
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
