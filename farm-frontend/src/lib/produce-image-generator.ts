/**
 * Produce Image Generator
 *
 * Two-mode system for produce imagery:
 * - NATURAL_PACKSHOT: Anatomically accurate retail catalog imagery
 * - MAISON_STILL_LIFE: LV-style luxury brand studio still life
 *
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
import { v4 as uuidv4 } from 'uuid'

const imageGenLogger = logger.child({ route: 'lib/produce-image-generator' })

// ============================================================================
// TWO-MODE IMAGE GENERATION SYSTEM
// ============================================================================

export type ImageMode = 'NATURAL_PACKSHOT' | 'MAISON_STILL_LIFE'
export type MaisonVariant = 'single' | 'whole+half' | 'pair' | 'stack3' | 'bundle'

export interface ProduceInferenceOptions {
  produceName: string
  mode: ImageMode
  variant?: MaisonVariant
  lightingPreset?: 'bright' | 'moody'
  seed?: number
  width?: number
  height?: number
}

export interface RunwareInferencePayload {
  taskType: 'imageInference'
  taskUUID: string
  model: string
  positivePrompt: string
  negativePrompt: string
  width: number
  height: number
  steps: number
  CFGScale: number
  scheduler: string
  rawMode: boolean
  numberResults: number
  outputFormat: string
}

/**
 * Geometry lock clause - ALWAYS FIRST in prompt
 * Locks anatomical correctness before any styling
 */
function getGeometryLock(produceName: string, variant: MaisonVariant = 'single'): string {
  const variantNote = variant === 'single'
    ? 'Single subject only.'
    : `Variant: ${variant}. Subject count matches variant specification only.`

  return `A plain retail product photograph of ${produceName}. ${variantNote} True supermarket produce. Anatomically correct proportions for ${produceName}. Slight natural asymmetry and non-uniform micro-texture. No deformation. No mutation. True-to-life scale. Photorealistic.`
}

/**
 * Mode style clauses
 */
const MODE_STYLE_CLAUSES: Record<ImageMode, string> = {
  NATURAL_PACKSHOT: `Documentary catalog packshot. Neutral seamless background or neutral matte stone surface. Clean set. No props. Orthographic perspective. Boring retail clarity.`,

  MAISON_STILL_LIFE: `Luxury brand studio still life. Clean cyclorama studio gradient background with smooth tonal falloff. Museum-like negative space. Minimal graphic composition, centered, deliberate balance. Premium editorial still life but still product-real and color accurate. No props.`
}

/**
 * Camera rig clause - highest end
 */
const CAMERA_RIG = `Captured as a high-end commercial still life on a Phase One XF with IQ4 150MP digital back, Schneider Kreuznach 120mm Macro lens, tethered studio capture, color checker calibration, cross-polarized lighting to control specular highlights, f/11 deep focus, edge-to-edge sharpness.`

/**
 * Lighting clauses
 */
const LIGHTING_CLAUSES: Record<'bright' | 'moody', string> = {
  bright: `High key soft daylight feel, overhead diffusion, even exposure, minimal shadow density, clean premium catalog lighting.`,
  moody: `Low key side softbox, gentle falloff, controlled contrast, soft shadow edges, premium boutique lighting.`
}

/**
 * Variant clauses for composition
 */
const VARIANT_CLAUSES: Record<MaisonVariant, string> = {
  single: `One intact specimen, centered.`,
  'whole+half': `One whole specimen plus one cleanly cut half to reveal interior structure. No juice mess.`,
  pair: `Two specimens only, slight offset, same variety.`,
  stack3: `Three specimens stacked with stable balance, minimal composition, no surreal floating.`,
  bundle: `A small bundle of 3 to 5 only, tidy, no extra items.`
}

/**
 * Enhanced universal negative prompt
 */
