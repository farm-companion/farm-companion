/**
 * Produce Image Generator - "Editorial Grocer" Template
 *
 * God-tier editorial food photography using Forensic Photography Prompting.
 * Mimics specific lens behavior and British atmospheric conditions to avoid
 * the "AI slop" look. Targets the aesthetic of Waitrose Food, Kinfolk, and
 * Country Living magazines.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { uploadProduceImage } from './produce-blob'
import { logger } from '@/lib/logger'
import { getRunwareClient } from './runware-client'

const imageGenLogger = logger.child({ route: 'lib/produce-image-generator' })

/**
 * God-Tier Negative Prompt - Eliminates AI Artifacts
 *
 * Prevents: symmetry, plastic look, oversaturation, generic styling,
 * perfect lighting that screams "AI generated"
 */
const EDITORIAL_GROCER_NEGATIVE = [
  // Anti-AI artifacts
  'artificial, fake, plastic, synthetic, CGI, 3D render, illustration, painting, drawing',
  'oversaturated, hyperrealistic, too perfect, too symmetrical, unnatural colors',
  'stock photo, generic, clipart, cartoon, anime',
  // Anti-composition errors
  'blurry, out of focus subject, motion blur, grainy, noisy, pixelated',
  'cropped awkwardly, bad framing, centered subject, boring composition',
  // Anti-content pollution
  'text, watermark, logo, signature, copyright, stamp, label, price tag',
  'people, hands, fingers, face, body parts',
  'plastic packaging, cellophane, supermarket shelf, fluorescent lighting',
  // Anti-location errors
  'outdoor, garden, field, farm, church, building, architecture, landscape, sky',
  // Anti-lighting errors
  'harsh shadows, direct flash, studio strobe, ring light, artificial lighting',
  'overexposed, underexposed, high contrast, HDR look'
].join(', ')

/**
 * British Seasonal Lighting - Authentic UK Atmosphere
 *
 * Maps each month to specific lighting conditions that reflect
 * the actual British climate and its effect on food photography.
 */
const BRITISH_SEASONAL_LIGHTING: Record<number, string> = {
  1: 'cool diffused January light through frosted window, soft grey-blue tones, crisp winter morning',
  2: 'pale February daylight, hints of approaching spring warmth, soft neutral tones',
  3: 'fresh March morning light, cool and bright, early spring clarity',
  4: 'gentle April shower light, soft diffused daylight, spring freshness',
  5: 'warm late May afternoon light, golden undertones, British spring peak',
  6: 'bright June morning light, warm and luminous, long summer days',
  7: 'golden hour July light, rich amber warmth, peak British summer',
  8: 'warm August afternoon glow, late summer richness, honey tones',
  9: 'soft September morning light, early autumn amber, harvest warmth',
  10: 'rich October golden hour, deep ochre and amber, autumn peak',
  11: 'moody November light, soft grey-gold, late autumn atmosphere',
  12: 'cool December daylight, muted and soft, winter stillness'
}

/**
 * Produce-Specific Tactile Details
 *
 * Each produce type gets specific "imperfection" instructions to avoid
 * the too-perfect AI look. These details make images feel real.
 */
const PRODUCE_TACTILE_DETAILS: Record<string, string> = {
  // Leafy greens
  'kale': 'fine morning dew droplets on curled leaf edges, natural purple-green variegation, slightly irregular leaf shapes, visible leaf veins',
  'purple-sprouting-broccoli': 'tiny water droplets on florets, natural purple and green color variation, slightly uneven stem thickness, authentic British PSB',
  'leeks': 'fine soil particles near root end, natural gradient from white to dark green, slight outer leaf weathering, authentic allotment character',
  'asparagus': 'tight purple-tinged tips with natural variation, slight stem curvature, subtle scale texture, freshly cut white ends',

  // Root vegetables
  'beetroot': 'authentic earth residue on skin, natural skin blemishes and irregularities, deep purple-red color variation, intact root tail',
  'parsnips': 'fine root hairs, natural skin marks and earth traces, cream color with brown spots, authentic wonky shapes',
  'swede': 'natural purple and cream skin mottling, slight surface roughness, authentic farmgate appearance',
  'carrots': 'fine root hairs, natural orange color variation, slight curvature, authentic soil traces near crown',

  // Fruits
  'strawberries': 'natural seed texture, slight color variation from tip to shoulder, tiny imperfect shapes, authentic British variety',
  'blackberries': 'individual drupelets with natural sheen variation, some slightly less ripe segments, authentic hedgerow appearance',
  'raspberries': 'delicate individual drupelets, natural hollow center visible, slight color variation, fragile authentic appearance',
  'apples': 'natural skin russeting, subtle color blush variation, authentic British heritage variety character',
  'plums': 'natural waxy bloom on skin, slight color gradients, authentic Victoria or damson character',
  'pears': 'natural skin freckling, subtle color variation, authentic Conference or Comice character',

  // Summer produce
  'tomato': 'natural skin shine variation, visible stem scar, authentic vine-ripened imperfections, heritage variety character',
  'sweetcorn': 'natural kernel size variation, authentic silk threads, slight husk weathering, freshly picked appearance',
  'courgettes': 'natural skin texture and slight scarring, authentic flower end, subtle color variation',
  'runner-beans': 'natural string texture, slight curve and twist, authentic British allotment character',

  // Winter produce
  'pumpkins': 'natural ribbing depth variation, authentic stem attachment, subtle color mottling, harvest character',
  'squash': 'natural skin texture variation, authentic stem end, subtle color gradients'
}

