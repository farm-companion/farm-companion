/**
 * Farm Image Generator - "Real Places" Template
 *
 * God-tier architectural photography using Forensic Photography Prompting.
 * Captures authentic British farm shop exteriors with documentary realism.
 * Targets the aesthetic of Country Living, The English Home, and high-end
 * travel photography.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { logger } from '@/lib/logger'
import { getRunwareClient } from './runware-client'

const imageGenLogger = logger.child({ route: 'lib/farm-image-generator' })

/**
 * God-Tier Negative Prompt for Architecture - Eliminates AI Artifacts
 *
 * Prevents: perfect symmetry, plastic textures, generic buildings,
 * unrealistic lighting that screams "AI generated"
 */
const REAL_PLACES_NEGATIVE = [
  // Anti-AI artifacts
  'artificial, fake, CGI, 3D render, illustration, painting, drawing, digital art',
  'too perfect, too symmetrical, too clean, unrealistic, uncanny valley',
  'oversaturated, hyperrealistic, HDR look, video game graphics',
  // Anti-content pollution
  'text, watermark, logo, signature, copyright, sign with readable text',
  'people, crowds, faces, figures, pedestrians, customers',
  'cars, vehicles, modern signage, LED lights, neon',
  // Anti-architecture errors
  'church, church spire, steeple, chapel, religious building, cathedral',
  'skyscraper, modern building, glass facade, steel structure',
  'suburban house, housing estate, generic building, identical buildings',
  // Anti-composition errors
  'blurry, out of focus, motion blur, tilted horizon, dutch angle',
  'cropped building, missing roof, cut off edges, bad framing',
  // Anti-lighting errors
  'harsh midday shadows, direct flash, studio lighting, artificial lights',
  'overexposed sky, blown highlights, underexposed shadows'
].join(', ')

/**
 * UK Regional Architectural DNA
 *
 * Each region has specific materials, colors, and building traditions
 * that make farm shops feel authentically local.
 */