const ENHANCED_NEGATIVE = `deformed, misshapen, warped, stretched, melted, mutated, fused items, extra items, doubled subject, extra stems, extra leaves, extra slices, surreal, abstract, stylized, illustration, cartoon, CGI, plastic, waxy smoothing, oversharpening halos, artifacts, cinematic, shallow depth of field, bokeh, food styling, arranged messy composition, kitchen, bowls, plates, wooden boards, rustic props, broken slate tile, hands, people, text, watermark, logo`

/**
 * Per-produce negative overrides for known failure modes
 */
const PRODUCE_NEGATIVE_OVERRIDES: Record<string, string> = {
  'blackberries': 'blueberry crown, calyx hole, blossom-end cavity, currant, grape, bead cluster, perfect spheres, toy fruit, over-polished, fused berries, extra berries',
  'raspberries': 'solid center, blueberry crown, calyx holes, perfect spheres, bead cluster, fused berries',
  'blueberries': 'raspberry drupelets, blackberry structure, hollow center, irregular drupelets',
  'strawberries': 'raspberry drupelets, blackberry drupelets, smooth surface, missing seeds',
  'kale': 'broccoli, cauliflower, florets, tree-like shape, dense rounded head, compact head vegetable, smooth leaves, cabbage head, lettuce, spinach, chard, generic green leaf, solid head, iceberg, romaine, unidentifiable green, abstract green texture, micro close-up without context, brassica floret',
  'cavolo-nero': 'curly kale, ruffled edges, cabbage head, lettuce, spinach, bright green, generic green leaf, round leaves',
  'spinach': 'kale, chard, curly leaves, ruffled edges, thick stems, cabbage, lobed leaves, generic green leaf',
  'rocket': 'round leaves, smooth margins, lettuce, spinach, cabbage, basil, generic green leaf, broad leaves',
  'watercress': 'kale, cabbage, lettuce, large leaves, lobed leaves, ruffled edges, generic green leaf, dry surface',
  'swiss-chard': 'kale, cabbage, spinach, narrow stems, ruffled edges, lobed leaves, generic green leaf'
}

/**
 * Category-based step tuning
 */
function getStepsForCategory(category: ProduceCategory): number {
  switch (category) {
    case 'strawberries':
    case 'brambles':
    case 'blueberries':
      return 60 // Berries need higher steps
    case 'leafy_ruffled':
      return 60 // Ruffled leafy greens need higher steps to resolve correct species
    case 'leafy_flat':
      return 55 // Flat leafy greens
    case 'root':
      return 55 // Root vegetables
    case 'squash':
      return 50 // Large simple items
    default:
      return 55 // Default
  }
}

/**
 * Concept phrases based on produce category for Maison mode
 */
function getMaisonConcept(category: ProduceCategory, variant: MaisonVariant): string {
  if (variant !== 'single') return '' // Concept only for single items

  const concepts: Partial<Record<ProduceCategory, string>> = {
    pome_fruit: 'balanced sculptural placement, subtle offset, clean negative space',
    citrus: 'one whole plus one clean cut half to reveal interior geometry, juice vesicles crisp',
    tomatoes: 'balanced stack of three, aligned vertical axis, slight offset, sculptural still life',
    alliums: 'balanced stack of three, aligned vertical axis, slight offset, sculptural still life',
    stalks: 'parallel alignment with slight stagger, graphic repetition, clean negative space',
    root: 'parallel alignment with slight stagger, graphic repetition, clean negative space',
    leafy_ruffled: 'bunch of leaves arranged vertically with stalks gathered at base, sculptural three-dimensional form, species clearly identifiable from leaf shape and texture, not a close-up crop',
    leafy_flat: 'loose pile or small bunch of leaves with natural overlap, species clearly identifiable from leaf shape and silhouette, not a close-up crop, full leaves visible',
    brambles: 'single cluster suspended or gently resting, controlled shadow, macro texture emphasis',
    blueberries: 'single cluster suspended or gently resting, controlled shadow, macro texture emphasis',
    strawberries: 'single specimen larger in frame, centered, calm gradient background, soft shadow'
  }

  return concepts[category] || ''
}