/**
 * Composition Variations - Editorial Styling
 *
 * Each variation uses different professional food photography compositions
 * that would appear in high-end UK food magazines.
 */
const EDITORIAL_COMPOSITIONS = [
  // Variation 1: Classic overhead
  'editorial overhead flat lay, asymmetric arrangement on aged oak surface, negative space for text overlay in top-left, Kinfolk magazine aesthetic',
  // Variation 2: Hero macro
  'intimate macro perspective at 45-degree angle, single hero subject with supporting elements, shallow focus fall-off, cookbook cover quality',
  // Variation 3: Rustic still life
  'Dutch masters inspired still life arrangement, layered depth with rustic props, dramatic side lighting, painterly quality',
  // Variation 4: Minimal modern
  'minimalist Scandinavian composition, clean negative space, single perfect specimen, stark natural linen backdrop'
]

/**
 * Background Surfaces - Authentic British Kitchen Textures
 */
const AUTHENTIC_SURFACES = [
  'aged oak farmhouse table with natural grain and patina, authentic wear marks',
  'weathered marble pastry slab with subtle grey veining, well-used character',
  'natural linen cloth with visible weave texture, soft cream tone, slight creases',
  'vintage ceramic tile surface, off-white with aged character',
  'reclaimed pine kitchen counter, honey-warm with authentic knots and grain',
  'slate cheese board surface, natural grey-blue with authentic texture',
  'handthrown ceramic plate, artisan imperfections, neutral glaze'
]

interface ProduceImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  /** Month (1-12) for seasonal lighting */
  month?: number
  /** Variation index (1-4) for composition selection */
  variation?: number
  /** Include safe zone for text overlay */
  safeZone?: boolean
}

export class ProduceImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  /**
   * Generate god-tier editorial food photography
   * Uses Forensic Photography Prompting for authentic British aesthetic
   */
  async generateProduceImage(
    produceName: string,
    slug: string,
    options: ProduceImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating editorial produce image', { produceName, slug })

      const width = options.width ?? 2048
      const height = options.height ?? 2048
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createEditorialGrocerPrompt(produceName, slug, options)

      imageGenLogger.debug('Editorial Grocer prompt created', {
        promptPreview: prompt.substring(0, 200)
      })

      // Try Runware first (Flux.2 [dev] for best realism)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

      // Fallback to Pollinations if Runware fails
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { produceName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('Editorial image generated successfully', {
          produceName,
          bytes: imageBuffer.length
        })
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
   * Create "Editorial Grocer" Prompt
   *
   * Forensic Photography Prompting that instructs the AI to behave like
   * a camera rather than an illustrator. Produces Kinfolk/Waitrose quality.
   */
  private createEditorialGrocerPrompt(
    produceName: string,
    slug: string,
    options: ProduceImageOptions
  ): string {
    const hash = this.hashString(produceName)
    const month = options.month ?? new Date().getMonth() + 1
    const variation = options.variation ?? (hash % 4) + 1

    // Get produce-specific tactile details or generate generic ones
    const tactileDetails = PRODUCE_TACTILE_DETAILS[slug] ||
      `natural surface texture and authentic imperfections, real ${produceName.toLowerCase()} character`

    // Select composition based on variation
    const composition = EDITORIAL_COMPOSITIONS[(variation - 1) % EDITORIAL_COMPOSITIONS.length]

    // Select surface based on hash
    const surface = AUTHENTIC_SURFACES[hash % AUTHENTIC_SURFACES.length]

    // Get British seasonal lighting
    const lighting = BRITISH_SEASONAL_LIGHTING[month]

    // Build the forensic photography prompt
    const promptParts = [
      // Subject with tactile realism
      `Macro photography of fresh British ${produceName} at seasonal peak`,
      tactileDetails,

      // Technical camera specs (forces AI to think like a camera)
      '50mm prime lens, f/2.8 aperture, shallow depth of field',
      'sharp focus on hero subject, natural bokeh on background',

      // Lighting (British atmospheric)
      `soft natural window light, ${lighting}`,
      'no artificial lighting, authentic daylight only',

      // Surface and styling
      surface,
      'professional food styling for UK culinary magazine',

      // Composition
      composition,

      // Quality markers
      'Kinfolk magazine editorial quality, Waitrose Food aesthetic',
      'vibrant but natural colors, authentic British produce',

      // Safe zone for text overlay if requested
      options.safeZone
        ? 'subtle vignette with low-detail area in top-left quadrant for text overlay'
        : undefined,

      // Additional style hint
      options.styleHint
    ].filter(Boolean)

    return promptParts.join(', ')
  }

  /**
   * Generate multiple variations for a produce item
   * Each variation uses a different editorial composition
   */
  async generateVariations(
    produceName: string,
    slug: string,
    count: number = 4
  ): Promise<Buffer[]> {
    const buffers: Buffer[] = []

    for (let i = 0; i < count; i++) {
      const seed = this.hashString(slug) + i * 9973
      const buffer = await this.generateProduceImage(produceName, slug, {
        seed,
        variation: i + 1
      })

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
        negativePrompt: EDITORIAL_GROCER_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated editorial image', { bytes: buffer.length })
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
