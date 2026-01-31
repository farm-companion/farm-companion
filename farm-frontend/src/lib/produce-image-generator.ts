/**
 * Produce Image Generator
 *
 * Generates anatomically correct, catalog-grade produce images via Runware.
 * Uses shape-safe geometry-locking prompts to prevent deformation.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { uploadProduceImage } from './produce-blob'
import { logger } from '@/lib/logger'
import { getRunwareClient } from './runware-client'
import { getBiologicalCue } from '@/data/biological-cues'

const imageGenLogger = logger.child({ route: 'lib/produce-image-generator' })

/**
 * SHAPE-SAFE PACKSHOT GENERATOR
 *
 * Strategy: Geometry-locking foundation prompt FIRST, then texture details.
 * This prevents "monster fruit" outcomes by enforcing anatomical correctness.
 *
 * Key elements:
 * - Shape-safe base prompt locks geometry before any details
 * - Mandatory negative prompt bans deformation/mutation
 * - Higher steps (50) for geometry stability
 * - CFG 3.0 for shape consistency
 * - RAW mode for authentic textures without smoothing
 */

export type ProduceCategory =
  | 'strawberries'
  | 'brambles'
  | 'blueberries'
  | 'citrus'
  | 'leafy_ruffled'
  | 'leafy_flat'
  | 'root'
  | 'stone_fruit'
  | 'pome_fruit'
  | 'squash'
  | 'stalks'
  | 'runner_beans'
  | 'pods'
  | 'brassicas'
  | 'alliums'
  | 'tomatoes'
  | 'nightshades'
  | 'corn'

export type ProduceVariant = 'whole' | 'sliced' | 'halved' | 'bunch' | 'cluster'
export type LightingPreset = 'bright' | 'moody'

/**
 * Packshot spine - GEOMETRY RULES FIRST
 * Fixed foundation that locks shape before any produce-specific details
 */
function getPackshotSpine(produceName: string, variant: ProduceVariant = 'whole'): string {
  const variantClause = {
    whole: 'Single intact specimen displayed.',
    sliced: 'Single sliced specimen showing cross-section.',
    halved: 'Single halved specimen showing interior.',
    bunch: 'Small natural bunch of 3-5 specimens.',
    cluster: 'Natural cluster as grown on vine or stem.'
  }[variant]

  return `A plain retail grocery packshot photograph of ${produceName}. ${variantClause} Single subject only. True supermarket produce. Anatomically correct proportions for ${produceName}. Slight natural asymmetry and non-uniform micro-texture. No deformation. No mutation. True-to-life scale. Documentary product photography. Neutral matte stone or seamless paper surface. Clean set. No props. Orthographic perspective. 100mm macro lens. f/11 deep focus. Edge-to-edge sharpness. Color accurate. Photorealistic.`
}

/**
 * Universal negative prompt - ALWAYS included
 * Bans deformation, mutation, styling, and props
 */
const UNIVERSAL_NEGATIVE = `deformed, misshapen, warped, stretched, melted, mutated, fused items, extra items, doubled subject, extra stems, extra leaves, extra slices, surreal, abstract, stylized, illustration, cartoon, CGI, plastic, waxy smoothing, oversharpening halos, artifacts, cinematic, shallow depth of field, bokeh, food styling, arranged composition, props, broken slate tile`

/**
 * Lighting presets for different catalog styles
 */
const LIGHTING_PRESETS: Record<LightingPreset, string> = {
  bright: `High key soft daylight. Overhead diffusion panel. Even exposure across subject. Minimal shadow density. Clean white fill. Retail grocery catalog aesthetic.`,
  moody: `Low key side softbox. Gentle falloff into shadows. Controlled contrast ratio. Dark slate background. Premium organic market aesthetic. Dramatic but natural.`
}

/**
 * Produce-specific texture descriptions - applied AFTER geometry is locked
 */
