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
 * GOD-TIER PRODUCE PHOTOGRAPHY PROMPTS
 *
 * Strategy: Describe a closed-set commercial photography environment.
 * This forces FLUX.2 Pro Ultra to ignore "home" elements and focus on material physics.
 *
 * Key elements:
 * - Phase One XF (medium format camera triggers higher quality textures)
 * - Neutral matte stone surface (prevents kitchen hallucinations)
 * - f/11 aperture (edge-to-edge sharpness, no bokeh)
 * - Botanical terms for textures (achenes, vesicles, wax bloom)
 * - RAW mode enabled in Runware client for authentic textures
 */

/**
 * Produce categories for template selection
 */
export type ProduceCategory =
  | 'berries'        // strawberries, blackberries, raspberries
  | 'citrus'         // oranges, lemons, limes
  | 'leafy_ruffled'  // kale, chard (curly leaves on stems)
  | 'leafy_flat'     // spinach, lettuce (tender flat leaves)
  | 'root'           // carrots, potatoes, beetroot
  | 'stone_fruit'    // plums, peaches, cherries
  | 'pome_fruit'     // apples, pears
  | 'squash'         // pumpkins, butternut, courgettes
  | 'stalks'         // asparagus, celery, rhubarb
  | 'pods'           // runner beans, peas, broad beans
  | 'brassicas'      // broccoli, cauliflower, cabbage
  | 'alliums'        // leeks, onions, garlic
  | 'tomatoes'       // tomatoes specifically
  | 'nightshades'    // peppers, aubergines
  | 'corn'           // sweetcorn

/**
 * Universal photography rig - stays constant across all produce
 */
const PHOTOGRAPHY_RIG = `Shot on a neutral matte stone surface with organic imperfections. Lighting: Large softbox side-lighting to create depth and 3D modeling. Captured with a Phase One XF, 100mm macro lens, f/11 for edge-to-edge sharpness. Ultra-high resolution, global illumination, ray-traced reflections, advertising-grade quality.`

/**
 * Produce-specific texture descriptions using botanical terms
 * These trigger the model's highest-tier texture maps
 */
const PRODUCE_TEXTURES: Record<ProduceCategory, string> = {
  berries: `extreme detail on the yellow achenes and succulent red flesh, natural wax bloom, microscopic water mist on surface`,

  citrus: `extreme detail on the glistening juice vesicles, textured peel with visible oil glands and pith, natural citrus oils on surface`,

  leafy_ruffled: `extreme detail on the prominent leaf venation and ruffled lamina edges, NOT broccoli NOT florets, large spreading leaves attached to thick pale petioles, deep blue-green chlorophyll coloration`,

  leafy_flat: `extreme detail on the delicate leaf venation and tender lamina, smooth leaf margins, vibrant chlorophyll green`,

  root: `extreme detail on the natural root skin with lenticels and soil marks, authentic earthy texture, fine root hairs visible`,

  stone_fruit: `extreme detail on the soft pubescent skin and natural wax bloom, subtle color gradient from stem to tip, authentic bruise-free appearance`,

  pome_fruit: `extreme detail on the natural epicuticular wax coating and lenticels, subtle color gradient, stem attachment point visible`,

  squash: `extreme detail on the thick woody peduncle with deep vertical ridges, ribbed pericarp with natural segments, matte rind texture`,

  stalks: `extreme detail on the tight terminal buds and fibrous vascular bundles, natural asparagine crystals visible on surface`,

  pods: `extreme detail on the crisp green pericarp and visible seed bumps, natural pod suture line, fresh calyx attachment`,

  brassicas: `extreme detail on the tight floret structure and natural wax bloom on leaves, visible cell texture on buds`,

  alliums: `extreme detail on the papery tunic layers and visible growth rings, fresh root plate, natural allium sheen`,

  tomatoes: `extreme detail on the matte epicarp with natural bloom, visible locule structure through skin, calyx and pedicel attached, authentic farmers market appearance with slight dust`,

  nightshades: `extreme detail on the glossy epicarp and natural cuticle shine, calyx intact, authentic color saturation`,

  corn: `extreme detail on the plump endosperm-filled kernels and fresh silk strands, partially pulled back husks revealing golden caryopsis rows`
}

