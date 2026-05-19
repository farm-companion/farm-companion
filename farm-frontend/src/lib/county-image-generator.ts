/**
 * County Image Generator
 *
 * Generates atmospheric landscape photography for UK county cards using Runware.
 * Implements the Harvest Visual Signature: "Atmospheric Almanac" aesthetic.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { logger } from '@/lib/logger'
import { getRunwareClient, HARVEST_STYLE } from './runware-client'
import { findCountyLandscape } from './county-landscapes'

const imageGenLogger = logger.child({ route: 'lib/county-image-generator' })

/**
 * Harvest Visual Signature: Atmospheric Almanac
 * British countryside landscape photography for county directory cards
 */
const HARVEST_COUNTY_NEGATIVE = [
  'no people, no faces, no crowds',
  'no watermark, no text, no logo',
  'no modern buildings, no cars, no roads',
  'no AI artifacts, no unrealistic colors',
  'no harsh shadows, no artificial lighting',
  'no urban elements, no power lines'
].join(', ')

interface CountyImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  /** Include safe zone for text overlays */
  safeZone?: boolean
  /** Season hint (spring, summer, autumn, winter) */
  season?: string
}

/**
 * CountyImageGenerator - Generate atmospheric county card images
 * Uses Runware Flux.2 [dev] with Pollinations as fallback
 */
export class CountyImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  /**
   * Generate atmospheric landscape for a UK county
   */
  async generateCountyImage(
    countyName: string,
    countySlug: string,
    options: CountyImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating county image', { countyName, countySlug })

      const width = options.width ?? 2048
      const height = options.height ?? 1152 // 16:9 aspect for cards
      const seed = options.seed ?? this.hashString(countySlug)
      const prompt = this.createCountyPrompt(countyName, countySlug, options)

      imageGenLogger.debug('Prompt created', { promptPreview: prompt.substring(0, 120) })

      // Try Runware first (60% cheaper, 40% faster)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

      // Fallback to Pollinations
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { countyName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('County image generated successfully', { countyName, bytes: imageBuffer.length })
        return imageBuffer
      }

      imageGenLogger.warn('County image generation returned null', { countyName })
      return null
    } catch (error) {
      imageGenLogger.error('County image generation failed', { countyName }, error as Error)
      return null
    }
  }

  /**
   * Create Harvest Visual Signature prompt for county cards
   * "Atmospheric Almanac" - evocative British landscape photography
   */
  private createCountyPrompt(
    countyName: string,
    countySlug: string,
    options: CountyImageOptions
  ): string {
    const landscape = findCountyLandscape(countySlug, countyName)

    // Seasonal variations
    const seasonalHints: Record<string, string> = {
      spring: 'fresh spring growth, blossom on trees, new lambs in fields',
      summer: 'lush summer greenery, golden crops, warm hazy light',
      autumn: 'golden autumn colors, harvest time, misty mornings',
      winter: 'frost on fields, bare trees, low winter sun'
    }

    const season = options.season || this.getCurrentSeason()
    const seasonalHint = seasonalHints[season] || seasonalHints.summer

    const parts = [
      `${countyName} countryside landscape`,
      landscape.terrain,
      landscape.features,
      HARVEST_STYLE.camera,
      landscape.atmosphere,
      seasonalHint,
      'editorial landscape photography',
      'authentic British countryside',
      'National Geographic quality',
      options.safeZone ? 'darkened vignette in top-left for text overlay' : undefined,
      options.styleHint
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Get current season based on month
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
  }

  /**
   * Generate images for multiple counties
   */
  async generateBatch(
    counties: Array<{ name: string; slug: string }>,
    options: CountyImageOptions = {}
  ): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>()

    for (let i = 0; i < counties.length; i++) {
      const county = counties[i]
      imageGenLogger.info(`Generating ${i + 1}/${counties.length}: ${county.name}`)

      const buffer = await this.generateCountyImage(county.name, county.slug, options)
      if (buffer) {
        results.set(county.slug, buffer)
      }

      // Rate limiting between requests
      if (i < counties.length - 1) {
        await this.sleep(1000)
      }
    }

    return results
  }

  /**
   * Call Runware API using Flux.2 [dev] via Sonic Engine
   */
  private async callRunware(
    prompt: string,
    opts: { width: number; height: number; seed: number }
  ): Promise<Buffer | null> {
    const client = getRunwareClient()

    if (!client.isConfigured()) {
      imageGenLogger.warn('RUNWARE_API_KEY not configured, skipping Runware')
      return null
    }

    try {
      const buffer = await client.generateBuffer({
        prompt,
        negativePrompt: HARVEST_COUNTY_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated county image', { bytes: buffer.length })
        return buffer
      }

      return null
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      imageGenLogger.warn('Runware attempt failed', { error: message })
      return null
    }
  }

  /**
   * Call Pollinations AI API (fallback)
   */
  private async callPollinations(
    prompt: string,
    opts: { width: number; height: number; seed: number; maxAttempts: number }
  ): Promise<Buffer | null> {
    for (let i = 0; i < opts.maxAttempts; i++) {
      const attemptSeed = (opts.seed + i * 9973) >>> 0

      const params = new URLSearchParams({
        width: String(Math.min(opts.width, 1600)),
        height: String(Math.min(opts.height, 900)),
        model: 'flux',
        nologo: 'true',
        seed: String(attemptSeed)
      })

      const fullPrompt = `${prompt}, Negative: ${HARVEST_COUNTY_NEGATIVE}`
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated county image', { bytes: response.data.length })
          return Buffer.from(response.data)
        }

        await this.sleep(500 * (i + 1))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        imageGenLogger.warn('Pollinations attempt failed', { attempt: i + 1, error: message })
        await this.sleep(500 * (i + 1))
      }
    }

    return null
  }

  /**
   * Hash string to number for deterministic seed
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
