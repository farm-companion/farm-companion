import axios from 'axios'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { uploadProduceImage } from './produce-blob'
import { logger } from '@/lib/logger'

const imageGenLogger = logger.child({ route: 'lib/produce-image-generator' })

const NO_FACE_NEGATIVE = 'no people, no person, no faces, no face, nobody, no humans, no portrait, no selfie, no crowds, no watermark, no text, no logo, no abnormal shapes, no distorted fruits, no mutated vegetables'

interface ProduceImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
}

export class ProduceImageGenerator {
  private falApiKey: string | undefined
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  constructor() {
    this.falApiKey = process.env.FAL_KEY || process.env.NEXT_PUBLIC_FAL_KEY
  }

  /**
   * Generate editorial food photography for produce items
   */
  async generateProduceImage(
    produceName: string,
    slug: string,
    options: ProduceImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating image', { produceName, slug })

      const width = options.width ?? 1600
      const height = options.height ?? 900
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createProducePrompt(produceName, options.styleHint)

      imageGenLogger.debug('Image prompt created', { promptPreview: prompt.substring(0, 100) })

      // Try fal.ai FLUX first
      let imageBuffer = await this.callFalAI(prompt, { width, height, seed, maxAttempts: 3 })

      // Fallback to Pollinations
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
   * Create editorial food photography prompts for produce
   */
  private createProducePrompt(produceName: string, styleHint?: string): string {
    const hash = this.hashString(produceName)

    // Editorial photography styles for variety
    const styles = [
      'overhead flat lay on rustic wooden table',
      'macro close-up showing texture and detail',
      'editorial still life with natural window light',
      'minimalist composition on neutral linen background',
      'farmers market display with wicker basket',
      'fresh harvest scene with morning dew',
      'artisanal food photography with soft shadows',
      'magazine-style composition with selective focus'
    ]

    const selectedStyle = styles[hash % styles.length]

    // Lighting variations
    const lighting = [
      'golden hour natural light',
      'soft diffused morning light',
      'dramatic side lighting',
      'bright airy studio light',
      'warm afternoon sun',
      'cool north-facing window light'
    ]

    const selectedLighting = lighting[(hash + 3) % lighting.length]

    // Color palettes for backgrounds
    const backgrounds = [
      'warm cream background',
      'rustic weathered wood surface',
      'natural stone countertop',
      'soft linen fabric texture',
      'vintage wooden cutting board',
      'marble surface with veining',
      'neutral beige canvas backdrop'
    ]

    const selectedBackground = backgrounds[(hash + 7) % backgrounds.length]

    const parts = [
      `Fresh UK ${produceName}`,
      'high-end food photography',
      selectedStyle,
      selectedLighting,
      selectedBackground,
      'professional editorial quality',
      'sharp focus on produce',
      'natural colors and textures',
      'organic and fresh appearance',
      styleHint,
      `Negative: ${NO_FACE_NEGATIVE}`
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
        await this.sleep(1000)
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
            imageGenLogger.info('fal.ai generated image', { bytes: imageResponse.data.length })
            return Buffer.from(imageResponse.data)
          }
        }

        await this.sleep(400 * (i + 1))
      } catch (err: any) {
        imageGenLogger.warn('fal.ai attempt failed', { attempt: i + 1, error: err.message })
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
          imageGenLogger.info('Pollinations generated image', { bytes: response.data.length })
          return Buffer.from(response.data)
        }

        await this.sleep(400 * (i + 1))
      } catch (err: any) {
        imageGenLogger.warn('Pollinations attempt failed', { attempt: i + 1, error: err.message })
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