/**
 * Build the complete prompt for a produce item
 */
function buildProducePrompt(produceName: string, category: ProduceCategory): string {
  const textureDesc = PRODUCE_TEXTURES[category]

  return `A professional commercial food photography asset of ${produceName}. Subject is positioned as a hero shot with ${textureDesc}. ${PHOTOGRAPHY_RIG} Hyper-realistic micro-textures, microscopic water mist, authentic imperfections. 4K native resolution.`
}

/**
 * Map produce slugs to their categories
 */
const PRODUCE_CATEGORY_MAP: Record<string, ProduceCategory> = {
  // Berries
  'strawberries': 'berries',
  'blackberries': 'berries',
  'raspberries': 'berries',
  'blueberries': 'berries',

  // Stone fruit
  'plums': 'stone_fruit',
  'peaches': 'stone_fruit',
  'cherries': 'stone_fruit',
  'apricots': 'stone_fruit',

  // Pome fruit
  'apples': 'pome_fruit',
  'pears': 'pome_fruit',

  // Citrus
  'oranges': 'citrus',
  'lemons': 'citrus',
  'limes': 'citrus',
  'grapefruit': 'citrus',

  // Leafy greens - ruffled (curly leaves on thick stems)
  'kale': 'leafy_ruffled',
  'chard': 'leafy_ruffled',
  'cavolo-nero': 'leafy_ruffled',

  // Leafy greens - flat (tender delicate leaves)
  'spinach': 'leafy_flat',
  'lettuce': 'leafy_flat',
  'rocket': 'leafy_flat',
  'watercress': 'leafy_flat',

  // Root vegetables
  'carrots': 'root',
  'potatoes': 'root',
  'beetroot': 'root',
  'parsnips': 'root',
  'turnips': 'root',

  // Squash
  'pumpkins': 'squash',
  'butternut-squash': 'squash',
  'courgettes': 'squash',

  // Stalks
  'asparagus': 'stalks',
  'celery': 'stalks',
  'rhubarb': 'stalks',

  // Pods/Legumes
  'runner-beans': 'pods',
  'broad-beans': 'pods',
  'peas': 'pods',
  'french-beans': 'pods',

  // Brassicas
  'purple-sprouting-broccoli': 'brassicas',
  'broccoli': 'brassicas',
  'cauliflower': 'brassicas',
  'cabbage': 'brassicas',
  'brussels-sprouts': 'brassicas',

  // Alliums
  'leeks': 'alliums',
  'onions': 'alliums',
  'garlic': 'alliums',
  'spring-onions': 'alliums',

  // Tomatoes - separate category (matte, not shiny)
  'tomato': 'tomatoes',
  'tomatoes': 'tomatoes',

  // Nightshades (peppers, aubergines - glossy skin OK)
  'peppers': 'nightshades',
  'aubergines': 'nightshades',
  'chillies': 'nightshades',

  // Corn
  'sweetcorn': 'corn'
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

      const width = options.width ?? 1024
      const height = options.height ?? 1024
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createProducePrompt(produceName, slug)

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
   * Create god-tier produce photography prompt for FLUX.2 Pro Ultra
   * Uses Phase One XF rig + botanical texture terms
   */
  private createProducePrompt(produceName: string, slug: string): string {
    // Get category for this produce, default to 'berries' as fallback
    const category = PRODUCE_CATEGORY_MAP[slug] || 'berries'

    // Build the complete prompt using the new god-tier structure
    const prompt = buildProducePrompt(produceName, category)

    imageGenLogger.debug('God-tier prompt generated', {
      slug,
      category,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 150)
    })

    return prompt
  }

  /**
   * Get the category for a produce item
   */
  getProduceCategory(slug: string): ProduceCategory {
    return PRODUCE_CATEGORY_MAP[slug] || 'berries'
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