const REGIONAL_ARCHITECTURAL_DNA: Record<string, {
  materials: string
  colors: string
  features: string
  landscape: string
}> = {
  // South West
  cornwall: {
    materials: 'Cornish granite walls, slate roof tiles, whitewashed render',
    colors: 'soft grey granite, cream and pale blue painted details',
    features: 'thick walls, small windows, storm porches, fish scale slates',
    landscape: 'wild coastal headland, gorse bushes, granite outcrops'
  },
  devon: {
    materials: 'Devon cob walls, wheat thatch roof, red Exeter sandstone',
    colors: 'cream cob, deep thatch brown, terracotta red trim',
    features: 'rounded walls, deep thatch overhang, bread oven bump',
    landscape: 'rolling red earth fields, Devon banks with wildflowers'
  },
  somerset: {
    materials: 'golden Ham Hill stone, clay tile roof',
    colors: 'warm honey gold stone, terracotta roof tiles',
    features: 'mullioned windows, stone lintels, cider barn character',
    landscape: 'Somerset Levels, willow trees, cider apple orchards'
  },
  dorset: {
    materials: 'Purbeck stone, Portland stone details, thatch or slate',
    colors: 'grey-cream Purbeck, bright Portland white accents',
    features: 'stone mullions, thatched eyebrow dormers',
    landscape: 'rolling chalk downs, ancient hedgerows, coastal views'
  },

  // Cotswolds Belt
  cotswolds: {
    materials: 'honey Cotswold limestone, stone slate roof',
    colors: 'warm golden limestone, weathered stone slate grey',
    features: 'stone mullioned windows, drip molds, gable ends',
    landscape: 'dry stone walls, sheep pastures, beech woods'
  },
  gloucestershire: {
    materials: 'Cotswold oolitic limestone, Forest of Dean sandstone',
    colors: 'golden yellow to warm buff tones',
    features: 'stone tile roofs, finials, dated keystones',
    landscape: 'Severn Vale orchards, rolling wolds'
  },
  oxfordshire: {
    materials: 'Headington stone, Stonesfield slate, ironstone',
    colors: 'cream to golden ochre, rusty ironstone bands',
    features: 'Oxford college style details, studded oak doors',
    landscape: 'Chilterns beech woods, Thames meadows'
  },

  // South East
  kent: {
    materials: 'Kentish ragstone, white weatherboard, clay peg tiles',
    colors: 'grey-green ragstone, brilliant white boards, russet tiles',
    features: 'oast house cowls, hop garden poles, white clapboard',
    landscape: 'orchards in blossom, hop gardens, Weald countryside'
  },
  sussex: {
    materials: 'knapped flint walls, red brick dressings, Horsham stone',
    colors: 'silver-grey flint, warm red brick, green-grey Horsham slabs',
    features: 'decorative flint patterns, hung tiles, catslide roofs',
    landscape: 'South Downs chalk grassland, ancient woods'
  },
  surrey: {
    materials: 'Bargate stone, tile hanging, half-timber',
    colors: 'golden Bargate, terracotta tiles, oak timber',
    features: 'tile-hung gables, tall chimneys, Surrey vernacular',
    landscape: 'Surrey Hills AONB, sandy heaths, wooded valleys'
  },

  // East Anglia
  norfolk: {
    materials: 'knapped flint, red brick, Dutch gables, pantiles',
    colors: 'silver flint, warm red brick, terracotta pantiles',
    features: 'crow-stepped Dutch gables, flint flush work',
    landscape: 'vast skies, reed beds, windmills, Broads'
  },
  suffolk: {
    materials: 'timber frame, Suffolk pink render, clay lump',
    colors: 'famous Suffolk pink, cream limewash, soft ochre',
    features: 'pargetting plasterwork, jettied upper floors',
    landscape: 'gentle river valleys, ancient woodlands'
  },
  essex: {
    materials: 'white weatherboard, red brick, clay tiles',
    colors: 'brilliant white clapboard, warm red brick',
    features: 'weather boarded barns, bell cotes, Essex boarding',
    landscape: 'rolling arable fields, ancient hedgerows'
  },

  // Midlands
  herefordshire: {
    materials: 'black and white timber frame, red sandstone',
    colors: 'stark black timbers, white infill, pink-red sandstone',
    features: 'magpie timber patterns, oriel windows, cider house',
    landscape: 'Herefordshire orchards, River Wye valley'
  },
  worcestershire: {
    materials: 'half-timber frame, red brick, Malvern stone',
    colors: 'black and white magpie, warm red brick',
    features: 'decorative timber patterns, Malvern Hills backdrop',
    landscape: 'Vale of Evesham fruit orchards, hop yards'
  },
  warwickshire: {
    materials: 'red brick, blue brick details, Warwick stone',
    colors: 'warm red brick, blue engineering brick bands',
    features: 'Victorian agricultural character, Shakespeare country',
    landscape: 'Forest of Arden, hedged pastures'
  },

  // North
  yorkshire: {
    materials: 'millstone grit, Yorkshire stone flags, Welsh slate',
    colors: 'dark grey-brown gritstone, weathered to silver-gold',
    features: 'massive stone lintels, mullioned windows, stone troughs',
    landscape: 'Dales limestone walls, moorland backdrop, wharfe valleys'
  },
  lancashire: {
    materials: 'red Penrith sandstone, grey limestone, Welsh slate',
    colors: 'warm red sandstone, grey limestone, dark slate',
    features: 'solid mill town character, stone window surrounds',
    landscape: 'Pennine foothills, Ribble Valley, Forest of Bowland'
  },
  cumbria: {
    materials: 'Lake District slate, whitewashed roughcast, green slate',
    colors: 'silver-green slate, brilliant whitewash, mossy greens',
    features: 'round chimneys, spinning galleries, bank barns',
    landscape: 'dramatic fells, stone walls, tarns and lakes'
  },
  northumberland: {
    materials: 'grey sandstone, pantiles, lime harling',
    colors: 'warm grey-gold sandstone, terracotta pantiles',
    features: 'fortified pele tower influence, bastle house character',
    landscape: 'wild Cheviot hills, Hadrians Wall country'
  },

  // Scotland
  scotland: {
    materials: 'Scottish granite, harling render, slate',
    colors: 'grey granite, white harling, blue-grey slate',
    features: 'crow-stepped gables, turnpike stairs, dormer windows',
    landscape: 'Highland glens, lochs, heather moorland'
  },
  highlands: {
    materials: 'whitewashed stone, corrugated iron roofs',
    colors: 'brilliant white walls, rusted iron, grey stone',
    features: 'croft house character, simple robust forms',
    landscape: 'dramatic mountain backdrop, coastal machair'
  },

  // Wales
  wales: {
    materials: 'Welsh slate, whitewashed stone, lime render',
    colors: 'blue-grey slate, brilliant whitewash, grey stone',
    features: 'longhouse tradition, stone outbuildings, farmyard layout',
    landscape: 'green valleys, mountain backdrop, sheep pastures'
  },
  pembrokeshire: {
    materials: 'whitewashed stone, slate roof, lime render',
    colors: 'dazzling white walls against grey slate, blue sky',
    features: 'coastal cottage character, thick walls, small windows',
    landscape: 'wild Pembrokeshire coast, Celtic field patterns'
  }
}

/**
 * Atmospheric Conditions for British Farm Shops
 */
const BRITISH_ATMOSPHERES = [
  'soft early morning mist lifting from dewy fields, magical golden hour, intimate atmosphere',
  'warm afternoon sunlight with long shadows, late summer abundance, inviting warmth',
  'dramatic sky with scattered cumulus clouds, fresh after rain, crystalline air',
  'gentle overcast light, soft diffused shadows, timeless British day',
  'autumn golden hour with amber warmth, harvest season atmosphere, rich tones',
  'crisp spring morning with blossom, fresh growth, renewal energy'
]

/**
 * Documentary Scene Compositions
 */