const PRODUCE_TEXTURES: Record<ProduceCategory, string> = {
  strawberries: `Glistening crimson achene-studded receptacle, tiny golden seeds embedded in succulent flesh, natural wax bloom, fresh green calyx`,

  brambles: `Clustered obsidian-like drupelets, high-gloss specular highlights on each individual bead, deep indigo-black juice-filled vesicles`,

  blueberries: `Dusty blue epicuticular wax bloom, visible calyx scar at base, powder-blue coloration with purple undertones`,

  citrus: `Glistening juice vesicles, textured peel with visible oil glands and pith, natural citrus oils on surface`,

  leafy_ruffled: `Botanical specimen. Prominent leaf venation, ruffled lamina edges, thick pale petioles, deep blue-green chlorophyll`,

  leafy_flat: `Delicate leaf venation, smooth margins, vibrant chlorophyll green, natural texture`,

  root: `Natural root skin with lenticels, authentic soil marks, fine root hairs, organic imperfections`,

  stone_fruit: `Soft pubescent skin, natural wax bloom, subtle color gradient, visible suture line`,

  pome_fruit: `Natural epicuticular wax, visible lenticels, subtle color gradient, woody stem attachment`,

  squash: `Deeply recessed vertical ribs, waxy skin with corky tan scarring, heavy woody stem, micro-pores and earth-dust`,

  stalks: `Tight terminal buds, fibrous vascular bundles, natural asparagine crystals, crisp snap-texture`,

  runner_beans: `Velvety fine-haired pubescence on pods, visible internal seed bulges, vibrant lime-green matte skin, crisp snap-texture`,

  pods: `Crisp green pericarp, visible seed bumps, natural pod suture line, snap-fresh appearance`,

  brassicas: `Botanical specimen. Dense fractal floret clusters, dusty matte purple tips, fibrous stalks with xylem texture`,

  alliums: `Papery tunic layers, visible growth rings, fresh root plate, natural allium sheen`,

  tomatoes: `Matte epicarp with natural bloom, visible locule structure, calyx attached, farmers market appearance`,

  nightshades: `Glossy epicarp, natural cuticle shine, calyx intact, authentic color saturation`,

  corn: `Plump endosperm-filled kernels in rows, fresh silk strands, partially pulled husks, golden caryopsis`
}

/**
 * Map produce slugs to their categories
 */
const PRODUCE_CATEGORY_MAP: Record<string, ProduceCategory> = {
  // Strawberries (achenes on receptacle)
  'strawberries': 'strawberries',

  // Brambles (aggregate drupelets)
  'blackberries': 'brambles',
  'raspberries': 'brambles',

  // Blueberries (true berries with bloom)
  'blueberries': 'blueberries',

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

  // Runner beans (long flat distinctive pods)
  'runner-beans': 'runner_beans',

  // Pods/Legumes (round pods)
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

      // 1536px = optimal for geometry stability with FLUX
      const width = options.width ?? 1536
      const height = options.height ?? 1536
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
   * Create universal packshot prompt using biological cues
   * Order: (1) Spine, (2) Lighting, (3) Biological cue
   */
  private createProducePrompt(
    produceName: string,
    slug: string,
    variant: ProduceVariant = 'whole',
    lighting: LightingPreset = 'bright'
  ): string {
    // 1. Packshot spine (geometry rules)
    const spine = getPackshotSpine(produceName, variant)

    // 2. Lighting preset
    const lightingDesc = LIGHTING_PRESETS[lighting]

    // 3. Biological cue from universal library
    const biologicalCue = getBiologicalCue(produceName)

    // Build complete prompt
    let prompt = `${spine} ${lightingDesc} ${biologicalCue}`

    // Multi-item reinforcement for bunch/cluster variants
    if (variant === 'bunch' || variant === 'cluster') {
      prompt += ' Single variety only, no extra items, consistent specimens.'
    }

    imageGenLogger.debug('Universal packshot prompt generated', {
      slug,
      produceName,
      variant,
      lighting,
      promptLength: prompt.length,
      hasBiologicalCue: biologicalCue.length > 50
    })

    return prompt
  }

  /**
   * Get the universal negative prompt
   */
  getNegativePrompt(): string {
    return UNIVERSAL_NEGATIVE
  }

  /**
   * Get the category for a produce item
   */
  getProduceCategory(slug: string): ProduceCategory {
    return PRODUCE_CATEGORY_MAP[slug] || 'strawberries'
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
   * Call Runware API with shape-safe parameters
   * Steps 50 + CFG 3.0 = geometry stability
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
      // Universal packshot parameters: high steps + moderate CFG + negative prompt
      const buffer = await client.generateBuffer({
        prompt,
        negativePrompt: UNIVERSAL_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 50,       // Higher steps = geometry stability
        cfgScale: 3.0,   // CFG 3.0 = shape consistency
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
