/**
 * County Image Generator - "Atmospheric Almanac" Template
 *
 * God-tier landscape photography using Forensic Photography Prompting.
 * Captures authentic British county landscapes with cinematic realism.
 * Targets the aesthetic of high-end travel photography, National Trust
 * publications, and British landscape calendars.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { logger } from '@/lib/logger'
import { getRunwareClient } from './runware-client'

const imageGenLogger = logger.child({ route: 'lib/county-image-generator' })

/**
 * God-Tier Negative Prompt - Eliminates AI Artifacts from Landscapes
 *
 * Prevents: oversaturated colors, perfect symmetry, generic postcards,
 * unrealistic lighting that screams "AI generated"
 */
const ATMOSPHERIC_ALMANAC_NEGATIVE = [
  // Anti-AI artifacts
  'artificial, fake, CGI, 3D render, illustration, painting, digital art',
  'oversaturated, hyperrealistic, too perfect, HDR look, video game',
  'generic postcard, stock photo, cliche composition, tourist shot',
  // Anti-content pollution
  'text, watermark, logo, signature, copyright, stamp, magazine logo',
  'people, crowds, tourists, hikers, figures in landscape',
  'cars, vehicles, roads, motorways, modern infrastructure',
  // Anti-architecture pollution
  'church, church spire, steeple, chapel, cathedral, religious building',
  'modern buildings, factories, power stations, wind turbines, pylons',
  'housing estates, suburbs, urban sprawl, construction',
  // Anti-composition errors
  'blurry, out of focus, motion blur, tilted horizon, bad framing',
  'cropped awkwardly, centered subject, boring composition',
  // Anti-lighting errors
  'harsh midday shadows, direct sunlight, blown highlights',
  'artificial lighting, studio lights, flash photography',
  'overexposed sky, underexposed foreground, high contrast HDR'
].join(', ')

/**
 * British Seasonal Light - Authentic UK Atmospheric Conditions
 *
 * Maps each month to specific lighting conditions that reflect
 * the actual British climate and its effect on landscape photography.
 */
const BRITISH_SEASONAL_LIGHT: Record<number, string> = {
  1: 'crisp January frost, low winter sun casting long shadows, cold blue tones, frozen landscape',
  2: 'pale February light, hints of lengthening days, soft grey skies, early snowdrops',
  3: 'fresh March morning, cool bright light, first spring clarity, new growth emerging',
  4: 'April shower light, dramatic clouds with sun breaks, spring freshness, blossom season',
  5: 'warm late May golden hour, lush green growth, bluebells in woodland, long evenings',
  6: 'luminous June morning, peak summer light, wildflower meadows, endless golden dusk',
  7: 'rich July warmth, amber harvest light, ripe fields, dramatic summer cumulus',
  8: 'golden August afternoon, late summer abundance, wheat fields glowing, honey tones',
  9: 'soft September morning, early autumn amber, harvest complete, misty valleys',
  10: 'rich October golden hour, peak autumn color, russet and amber, dramatic skies',
  11: 'moody November atmosphere, bare branches, atmospheric mist, melancholy beauty',
  12: 'ethereal December light, frost-rimmed landscape, low sun, quiet winter stillness'
}

/**
 * UK County Landscape Characteristics - Detailed Regional DNA
 *
 * Each county has unique topography, natural features, and atmospheric
 * qualities that define its visual identity.
 */
