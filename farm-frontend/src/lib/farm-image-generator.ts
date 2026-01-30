/**
 * Farm Image Generator
 *
 * Generates editorial photography for UK farm shops using Runware.
 * Implements the Harvest Visual Signature: "Real Places" aesthetic.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { logger } from '@/lib/logger'
import { getRunwareClient, HARVEST_STYLE } from './runware-client'

const imageGenLogger = logger.child({ route: 'lib/farm-image-generator' })

/**
 * Harvest Visual Signature: Real Places
 * Authentic British farm shop architecture and atmosphere
 */
const HARVEST_FARM_NEGATIVE = [
  'no people, no faces, no crowds',
  'no watermark, no text, no logo, no signs with text',
  'no distorted buildings, no modern architecture',
  'no AI artifacts, no unrealistic proportions',
  'no harsh shadows, no artificial lighting'
].join(', ')

/**
 * UK regional architectural styles
 */
const REGIONAL_STYLES: Record<string, string> = {
  // South West
  cornwall: 'Cornish granite and slate, coastal charm, pastel painted facades',
  devon: 'Devon cob walls and thatch, red sandstone details',
  somerset: 'golden Ham stone, traditional orchards backdrop',
  dorset: 'Purbeck stone, thatched roofs, rolling chalk downs',

  // Cotswolds
  cotswold: 'honey-colored Cotswold limestone, dry stone walls',
  gloucestershire: 'warm Cotswold stone, traditional market town charm',
  oxfordshire: 'golden limestone, quintessential English village',

  // South East
  kent: 'traditional oast houses, hop gardens, white weatherboard',
  sussex: 'flint and brick construction, South Downs backdrop',
  surrey: 'tile-hung buildings, Surrey Hills landscape',

  // East Anglia
  norfolk: 'flint construction, Norfolk Broads landscape, big skies',
  suffolk: 'pink-washed cottages, traditional wool churches nearby',
  essex: 'weatherboard and red brick, rolling farmland',

  // Midlands
  warwickshire: 'red brick and timber, Shakespeare country charm',
  worcestershire: 'black and white timber framing, Malvern Hills',
  herefordshire: 'black and white half-timbered buildings, cider orchards',

  // North
  yorkshire: 'grey millstone grit, Yorkshire Dales moorland',
  lancashire: 'red sandstone, Pennine backdrop',
  cumbria: 'Lake District slate and whitewash, mountain backdrop',
  northumberland: 'grey sandstone, dramatic Northumbrian landscape',

  // Scotland
  scotland: 'Scottish vernacular stone, Highland scenery',
  highland: 'whitewashed crofts, dramatic mountain backdrop',

  // Wales
  wales: 'Welsh slate and whitewash, green valley setting',
  pembrokeshire: 'coastal Welsh stone, wild Pembrokeshire coast'
}

interface FarmImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  county?: string
  /** Include safe zone for text overlays */
  safeZone?: boolean
}

/**
 * FarmImageGenerator - Generate AI images for farm shops
 * Uses Runware Flux.2 [dev] with Pollinations as fallback
 */
export class FarmImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

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

      const width = options.width ?? 2048
      const height = options.height ?? 1152 // 16:9 aspect
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createFarmPrompt(farmName, options)

      imageGenLogger.debug('Prompt created', { promptPreview: prompt.substring(0, 120) })

      // Try Runware first (60% cheaper, 40% faster)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

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
   * Create Harvest Visual Signature prompt for farm shops
   * "Real Places" - authentic British farm shop architecture
   */
  private createFarmPrompt(farmName: string, options: FarmImageOptions): string {
    const hash = this.hashString(farmName)

    // UK farm shop scene types
    const sceneTypes = [
      'charming British farm shop exterior with rustic wooden signage',
      'traditional stone-built farm shop in English countryside',
      'quaint village farm shop with period architectural details',
      'picturesque farm shop entrance with seasonal flower displays',
      'idyllic UK farm shop with rolling green hills background',
      'welcoming British farm shop courtyard with vintage character',
      'beautiful country farm shop at golden hour',
      'authentic rural farm shop with cobblestone forecourt'
    ]

    // Architectural details
    const details = [
      'weathered oak beams and local stone walls',
      'traditional brick and flint construction',
      'climbing roses on cottage walls',
      'vintage wooden crates with produce display',
      'rustic barn conversion with original features',
      'whitewashed walls with slate roof',
      'period windows with traditional glazing bars',
      'heritage farm buildings with patina of age'
    ]

    // Atmospheric conditions
    const atmospheres = [
      'soft morning mist over green fields',
      'warm golden afternoon sunlight',
      'clear blue sky with fluffy cumulus clouds',
      'gentle English summer day',
      'crisp autumn morning with morning dew',
      'bright spring day with blossom'
    ]

    const selectedScene = sceneTypes[hash % sceneTypes.length]
    const selectedDetail = details[(hash + 3) % details.length]
    const selectedAtmosphere = atmospheres[(hash + 7) % atmospheres.length]

    // Regional architectural style
    let regionalHint = ''
    if (options.county) {
      const countyLower = options.county.toLowerCase()
      for (const [region, style] of Object.entries(REGIONAL_STYLES)) {
        if (countyLower.includes(region)) {
          regionalHint = style
          break
        }
      }
    }

    const parts = [
      selectedScene,
      HARVEST_STYLE.camera,
      HARVEST_STYLE.lighting,
      selectedDetail,
      selectedAtmosphere,
      'British countryside setting',
      'inviting and authentic atmosphere',
      'editorial architectural photography',
      regionalHint,
      options.safeZone ? HARVEST_STYLE.safeZone : undefined,
      options.styleHint
    ].filter(Boolean)

    return parts.join(', ')
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
        negativePrompt: HARVEST_FARM_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated farm image', { bytes: buffer.length })
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

      const fullPrompt = `${prompt}, Negative: ${HARVEST_FARM_NEGATIVE}`
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated farm image', { bytes: response.data.length })
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