/**
 * Generate Runware inference payload for produce image
 * Returns JSON payload only - does not call API
 */
export function generateProduceInferenceTask(options: ProduceInferenceOptions): RunwareInferencePayload {
  const {
    produceName,
    mode,
    variant = 'single',
    lightingPreset = 'bright',
    seed = Date.now(),
    width = 1536,
    height = 1536
  } = options

  // Get category for this produce
  const slug = produceName.toLowerCase().replace(/\s+/g, '-')
  const category = PRODUCE_CATEGORY_MAP[slug] || 'pome_fruit'

  // Build prompt parts in exact order
  const parts: string[] = []

  // 1. GEOMETRY_LOCK (always first)
  parts.push(getGeometryLock(produceName, variant))

  // 2. MODE_STYLE_CLAUSE
  parts.push(MODE_STYLE_CLAUSES[mode])

  // 3. CAMERA_RIG
  parts.push(CAMERA_RIG)

  // 4. LIGHTING_CLAUSE
  parts.push(LIGHTING_CLAUSES[lightingPreset])

  // 5. PRODUCE_BIO_CUE
  const bioCue = getBiologicalCue(produceName)
  parts.push(bioCue)

  // 6. VARIANT_CLAUSE
  parts.push(VARIANT_CLAUSES[variant])

  // 7. MAISON concept (if applicable)
  if (mode === 'MAISON_STILL_LIFE') {
    const concept = getMaisonConcept(category, variant)
    if (concept) {
      parts.push(`Concept: ${concept}`)
    }
  }

  const positivePrompt = parts.join(' ')

  // Build negative prompt with per-produce overrides
  let negativePrompt = ENHANCED_NEGATIVE
  const override = PRODUCE_NEGATIVE_OVERRIDES[slug]
  if (override) {
    negativePrompt = `${negativePrompt}, ${override}`
  }

  // Get steps based on category
  const steps = getStepsForCategory(category)

  // CFG scale: 2.8-3.1 range
  const CFGScale = mode === 'MAISON_STILL_LIFE' ? 2.8 : 3.0

  const payload: RunwareInferencePayload = {
    taskType: 'imageInference',
    taskUUID: uuidv4(),
    model: 'rundiffusion:130@100', // Juggernaut Pro Flux
    positivePrompt,
    negativePrompt,
    width,
    height,
    steps,
    CFGScale,
    scheduler: 'FlowMatchEulerDiscreteScheduler',
    rawMode: true,
    numberResults: 1,
    outputFormat: 'webp'
  }

  imageGenLogger.debug('Generated inference payload', {
    produceName,
    mode,
    variant,
    steps,
    promptLength: positivePrompt.length
  })

  return payload
}

/**
 * Generate both Natural and Maison images for a produce item
 */
export function generateDualModePayloads(
  produceName: string,
  seed?: number
): { natural: RunwareInferencePayload; maison: RunwareInferencePayload } {
  const baseSeed = seed ?? Date.now()

  return {
    natural: generateProduceInferenceTask({
      produceName,
      mode: 'NATURAL_PACKSHOT',
      variant: 'single',
      lightingPreset: 'bright',
      seed: baseSeed
    }),
    maison: generateProduceInferenceTask({
      produceName,
      mode: 'MAISON_STILL_LIFE',
      variant: 'single',
      lightingPreset: 'moody',
      seed: baseSeed + 1000
    })
  }
}