const COUNTY_LANDSCAPE_DNA: Record<string, {
  topography: string
  naturalFeatures: string
  atmosphere: string
  signature: string
}> = {
  // South West England
  cornwall: {
    topography: 'dramatic granite cliffs plunging to Atlantic Ocean, rugged headlands',
    naturalFeatures: 'wild sea pinks on cliff edges, ancient granite tors, hidden coves',
    atmosphere: 'salt spray mist, dramatic coastal weather, wild untamed energy',
    signature: 'Cornish moors meeting wild Atlantic coast'
  },
  devon: {
    topography: 'rolling red hills, Dartmoor granite tors, lush green valleys',
    naturalFeatures: 'high moorland streams, ancient oak woodland, thatched valleys',
    atmosphere: 'soft golden light through morning mist, gentle pastoral warmth',
    signature: 'Dartmoor wilderness and rich red Devon earth'
  },
  somerset: {
    topography: 'flat Levels wetlands, Mendip Hills limestone ridges',
    naturalFeatures: 'willow-lined rhynes, peat moors, ancient orchards',
    atmosphere: 'ethereal morning fog over marshland, mystical Avalon quality',
    signature: 'Glastonbury Tor rising from misty Levels'
  },
  dorset: {
    topography: 'Jurassic Coast chalk cliffs, rolling downland, heath',
    naturalFeatures: 'natural rock arches, fossil coast, heather moorland',
    atmosphere: 'dramatic coastal light, white cliffs catching golden sun',
    signature: 'ancient Jurassic coastline and Thomas Hardy landscape'
  },
  wiltshire: {
    topography: 'Salisbury Plain chalk downland, rolling wheat fields',
    naturalFeatures: 'ancient burial mounds, white horse hillsides, ancient stones',
    atmosphere: 'mystical light over ancient landscape, timeless quality',
    signature: 'Neolithic ceremonial landscape under vast skies'
  },

  // Cotswolds and Heart of England
  gloucestershire: {
    topography: 'Cotswold escarpment, Severn Vale, beech-covered hills',
    naturalFeatures: 'honey limestone walls, ancient beech hangers, wildflower meadows',
    atmosphere: 'warm afternoon light on golden stone, pastoral perfection',
    signature: 'rolling wolds and golden limestone England'
  },
  oxfordshire: {
    topography: 'Chiltern Hills beech woods, Thames Valley meadows',
    naturalFeatures: 'chalk streams, water meadows, ancient woodland',
    atmosphere: 'gentle English summer afternoon, dreamy pastoral quality',
    signature: 'quintessential Thames Valley meadowland'
  },
  warwickshire: {
    topography: 'gentle undulating countryside, Forest of Arden',
    naturalFeatures: 'ancient hedgerows, wildflower meadows, winding lanes',
    atmosphere: 'soft pastoral light, Shakespeare country tranquility',
    signature: 'green heart of England countryside'
  },
  worcestershire: {
    topography: 'Malvern Hills ridge rising from Vale of Evesham',
    naturalFeatures: 'fruit orchards in blossom, hop yards, ancient ridge',
    atmosphere: 'misty morning over orchard valleys, Elgar country romance',
    signature: 'dramatic Malvern ridge above fruit-laden vale'
  },
  herefordshire: {
    topography: 'Black Mountains foothills, meandering Wye Valley',
    naturalFeatures: 'cider apple orchards, ancient woodland, river meadows',
    atmosphere: 'golden autumn light through apple trees, borderland mystery',
    signature: 'timeless orchard country and Wye Valley beauty'
  },

  // South East England
  kent: {
    topography: 'Garden of England rolling countryside, North Downs',
    naturalFeatures: 'cherry and apple orchards, hop gardens, white cliffs',
    atmosphere: 'warm summer light over fruit-laden orchards',
    signature: 'England\'s garden in full productive bloom'
  },
  sussex: {
    topography: 'South Downs chalk grassland, ancient Weald',
    naturalFeatures: 'rolling downland, flint outcrops, ancient woodland',
    atmosphere: 'bright downland light, vast sky over chalk hills',
    signature: 'iconic South Downs Way and chalk figures'
  },
  surrey: {
    topography: 'Surrey Hills wooded ridges, sandy heathland',
    naturalFeatures: 'ancient woodland, purple heather commons, box hills',
    atmosphere: 'dappled woodland light through beech canopy',
    signature: 'AONB hills surprisingly close to London'
  },
  hampshire: {
    topography: 'New Forest heathland, Test Valley chalk streams',
    naturalFeatures: 'wild ponies grazing, ancient oaks, crystal chalk rivers',
    atmosphere: 'misty forest morning with shafts of sunlight',
    signature: 'ancient royal hunting forest and wild ponies'
  },
  berkshire: {
    topography: 'Thames Valley meadows, Berkshire Downs',
    naturalFeatures: 'riverside meadows, ancient woodland, racehorse gallops',
    atmosphere: 'soft river valley light at dawn, peaceful quality',
    signature: 'royal Windsor countryside and chalk downland'
  },

  // East Anglia
  norfolk: {
    topography: 'vast flat fenland, gentle coastal dunes',
    naturalFeatures: 'reed beds, windmills, Broads waterways, flint cottages',
    atmosphere: 'dramatic big sky country, endless horizon, painters light',
    signature: 'infinite Norfolk skies and waterland wilderness'
  },
  suffolk: {
    topography: 'gentle river valleys, Heritage Coast estuaries',
    naturalFeatures: 'Constable country water meadows, estuarine marshes',
    atmosphere: 'soft diffused light, painterly quality, Dedham Vale',
    signature: 'Constable\'s England and quiet Suffolk charm'
  },
  essex: {
    topography: 'Thames estuary marshes, rolling farmland',
    naturalFeatures: 'ancient woodland, saltmarsh, tidal creeks',
    atmosphere: 'moody estuary light, atmospheric coastal sky',
    signature: 'underrated marsh wilderness and ancient woods'
  },
  cambridgeshire: {
    topography: 'flat productive Fens, gentle chalk ridges',
    naturalFeatures: 'drainage channels, endless arable fields, reedbeds',
    atmosphere: 'vast sky over productive land, fenland drama',
    signature: 'cathedral rising from infinite fenland'
  },

  // Midlands
  lincolnshire: {
    topography: 'Lincolnshire Wolds, flat fenland, coastal dunes',
    naturalFeatures: 'rolling wolds, endless arable fields, Gibraltar Point',
    atmosphere: 'big sky country, dramatic cloud formations, wide horizons',
    signature: 'England\'s breadbasket under vast skies'
  },
  nottinghamshire: {
    topography: 'Sherwood Forest, Trent Valley meadows',
    naturalFeatures: 'ancient oak woodland, river meadows, sandstone outcrops',
    atmosphere: 'dappled forest light, Robin Hood country magic',
    signature: 'legendary Sherwood oaks and river valleys'
  },
  derbyshire: {
    topography: 'Peak District limestone dales, gritstone edges',
    naturalFeatures: 'dramatic millstone crags, white limestone valleys, drystone walls',
    atmosphere: 'dramatic moorland light, clouds sweeping over peaks',
    signature: 'dramatic gritstone edges and white limestone dales'
  },
  staffordshire: {
    topography: 'Staffordshire Moorlands, Trent Valley',
    naturalFeatures: 'heather moorland, canal-side meadows, rolling farmland',
    atmosphere: 'soft Midlands light over green pastures',
    signature: 'moorland meeting productive heartland'
  },
  shropshire: {
    topography: 'Shropshire Hills, Long Mynd ridge, Welsh Marches',
    naturalFeatures: 'ancient hillforts, rolling borderland, river valleys',
    atmosphere: 'mystical borderland light, Housman country romance',
    signature: 'blue remembered hills of Welsh borders'
  },

  // Northern England
  yorkshire: {
    topography: 'Yorkshire Dales limestone, North York Moors',
    naturalFeatures: 'miles of drystone walls, waterfalls, heather moorland',
    atmosphere: 'dramatic dale light, clouds racing over moors',
    signature: 'iconic Dales walls and moorland wilderness'
  },
  lancashire: {
    topography: 'Forest of Bowland, Ribble Valley fells',
    naturalFeatures: 'rolling fells, stone villages, hidden valleys',
    atmosphere: 'moody Pennine light, rain-washed greens, wild beauty',
    signature: 'undiscovered Bowland wilderness'
  },
  cumbria: {
    topography: 'Lake District mountains, mirror lakes, valleys',
    naturalFeatures: 'dramatic fells, still tarns, whitewashed farms',
    atmosphere: 'mountain light through clouds, perfect lake reflections',
    signature: 'Wordsworth\'s lakes and romantic fells'
  },
  northumberland: {
    topography: 'Cheviot Hills, wild Northumbrian coast',
    naturalFeatures: 'empty beaches, dark sky wilderness, Roman wall',
    atmosphere: 'wild northern light, dramatic empty skies',
    signature: 'England\'s wild frontier and darkest skies'
  },
  durham: {
    topography: 'Durham Dales, Pennine foothills, Wear Valley',
    naturalFeatures: 'lead mining heritage, moorland streams, hay meadows',
    atmosphere: 'atmospheric northern light, ancient landscape',
    signature: 'Prince Bishops\' county and high dales'
  },

  // Scotland
  scotland: {
    topography: 'Highland mountains, glens, island archipelagos',
    naturalFeatures: 'lochs, heather moorland, ancient Caledonian pine',
    atmosphere: 'dramatic Highland light, mist swirling in glens',
    signature: 'wild Highland grandeur and Celtic mystery'
  },
  highland: {
    topography: 'dramatic Munro peaks, sea lochs, vast moors',
    naturalFeatures: 'ancient pine forest, red deer, wild Atlantic coast',
    atmosphere: 'ethereal mountain light, weather drama, elemental force',
    signature: 'last wilderness of Western Europe'
  },
  borders: {
    topography: 'Scottish Borders rolling hills, river valleys',
    naturalFeatures: 'sheep-grazed hills, abbey ruins, winding rivers',
    atmosphere: 'soft pastoral light, peaceful valley tranquility',
    signature: 'Walter Scott country and wool towns'
  },
  fife: {
    topography: 'Fife coastal kingdom, rolling farmland',
    naturalFeatures: 'fishing villages, East Neuk harbors, golf links',
    atmosphere: 'bright coastal light, North Sea horizon, fresh breeze',
    signature: 'ancient kingdom between two firths'
  },

  // Wales
  wales: {
    topography: 'Snowdonia peaks, green valleys, rugged coast',
    naturalFeatures: 'mountain lakes, dragon country, sheep-dotted hills',
    atmosphere: 'dramatic mountain light, Celtic mystery, ancient legend',
    signature: 'land of song and mountain grandeur'
  },
  pembrokeshire: {
    topography: 'Pembrokeshire coastal path, hidden coves',
    naturalFeatures: 'wild cliffs, sea bird colonies, Celtic coastline',
    atmosphere: 'Atlantic light, dramatic coastal weather, wild energy',
    signature: 'Britain\'s only coastal national park'
  },
  powys: {
    topography: 'Brecon Beacons, Cambrian Mountains, Wye Valley',
    naturalFeatures: 'waterfalls, red kites soaring, green uplands',
    atmosphere: 'mountain mist, green valley light, Welsh silence',
    signature: 'green heart of Wales and kite country'
  },
  gwynedd: {
    topography: 'Snowdonia peaks, dramatic mountain coastline',
    naturalFeatures: 'Eryri wilderness, slate heritage, mountain lakes',
    atmosphere: 'dramatic mountain weather, mythical Arthurian landscape',
    signature: 'highest peaks of Wales and mythic landscape'
  },

  // Northern Ireland
  antrim: {
    topography: 'Antrim Coast, dramatic basalt cliffs, green glens',
    naturalFeatures: 'Giants Causeway columns, nine glens, coastal path',
    atmosphere: 'wild Atlantic light, ancient geological drama',
    signature: 'legendary causeway coast and green glens'
  },
  down: {
    topography: 'Mourne Mountains sweeping to sea, drumlin landscape',
    naturalFeatures: 'granite peaks, Strangford Lough, fishing villages',
    atmosphere: 'dramatic Irish light, mountains meeting sea',
    signature: 'where the Mountains of Mourne sweep down to the sea'
  }
}

