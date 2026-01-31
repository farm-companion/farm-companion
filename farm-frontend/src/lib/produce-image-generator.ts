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
 * NOTE: FLUX models (including Juggernaut Pro FLUX) IGNORE negative prompts!
 * All control must be achieved through the positive prompt.
 * Prompt structure follows BFL guide: Subject + Action + Style + Context
 * FLUX weighs earlier words more heavily - put critical info first.
 */

/**
 * Produce categories for template selection
 * Each category has specific descriptors that work better for that type
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
  | 'tomatoes'       // tomatoes specifically (matte, not shiny)
  | 'nightshades'    // peppers, aubergines (shiny skin OK)
  | 'corn'           // sweetcorn

/**
 * Category-specific prompt templates
 * Structure: Subject FIRST (FLUX weighs earlier words more heavily)
 * Based on BFL guide recommendations + feedback on specific produce issues
 */
const CATEGORY_TEMPLATES: Record<ProduceCategory, string> = {
  berries: `Fresh ripe {NAME} arranged in a natural small pile, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, small water droplets on surface, visible seeds and authentic imperfections, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution, sharp focus on fruit details`,

  citrus: `Fresh whole {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, textured peel with visible pores, natural citrus sheen, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution, sharp focus on peel texture`,

  // Kale, chard - explicitly describe structure to avoid broccoli confusion
  leafy_ruffled: `Fresh {NAME}, leafy green vegetable with large ruffled leaves attached to long thick pale stems, NOT broccoli NOT florets, flat spreading leaf shape with curly edges, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting, deep blue-green leaf color, prominent leaf veins visible, fibrous pale green stems, shot from 45-degree angle above, commercial food photography, ultra high resolution`,

  // Spinach, lettuce - tender flat leaves
  leafy_flat: `Fresh {NAME} leaves, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, smooth delicate leaves with visible veins, tender stems, vibrant green color, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  root: `Fresh whole {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, clean natural rough skin texture, earthy authentic appearance, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  stone_fruit: `Fresh ripe {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, soft natural skin with subtle color gradient, authentic imperfections, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  pome_fruit: `Fresh crisp {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, natural waxy sheen on skin, subtle color gradient, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  // Pumpkins - explicitly describe the woody curved stem
  squash: `Fresh whole {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting, thick woody curved stem on top with deep vertical ridges and rough brown-green texture, stem curves slightly to one side, ribbed skin with natural segments, matte surface with subtle texture variations, shot from 45-degree angle above, commercial food photography, ultra high resolution`,

  stalks: `Fresh {NAME} spears in a small bundle, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, tight compact tips, natural fiber texture visible, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  pods: `Fresh {NAME} pods, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, crisp bright green color, natural pod texture, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  brassicas: `Fresh {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, tight florets with natural color, crisp fresh stems, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  alliums: `Fresh whole {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, crisp white and green layers visible, natural papery outer skin, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  // Tomatoes - matte, not shiny, farmers market look
  tomatoes: `Fresh ripe {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, soft diffused lighting, matte skin with natural bloom, subtle imperfections and small blemishes visible, no artificial shine, authentic farmers market appearance, slight dust on surface, vine stem still attached, shot from 45-degree angle above, ultra high resolution`,

  // Peppers, aubergines - glossy skin is natural for these
  nightshades: `Fresh ripe {NAME}, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, natural glossy skin, vibrant color, small water droplets, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`,

  corn: `Fresh {NAME} cobs with husks partially pulled back, studio product photography, shot on Canon 5D Mark IV with 100mm macro lens at f/5.6, pure white seamless background, three-point softbox lighting with soft diffused highlights, plump golden kernels visible, fresh silk strands, shot from 45-degree angle above, commercial food photography for supermarket advertisement, ultra high resolution`
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
   * Create category-specific produce photography prompt for Juggernaut Pro FLUX
   * Uses BFL guide structure: Subject + Action + Style + Context
   * Subject comes FIRST because FLUX weighs earlier words more heavily
   */
  private createProducePrompt(produceName: string, slug: string): string {
    // Get category for this produce, default to 'berries' as fallback
    const category = PRODUCE_CATEGORY_MAP[slug] || 'berries'
    const template = CATEGORY_TEMPLATES[category]

    // Replace {NAME} placeholder with actual produce name
    const prompt = template.replace(/{NAME}/g, produceName)

    imageGenLogger.debug('Category prompt generated', {
      slug,
      category,
      promptLength: prompt.length
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
