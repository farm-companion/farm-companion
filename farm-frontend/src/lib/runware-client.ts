/**
 * Runware API Client
 *
 * Cost-effective image generation using Runware's Sonic Inference Engine.
 * ~60% cheaper than fal.ai with 40% faster performance using Flux.2 [dev].
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { logger } from '@/lib/logger'

const runwareLogger = logger.child({ route: 'lib/runware-client' })

export interface RunwareImageRequest {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  seed?: number
  steps?: number
  cfgScale?: number
  /** Output format: webp recommended for performance */
  outputFormat?: 'webp' | 'png' | 'jpeg'
  /** Number of images to generate */
  numberResults?: number
}

export interface RunwareImageResponse {
  imageURL: string
  seed: number
}

export interface RunwareGenerateResult {
  images: RunwareImageResponse[]
  cost?: number
}

/**
 * Runware Client for Flux.2 [dev] image generation
 *
 * Features:
 * - Sonic Inference Engine for sub-second generation
 * - Seed-based workflow for consistent styling
 * - WebP output for Lighthouse performance
 */
export class RunwareClient {
  private apiKey: string | undefined
  private baseUrl = 'https://api.runware.ai/v1'

  constructor() {
    this.apiKey = process.env.RUNWARE_API_KEY
    if (!this.apiKey) {
      runwareLogger.warn('RUNWARE_API_KEY not found in environment')
    }
  }

  /**
   * Check if Runware is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Generate images using Flux.2 [dev] model
   */
  async generate(request: RunwareImageRequest): Promise<RunwareGenerateResult | null> {
    if (!this.apiKey) {
      runwareLogger.error('RUNWARE_API_KEY not configured')
      return null
    }

    try {
      runwareLogger.debug('Runware generation request', {
        promptPreview: request.prompt.substring(0, 100),
        width: request.width,
        height: request.height,
        seed: request.seed
      })

      const payload = {
        taskType: 'imageInference',
        taskUUID: crypto.randomUUID(),
        // Juggernaut Pro Flux - best for photorealistic produce photography
        model: 'rundiffusion:130@100',
        positivePrompt: request.prompt,
        // Mandatory negative prompt for shape safety (bans deformation/mutation)
        negativePrompt: request.negativePrompt || '',
        // Shape-safe defaults: 1536px, steps 50, CFG 3.0
        width: request.width || 1536,
        height: request.height || 1536,
        seed: request.seed,
        steps: request.steps || 50,      // Higher steps = geometry stability
        CFGScale: request.cfgScale || 3.0, // CFG 3.0 = shape consistency
        scheduler: 'FlowMatchEulerDiscreteScheduler',
        outputFormat: request.outputFormat || 'webp',
        numberResults: request.numberResults || 1,
        // Raw Mode prevents AI from smoothing complex textures
        rawMode: true
      }

      const response = await axios.post(
        this.baseUrl,
        [payload],
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      )

      // Runware returns array of results
      const results = response.data?.data || response.data
      if (!Array.isArray(results) || results.length === 0) {
        runwareLogger.warn('Runware returned empty results')
        return null
      }

      const images: RunwareImageResponse[] = results
        .filter((r: any) => r.imageURL)
        .map((r: any) => ({
          imageURL: r.imageURL,
          seed: r.seed || request.seed || 0
        }))

      if (images.length === 0) {
        runwareLogger.warn('No valid images in Runware response')
        return null
      }

      runwareLogger.info('Runware generation successful', {
        imageCount: images.length,
        seed: images[0].seed
      })

      return { images }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      // Log full error response for debugging
      const responseData = error?.response?.data
      runwareLogger.error('Runware generation failed', {
        error: message,
        status: error?.response?.status,
        responseData: JSON.stringify(responseData)
      })
      return null
    }
  }

  /**
   * Generate image and return as Buffer
   */
  async generateBuffer(request: RunwareImageRequest): Promise<Buffer | null> {
    const result = await this.generate(request)
    if (!result || result.images.length === 0) {
      return null
    }

    try {
      const imageUrl = result.images[0].imageURL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
      })

      if (response.data?.length > 0) {
        runwareLogger.debug('Image buffer downloaded', { bytes: response.data.length })
        return Buffer.from(response.data)
      }

      return null
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      runwareLogger.error('Failed to download Runware image', { error: message })
      return null
    }
  }

  /**
   * Generate multiple images with consistent seed progression
   */
  async generateVariations(
    request: RunwareImageRequest,
    count: number
  ): Promise<Buffer[]> {
    const buffers: Buffer[] = []
    const baseSeed = request.seed || this.hashString(request.prompt)

    for (let i = 0; i < count; i++) {
      const seed = (baseSeed + i * 9973) >>> 0

      const buffer = await this.generateBuffer({
        ...request,
        seed
      })

      if (buffer) {
        buffers.push(buffer)
      }

      // Rate limiting between requests
      if (i < count - 1) {
        await this.sleep(500)
      }
    }

    return buffers
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

/**
 * Singleton instance for reuse
 */
let runwareInstance: RunwareClient | null = null

export function getRunwareClient(): RunwareClient {
  if (!runwareInstance) {
    runwareInstance = new RunwareClient()
  }
  return runwareInstance
}

/**
 * Harvest Visual Signature prompt components
 * Consistent styling across all image types
 */
export const HARVEST_STYLE = {
  /** Camera and lens settings for editorial look */
  camera: '35mm prime lens, f/2.8, shallow depth of field',

  /** Lighting for soft natural aesthetic */
  lighting: 'soft natural overcast light, no harsh shadows',

  /** Quality markers */
  quality: 'editorial photography, magazine quality, no AI artifacts',

  /** Safe zone instruction for text overlays */
  safeZone: 'low-detail vignette in top-left quadrant for text overlay',

  /** Common negative prompt elements */
  negative: 'no people, no faces, no text, no watermarks, no logos, no AI artifacts, no plastic, no artificial lighting'
}

/**
 * Build Harvest-style prompt with consistent elements
 */
export function buildHarvestPrompt(
  subject: string,
  style: string,
  options: {
    lighting?: string
    background?: string
    safeZone?: boolean
    additionalElements?: string[]
  } = {}
): string {
  const parts = [
    subject,
    style,
    HARVEST_STYLE.camera,
    options.lighting || HARVEST_STYLE.lighting,
    options.background,
    HARVEST_STYLE.quality,
    options.safeZone ? HARVEST_STYLE.safeZone : undefined,
    ...(options.additionalElements || [])
  ].filter(Boolean)

  return parts.join(', ')
}