const DOCUMENTARY_COMPOSITIONS = [
  // Wide establishing shot
  'wide establishing shot showing farm shop in its landscape context, rule of thirds, environmental portrait of a building',
  // Three-quarter view
  'three-quarter angle view revealing building depth and character, classic architectural photography angle',
  // Entrance focus
  'welcoming entrance composition with depth through doorway, inviting perspective, threshold moment',
  // Detail rich
  'layered composition with foreground interest, produce crates leading eye to building, editorial depth'
]

interface FarmImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  county?: string
  /** Include safe zone for text overlays */
  safeZone?: boolean
  /** Composition variation (1-4) */
  composition?: number
}

/**
 * FarmImageGenerator - "Real Places" Template
 *
 * Generates documentary-style architectural photography of British farm shops
 * using Forensic Photography Prompting.
 */
export class FarmImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  /**
   * Generate god-tier farm shop photography
   * Documentary realism meets editorial quality
   */
  async generateFarmImage(
    farmName: string,
    slug: string,
    options: FarmImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating Real Places farm image', { farmName, slug })

      const width = options.width ?? 2048
      const height = options.height ?? 1152 // 16:9 cinematic
      const seed = options.seed ?? this.hashString(slug)
      const prompt = this.createRealPlacesPrompt(farmName, options)

      imageGenLogger.debug('Real Places prompt created', {
        promptPreview: prompt.substring(0, 200)
      })

      // Try Runware first (Flux.2 [dev] for best realism)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

      // Fallback to Pollinations
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { farmName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('Real Places image generated', { farmName, bytes: imageBuffer.length })
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
   * Create "Real Places" Prompt
   *
   * Forensic Photography Prompting that captures authentic British farm shop
   * architecture with documentary realism.
   */
  private createRealPlacesPrompt(farmName: string, options: FarmImageOptions): string {
    const hash = this.hashString(farmName)

    // Get regional architectural DNA
    const region = this.getRegionFromCounty(options.county || '')
    const architectural = region
      ? REGIONAL_ARCHITECTURAL_DNA[region]
      : {
          materials: 'traditional British stone and brick, weathered timber',
          colors: 'natural aged patina, authentic weathering',
          features: 'period architectural details, handcrafted character',
          landscape: 'rolling British countryside, ancient hedgerows'
        }

    // Select composition
    const compositionIndex = (options.composition ?? hash) % DOCUMENTARY_COMPOSITIONS.length
    const composition = DOCUMENTARY_COMPOSITIONS[compositionIndex]

    // Select atmosphere
    const atmosphere = BRITISH_ATMOSPHERES[hash % BRITISH_ATMOSPHERES.length]

    // Build forensic photography prompt
    const promptParts = [
      // Subject with authenticity
      'Authentic British farm shop exterior, documentary photography',
      'real working agricultural building with genuine character',

      // Regional authenticity
      architectural.materials,
      architectural.colors,
      architectural.features,

      // Weathered imperfections (critical for realism)
      'naturally weathered surfaces, authentic patina of age',
      'slightly overgrown edges, real moss on roof tiles',
      'hand-painted vintage signage, worn wooden crates with produce',

      // Technical camera specs (forces AI to think like a camera)
      '35mm prime lens, f/5.6 aperture for architectural depth',
      'natural perspective, no distortion, level horizon',

      // Lighting (British atmospheric)
      'soft natural daylight only, no artificial lighting',
      atmosphere,

      // Landscape context
      `${architectural.landscape}, isolated rural setting`,
      'no other buildings visible, countryside context',

      // Composition
      composition,

      // Quality markers
      'Country Living magazine editorial quality',
      'high-end architectural photography, The English Home aesthetic',
      'documentary realism, authentic British vernacular',

      // Safe zone for text overlay
      options.safeZone
        ? 'subtle vignette with low-detail sky area in top-left quadrant for text overlay'
        : undefined,

      // Additional style hint
      options.styleHint
    ].filter(Boolean)

    return promptParts.join(', ')
  }

  /**
   * Match county to regional architectural DNA
   */
  private getRegionFromCounty(county: string): string | null {
    const countyLower = county.toLowerCase()

    for (const region of Object.keys(REGIONAL_ARCHITECTURAL_DNA)) {
      if (countyLower.includes(region)) {
        return region
      }
    }

    // Try partial matches
    if (countyLower.includes('lake') || countyLower.includes('cumbri')) return 'cumbria'
    if (countyLower.includes('york')) return 'yorkshire'
    if (countyLower.includes('corn')) return 'cornwall'
    if (countyLower.includes('cotswold') || countyLower.includes('glouc')) return 'cotswolds'
    if (countyLower.includes('high')) return 'highlands'

    return null
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
        negativePrompt: REAL_PLACES_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated Real Places image', { bytes: buffer.length })
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

      const fullPrompt = `${prompt}, Negative: ${REAL_PLACES_NEGATIVE}`
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated Real Places image', { bytes: response.data.length })
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
