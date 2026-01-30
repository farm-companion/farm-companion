/**
 * Produce Image Generator
 *
 * Generates editorial food photography for seasonal produce using Runware.
 * Implements the Harvest Visual Signature: "Editorial Grocer" aesthetic.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { uploadProduceImage } from './produce-blob'
import { logger } from '@/lib/logger'
import { getRunwareClient, HARVEST_STYLE } from './runware-client'

const imageGenLogger = logger.child({ route: 'lib/produce-image-generator' })

/**
 * Harvest Visual Signature: Editorial Grocer
 * Macro photography meets artisan grocery aesthetic
 */
const HARVEST_PRODUCE_NEGATIVE = [
  'no people, no faces, nobody',
  'no watermark, no text, no logo',
  'no abnormal shapes, no distorted produce',
  'no artificial lighting, no harsh shadows',
  'no plastic packaging, no supermarket shelves',
  'no AI artifacts, no unrealistic colors'
].join(', ')

/**
 * Seasonal lighting based on British months
 * Cool tones for winter, warm golden for summer
 */
const SEASONAL_LIGHTING: Record<number, string> = {
  1: 'cool overcast winter light, soft grey tones',
  2: 'crisp late winter light, hints of warmth',
  3: 'fresh spring morning light, cool and bright',
  4: 'soft spring daylight, gentle warmth',
  5: 'warm late spring light, golden undertones',
  6: 'bright summer morning light, warm and inviting',
  7: 'golden hour summer light, rich warm tones',
  8: 'warm late summer afternoon light',
  9: 'soft autumn morning light, amber tones',
  10: 'warm autumn golden hour, rich ochre tones',
  11: 'cool late autumn light, soft grey-gold',
  12: 'cool winter daylight, soft and muted'
}

interface ProduceImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  /** Month (1-12) for seasonal lighting */
  month?: number
}

export class ProduceImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  /**
   * Generate editorial food photography for produce items
   * Uses Runware (Flux.2 dev) with Pollinations fallback
   */
  async generateProduceImage(
    produceName: string,
    slug: string,
    options: ProduceImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating produce image', { produceName, slug })

      const width = options.width ?? 2048
      const height = options.height ?? 2048
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createProducePrompt(produceName, options)

      imageGenLogger.debug('Prompt created', { promptPreview: prompt.substring(0, 120) })

      // Try Runware first (60% cheaper, 40% faster)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

      // Fallback to Pollinations if Runware fails
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { produceName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('Image generated successfully', { produceName, bytes: imageBuffer.length })
        return imageBuffer
      }

      imageGenLogger.warn('Image generation returned null', { produceName })
      return null
    } catch (error) {
      imageGenLogger.error('Image generation failed', { produceName }, error as Error)
      return null
    }
  }

  /**
   * Create Harvest Visual Signature prompt for produce
   * "Editorial Grocer" - macro photography meets artisan grocery aesthetic
   */
  private createProducePrompt(produceName: string, options: ProduceImageOptions): string {
    const hash = this.hashString(produceName)
    const month = options.month ?? new Date().getMonth() + 1

    // Editorial Grocer compositions
    const compositions = [
      'overhead flat lay on weathered oak table',
      'macro close-up showing natural texture and dewdrops',
      'editorial still life with soft window light',
      'minimalist composition on natural linen',
      'artisan market display in wicker basket',
      'fresh harvest arrangement with garden herbs',
      'rustic kitchen scene on vintage cutting board',
      'Waitrose-style editorial food photography'
    ]

    // Backgrounds matching the site's soil-100 aesthetic
    const backgrounds = [
      'warm cream linen background',
      'weathered light oak surface',
      'natural pale stone countertop',
      'soft oatmeal canvas backdrop',
      'vintage whitewashed wood',
      'neutral beige ceramic tile',
      'light grey marble with subtle veining'
    ]

    const selectedComposition = compositions[hash % compositions.length]
    const selectedBackground = backgrounds[(hash + 5) % backgrounds.length]
    const seasonalLight = SEASONAL_LIGHTING[month] || SEASONAL_LIGHTING[6]

    const parts = [
      `Fresh British ${produceName}`,
      selectedComposition,
      HARVEST_STYLE.camera,
      seasonalLight,
      selectedBackground,
      'editorial food photography, magazine quality',
      'natural organic appearance, authentic textures',
      'sharp focus on produce details',
      options.styleHint
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Generate multiple variations for a produce item
   */
  async generateVariations(
    produceName: string,
    slug: string,
    count: number = 4
  ): Promise<Buffer[]> {
    const buffers: Buffer[] = []

    for (let i = 0; i < count; i++) {
      const seed = this.hashString(slug) + i * 9973
      const buffer = await this.generateProduceImage(produceName, slug, { seed })

      if (buffer) {
        buffers.push(buffer)
      }

      // Rate limiting between requests
      if (i < count - 1) {
        await this.sleep(800)
      }
    }

    return buffers
  }

  /**
   * Save image buffer to file system
   */
  async saveImage(buffer: Buffer, outputPath: string): Promise<void> {
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'))
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    await writeFile(outputPath, buffer)
    imageGenLogger.info('Image saved to file', { outputPath })
  }

  /**
   * Upload image to Vercel Blob storage
   */
  async uploadImage(
    buffer: Buffer,
    slug: string,
    variationId: number,
    produceName: string,
    allowOverwrite: boolean = false
  ): Promise<string> {
    const result = await uploadProduceImage(buffer, slug, variationId, {
      produceName,
      generatedAt: new Date().toISOString(),
      allowOverwrite
    })
    return result.url
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
        negativePrompt: HARVEST_PRODUCE_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated produce image', { bytes: buffer.length })
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
        height: String(Math.min(opts.height, 1600)),
        model: 'flux',
        nologo: 'true',
        seed: String(attemptSeed)
      })

      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated image', { bytes: response.data.length })
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