/**
 * Default Landscape for counties not in detailed list
 */
const DEFAULT_LANDSCAPE = {
  topography: 'rolling British countryside, pastoral farmland',
  naturalFeatures: 'ancient hedgerows, wildflower meadows, woodland copses',
  atmosphere: 'soft English light, peaceful rural tranquility',
  signature: 'quintessential British countryside'
}

/**
 * Cinematic Composition Templates
 */
const CINEMATIC_COMPOSITIONS = [
  // Classic landscape rule of thirds
  'rule of thirds composition with foreground interest leading to horizon, classic landscape photography',
  // Wide panoramic
  'wide cinematic panorama capturing the sweep of landscape, epic scale, travel photography',
  // Intimate vista
  'intimate corner of landscape with depth layers, foreground texture leading to atmospheric distance',
  // Dramatic weather
  'weather drama composition with dramatic sky dominating frame, landscape anchoring bottom third'
]

interface CountyImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  /** Include safe zone for text overlays */
  safeZone?: boolean
  /** Season hint (spring, summer, autumn, winter) or month (1-12) */
  season?: string
  month?: number
  /** Composition variation (1-4) */
  composition?: number
}

/**
 * CountyImageGenerator - "Atmospheric Almanac" Template
 *
 * Generates cinematic British landscape photography using
 * Forensic Photography Prompting.
 */