// ============================================================================
// LEGACY PACKSHOT GENERATOR (preserved for backward compatibility)
// ============================================================================

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

  leafy_ruffled: `Loose leafy green vegetable, NOT broccoli, NOT cauliflower, NOT florets. Open ruffled LEAVES on long stems, deeply lobed lamina, thick fibrous midrib, visible epicuticular wax bloom, blue-green waxy cuticle, three-dimensional curl away from midrib`,

  leafy_flat: `Botanical specimen of a specific salad leaf. Smooth or gently undulating margins, tender succulent blade, visible venation pattern, natural moisture sheen, species-specific leaf silhouette clearly identifiable`,

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
  /** Image mode: MAISON_STILL_LIFE for luxury, NATURAL_PACKSHOT for catalog */
  mode?: ImageMode
  /** Lighting preset */
  lighting?: LightingPreset
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
      const mode = options.mode ?? 'NATURAL_PACKSHOT'
      const lighting = options.lighting ?? (mode === 'MAISON_STILL_LIFE' ? 'moody' : 'bright')

      imageGenLogger.info('Generating produce image', { produceName, slug, mode })

      // 1536px = optimal for geometry stability with FLUX
      const width = options.width ?? 1536
      const height = options.height ?? 1536
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createProducePrompt(produceName, slug, 'whole', lighting, mode)

      imageGenLogger.debug('Prompt created', { promptPreview: prompt.substring(0, 120) })

      // Try Runware first (60% cheaper, 40% faster)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed, slug })

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
   * Create universal packshot prompt using new two-mode structure
   * Order: (1) Geometry Lock, (2) Mode Style, (3) Camera Rig, (4) Lighting, (5) Biological cue
   */
  private createProducePrompt(
    produceName: string,
    slug: string,
    variant: ProduceVariant = 'whole',
    lighting: LightingPreset = 'bright',
    mode: ImageMode = 'NATURAL_PACKSHOT'
  ): string {
    const parts: string[] = []

    // 1. Geometry lock (always first)
    parts.push(getGeometryLock(produceName, 'single'))

    // 2. Mode style clause
    parts.push(MODE_STYLE_CLAUSES[mode])

    // 3. Camera rig (highest end)
    parts.push(CAMERA_RIG)

    // 4. Lighting preset
    parts.push(LIGHTING_CLAUSES[lighting])

    // 5. Biological cue from universal library
    const biologicalCue = getBiologicalCue(produceName)
    parts.push(biologicalCue)

    // 6. Variant clause
    const variantMap: Record<ProduceVariant, MaisonVariant> = {
      whole: 'single',
      sliced: 'whole+half',
      halved: 'whole+half',
      bunch: 'bundle',
      cluster: 'bundle'
    }
    parts.push(VARIANT_CLAUSES[variantMap[variant]])

    // 7. Maison concept if applicable
    if (mode === 'MAISON_STILL_LIFE') {
      const category = PRODUCE_CATEGORY_MAP[slug] || 'pome_fruit'
      const concept = getMaisonConcept(category, 'single')
      if (concept) {
        parts.push(`Concept: ${concept}`)
      }
    }

    const prompt = parts.join(' ')

    imageGenLogger.debug('Two-mode packshot prompt generated', {
      slug,
      produceName,
      mode,
      lighting,
      promptLength: prompt.length
    })

    return prompt
  }

  /**
   * Get the enhanced negative prompt with per-produce overrides
   */
  getNegativePrompt(slug?: string): string {
    let negative = ENHANCED_NEGATIVE
    if (slug && PRODUCE_NEGATIVE_OVERRIDES[slug]) {
      negative = `${negative}, ${PRODUCE_NEGATIVE_OVERRIDES[slug]}`
    }
    return negative
  }

  /**
   * Get the category for a produce item
   */
  getProduceCategory(slug: string): ProduceCategory {
    return PRODUCE_CATEGORY_MAP[slug] || 'strawberries'
  }

  /**
   * Shot type definitions for 4 distinctly different views
   * Used by both generateVariations and generateSpecificShot
   */
  private static readonly SHOT_TYPES: Array<{
    mode: ImageMode
    lighting: LightingPreset
    variant: MaisonVariant
    concept: string
    name: string
  }> = [
    {
      // Shot 1: Hero - Clean luxury beauty shot
      mode: 'MAISON_STILL_LIFE',
      lighting: 'moody',
      variant: 'single',
      concept: 'Hero shot. Centered subject, dramatic lighting, clean negative space.',
      name: 'Hero'
    },
    {
      // Shot 2: Cross-section - Interior view showing freshness
      mode: 'NATURAL_PACKSHOT',
      lighting: 'bright',
      variant: 'whole+half',
      concept: 'Interior reveal. One whole specimen plus one cleanly cut half showing fresh interior structure, juice vesicles, seeds, or flesh texture.',
      name: 'Cross-section'
    },
    {
      // Shot 3: Macro detail - Extreme close-up of texture
      mode: 'MAISON_STILL_LIFE',
      lighting: 'moody',
      variant: 'single',
      concept: 'Macro texture detail. Extreme close-up showing surface texture, skin pores, seeds, veins, or natural patterns. Fill the frame with textural detail.',
      name: 'Macro'
    },
    {
      // Shot 4: Composition - Multiple items artistic arrangement
      mode: 'MAISON_STILL_LIFE',
      lighting: 'bright',
      variant: 'stack3',
      concept: 'Artistic composition. Three specimens arranged with intentional balance, slight overlap, sculptural still life aesthetic.',
      name: 'Composition'
    }
  ]

  /**
   * Generate multiple variations for a produce item
   * Creates 4 distinctly different views like a luxury product page:
   * 1. Hero shot - Luxury single specimen (MAISON_STILL_LIFE)
   * 2. Cross-section - Interior view showing freshness (whole+half)
   * 3. Macro detail - Extreme close-up of texture
   * 4. Artistic composition - Multiple items arranged
   */
  async generateVariations(
    produceName: string,
    slug: string,
    count: number = 4
  ): Promise<Buffer[]> {
    const buffers: Buffer[] = []
    const baseSeed = this.hashString(slug)
    const shotTypes = ProduceImageGenerator.SHOT_TYPES

    for (let i = 0; i < Math.min(count, shotTypes.length); i++) {
      const shot = shotTypes[i]
      const seed = baseSeed + i * 9973

      imageGenLogger.info('Generating variation', {
        produceName,
        index: i,
        mode: shot.mode,
        lighting: shot.lighting,
        variant: shot.variant,
        shotType: shot.name
      })

      const buffer = await this.generateProduceImageWithShot(produceName, slug, {
        seed,
        mode: shot.mode,
        lighting: shot.lighting,
        variant: shot.variant,
        conceptOverride: shot.concept
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
   * Generate a specific shot by variation ID (1-4)
   * Used for append mode to generate only missing shots
   *
   * @param produceName - Display name of the produce
   * @param slug - URL slug for the produce
   * @param variationId - 1-based shot number (1=Hero, 2=Cross-section, 3=Macro, 4=Composition)
   */
  async generateSpecificShot(
    produceName: string,
    slug: string,
    variationId: number
  ): Promise<Buffer | null> {
    const shotTypes = ProduceImageGenerator.SHOT_TYPES
    const index = variationId - 1

    if (index < 0 || index >= shotTypes.length) {
      imageGenLogger.warn('Invalid variation ID', { variationId, validRange: '1-4' })
      return null
    }

    const shot = shotTypes[index]
    const baseSeed = this.hashString(slug)
    const seed = baseSeed + index * 9973

    imageGenLogger.info('Generating specific shot', {
      produceName,
      variationId,
      shotType: shot.name,
      mode: shot.mode,
      lighting: shot.lighting,
      variant: shot.variant
    })

    return this.generateProduceImageWithShot(produceName, slug, {
      seed,
      mode: shot.mode,
      lighting: shot.lighting,
      variant: shot.variant,
      conceptOverride: shot.concept
    })
  }

  /**
   * Get shot type name by variation ID
   */
  static getShotTypeName(variationId: number): string {
    const index = variationId - 1
    if (index >= 0 && index < ProduceImageGenerator.SHOT_TYPES.length) {
      return ProduceImageGenerator.SHOT_TYPES[index].name
    }
    return `Shot ${variationId}`
  }

  /**
   * Generate a produce image with specific shot type configuration
   */
  private async generateProduceImageWithShot(
    produceName: string,
    slug: string,
    options: {
      seed: number
      mode: ImageMode
      lighting: LightingPreset
      variant: MaisonVariant
      conceptOverride?: string
    }
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating produce image with shot config', { produceName, slug, ...options })

      const width = 1536
      const height = 1536
      const prompt = this.createProducePromptWithVariant(produceName, slug, options)

      // Try Runware first
      let imageBuffer = await this.callRunwareWithVariant(prompt, {
        width,
        height,
        seed: options.seed,
        slug
      })

      // Fallback to Pollinations if Runware fails
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { produceName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed: options.seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('Image generated successfully', { produceName, bytes: imageBuffer.length })
        return imageBuffer
      }

      return null
    } catch (error) {
      imageGenLogger.error('Image generation failed', { produceName }, error as Error)
      return null
    }
  }

  /**
   * Create prompt with specific variant and concept override
   */
  private createProducePromptWithVariant(
    produceName: string,
    slug: string,
    options: {
      mode: ImageMode
      lighting: LightingPreset
      variant: MaisonVariant
      conceptOverride?: string
    }
  ): string {
    const parts: string[] = []

    // 1. Geometry lock with variant
    parts.push(getGeometryLock(produceName, options.variant))

    // 2. Mode style clause
    parts.push(MODE_STYLE_CLAUSES[options.mode])

    // 3. Camera rig
    parts.push(CAMERA_RIG)

    // 4. Lighting preset
    parts.push(LIGHTING_CLAUSES[options.lighting])

    // 5. Biological cue
    const biologicalCue = getBiologicalCue(produceName)
    parts.push(biologicalCue)

    // 6. Variant clause
    parts.push(VARIANT_CLAUSES[options.variant])

    // 7. Concept override (specific shot type direction)
    if (options.conceptOverride) {
      parts.push(`Shot concept: ${options.conceptOverride}`)
    }

    return parts.join(' ')
  }

  /**
   * Call Runware with variant-aware parameters
   */
  private async callRunwareWithVariant(
    prompt: string,
    opts: { width: number; height: number; seed: number; slug: string }
  ): Promise<Buffer | null> {
    const client = getRunwareClient()

    if (!client.isConfigured()) {
      imageGenLogger.warn('RUNWARE_API_KEY not configured, skipping Runware')
      return null
    }

    try {
      const category = PRODUCE_CATEGORY_MAP[opts.slug] || 'pome_fruit'
      const steps = getStepsForCategory(category)
      const negativePrompt = this.getNegativePrompt(opts.slug)

      const buffer = await client.generateBuffer({
        prompt,
        negativePrompt,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps,
        cfgScale: 3.0,
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
   * Call Runware API with category-based parameters
   * Uses enhanced negative prompt with produce-specific overrides
   */
  private async callRunware(
    prompt: string,
    opts: { width: number; height: number; seed: number; slug: string }
  ): Promise<Buffer | null> {
    const client = getRunwareClient()

    if (!client.isConfigured()) {
      imageGenLogger.warn('RUNWARE_API_KEY not configured, skipping Runware')
      return null
    }

    try {
      // Get category-based steps
      const category = PRODUCE_CATEGORY_MAP[opts.slug] || 'pome_fruit'
      const steps = getStepsForCategory(category)

      // Get enhanced negative prompt with produce-specific overrides
      const negativePrompt = this.getNegativePrompt(opts.slug)

      const buffer = await client.generateBuffer({
        prompt,
        negativePrompt,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps,           // Category-based steps (50-60)
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