export class CountyImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  /**
   * Generate god-tier landscape photography for a UK county
   * Cinematic realism meets editorial quality
   */
  async generateCountyImage(
    countyName: string,
    countySlug: string,
    options: CountyImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating Atmospheric Almanac county image', { countyName, countySlug })

      const width = options.width ?? 2048
      const height = options.height ?? 1152 // 16:9 cinematic aspect
      const seed = options.seed ?? this.hashString(countySlug)
      const prompt = this.createAtmosphericAlmanacPrompt(countyName, countySlug, options)

      imageGenLogger.debug('Atmospheric Almanac prompt created', {
        promptPreview: prompt.substring(0, 200)
      })

      // Try Runware first (Flux.2 [dev] for best realism)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

      // Fallback to Pollinations
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { countyName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('Atmospheric Almanac image generated', { countyName, bytes: imageBuffer.length })
        return imageBuffer
      }

      imageGenLogger.warn('County image generation returned null', { countyName })
      return null
    } catch (error) {
      imageGenLogger.error('County image generation failed', { countyName }, error as Error)
      return null
    }
  }

  /**
   * Create "Atmospheric Almanac" Prompt
   *
   * Forensic Photography Prompting that captures authentic British landscape
   * with cinematic drama and documentary realism.
   */
  private createAtmosphericAlmanacPrompt(
    countyName: string,
    countySlug: string,
    options: CountyImageOptions
  ): string {
    const hash = this.hashString(countySlug)

    // Get county landscape DNA
    const landscape = this.getCountyLandscape(countySlug, countyName)

    // Get seasonal lighting
    const month = options.month ?? new Date().getMonth() + 1
    const seasonalLight = BRITISH_SEASONAL_LIGHT[month]

    // Select composition
    const compositionIndex = (options.composition ?? hash) % CINEMATIC_COMPOSITIONS.length
    const composition = CINEMATIC_COMPOSITIONS[compositionIndex]

    // Build forensic photography prompt
    const promptParts = [
      // Subject and location
      `Atmospheric ${countyName} landscape, British countryside photography`,
      landscape.signature,

      // Topography and natural features
      landscape.topography,
      landscape.naturalFeatures,

      // Technical camera specs (forces AI to think like a camera)
      '35mm prime lens, f/8 aperture for landscape depth',
      'sharp focus from foreground to horizon, hyperfocal distance',
      'no lens distortion, natural perspective, perfectly level horizon',

      // Lighting (British seasonal atmospheric)
      'natural light only, no artificial lighting',
      seasonalLight,
      landscape.atmosphere,

      // Composition
      composition,

      // Authenticity markers
      'no buildings, no man-made structures in frame',
      'natural British wilderness, authentic landscape',
      'real film grain texture, authentic photographic quality',

      // Quality markers
      'high-end travel photography, British landscape calendar quality',
      'editorial landscape photography, National Trust publication aesthetic',
      'cinematic widescreen composition, documentary realism',

      // Safe zone for text overlay
      options.safeZone
        ? 'subtle natural vignette with low-detail sky area in top-left quadrant for text overlay'
        : undefined,

      // Additional style hint
      options.styleHint
    ].filter(Boolean)

    return promptParts.join(', ')
  }

  /**
   * Match county slug/name to landscape DNA
   */
  private getCountyLandscape(countySlug: string, countyName: string): typeof DEFAULT_LANDSCAPE {
    const slugLower = countySlug.toLowerCase()
    const nameLower = countyName.toLowerCase()

    // Direct match
    for (const [key, value] of Object.entries(COUNTY_LANDSCAPE_DNA)) {
      if (slugLower.includes(key) || nameLower.includes(key)) {
        return value
      }
    }

    // Partial matches for compound names
    if (slugLower.includes('lake') || slugLower.includes('cumbri')) {
      return COUNTY_LANDSCAPE_DNA['cumbria']
    }
    if (slugLower.includes('york')) {
      return COUNTY_LANDSCAPE_DNA['yorkshire']
    }
    if (slugLower.includes('corn')) {
      return COUNTY_LANDSCAPE_DNA['cornwall']
    }
    if (slugLower.includes('cotswold')) {
      return COUNTY_LANDSCAPE_DNA['gloucestershire']
    }
    if (slugLower.includes('peak')) {
      return COUNTY_LANDSCAPE_DNA['derbyshire']
    }
    if (slugLower.includes('high')) {
      return COUNTY_LANDSCAPE_DNA['highland']
    }
    if (slugLower.includes('snowdon') || slugLower.includes('eryri')) {
      return COUNTY_LANDSCAPE_DNA['gwynedd']
    }

    return DEFAULT_LANDSCAPE
  }

  /**
   * Generate images for multiple counties
   */
  async generateBatch(
    counties: Array<{ name: string; slug: string }>,
    options: CountyImageOptions = {}
  ): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>()

    for (let i = 0; i < counties.length; i++) {
      const county = counties[i]
      imageGenLogger.info(`Generating ${i + 1}/${counties.length}: ${county.name}`)

      const buffer = await this.generateCountyImage(county.name, county.slug, options)
      if (buffer) {
        results.set(county.slug, buffer)
      }

      // Rate limiting between requests
      if (i < counties.length - 1) {
        await this.sleep(1000)
      }
    }

    return results
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
        negativePrompt: ATMOSPHERIC_ALMANAC_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated Atmospheric Almanac image', { bytes: buffer.length })
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

      const fullPrompt = `${prompt}, Negative: ${ATMOSPHERIC_ALMANAC_NEGATIVE}`
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated Atmospheric Almanac image', { bytes: response.data.length })
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
