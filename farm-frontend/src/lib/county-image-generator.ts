/**
 * County Image Generator
 *
 * Generates atmospheric landscape photography for UK county cards using Runware.
 * Implements the Harvest Visual Signature: "Atmospheric Almanac" aesthetic.
 *
 * @see https://docs.runware.ai/
 */

import axios from 'axios'
import { logger } from '@/lib/logger'
import { getRunwareClient, HARVEST_STYLE } from './runware-client'

const imageGenLogger = logger.child({ route: 'lib/county-image-generator' })

/**
 * Harvest Visual Signature: Atmospheric Almanac
 * British countryside landscape photography for county directory cards
 */
const HARVEST_COUNTY_NEGATIVE = [
  'no people, no faces, no crowds',
  'no watermark, no text, no logo',
  'no modern buildings, no cars, no roads',
  'no AI artifacts, no unrealistic colors',
  'no harsh shadows, no artificial lighting',
  'no urban elements, no power lines'
].join(', ')

/**
 * UK county landscape characteristics
 * Authentic topography and natural features for each region
 */
const COUNTY_LANDSCAPES: Record<string, {
  terrain: string
  features: string
  atmosphere: string
}> = {
  // South West
  cornwall: {
    terrain: 'dramatic Cornish cliffs and rugged coastline',
    features: 'wild Atlantic ocean, granite tors, fishing coves',
    atmosphere: 'misty coastal morning, salt spray in the air'
  },
  devon: {
    terrain: 'rolling Devonshire hills and lush green valleys',
    features: 'Dartmoor tors, thatched villages, red earth lanes',
    atmosphere: 'soft golden light through morning mist'
  },
  somerset: {
    terrain: 'Somerset Levels wetlands and Mendip Hills',
    features: 'willow-lined rhynes, cider orchards, ancient churches',
    atmosphere: 'ethereal morning fog over flat marshlands'
  },
  dorset: {
    terrain: 'Jurassic Coast chalk cliffs and rolling downs',
    features: 'Durdle Door arch, Thomas Hardy landscapes, heathland',
    atmosphere: 'dramatic coastal light, white cliffs catching sun'
  },
  wiltshire: {
    terrain: 'Salisbury Plain chalk downland',
    features: 'ancient standing stones, rolling wheat fields, white horses',
    atmosphere: 'mystical morning light over ancient landscape'
  },

  // Cotswolds & Heart of England
  gloucestershire: {
    terrain: 'Cotswold escarpment and golden limestone villages',
    features: 'honey-stone cottages, dry stone walls, beech woodlands',
    atmosphere: 'warm afternoon light on golden stone'
  },
  oxfordshire: {
    terrain: 'Chiltern Hills and Thames Valley meadows',
    features: 'dreaming spires in distance, water meadows, willows',
    atmosphere: 'gentle English summer afternoon'
  },
  warwickshire: {
    terrain: 'gentle Warwickshire countryside and Avon valley',
    features: 'Shakespeare country, timber-framed villages, hedgerows',
    atmosphere: 'soft pastoral light over green fields'
  },
  worcestershire: {
    terrain: 'Malvern Hills ridge and Vale of Evesham',
    features: 'dramatic hill views, fruit orchards, hop yards',
    atmosphere: 'misty morning over orchard valleys'
  },
  herefordshire: {
    terrain: 'Black Mountains foothills and Wye Valley',
    features: 'cider apple orchards, half-timbered farms, meandering river',
    atmosphere: 'golden autumn light through apple trees'
  },

  // South East
  kent: {
    terrain: 'Garden of England rolling countryside',
    features: 'oast houses, hop gardens, orchards, white cliffs',
    atmosphere: 'warm summer light over fruit-laden orchards'
  },
  sussex: {
    terrain: 'South Downs chalk grassland and weald',
    features: 'rolling downs, flint villages, coastal views',
    atmosphere: 'bright downland light, big sky country'
  },
  surrey: {
    terrain: 'Surrey Hills wooded ridges and heathland',
    features: 'ancient woodlands, sandy commons, village greens',
    atmosphere: 'dappled woodland light through beech canopy'
  },
  hampshire: {
    terrain: 'New Forest heathland and Test Valley',
    features: 'wild ponies, ancient oaks, thatched cottages',
    atmosphere: 'misty forest morning, shafts of sunlight'
  },
  berkshire: {
    terrain: 'Thames Valley and Berkshire Downs',
    features: 'riverside meadows, ancient woodlands, racehorse country',
    atmosphere: 'soft river valley light at dawn'
  },

  // East Anglia
  norfolk: {
    terrain: 'vast Norfolk skies and flat fenland',
    features: 'windmills, reed beds, Broads waterways, flint churches',
    atmosphere: 'dramatic big sky, endless horizon'
  },
  suffolk: {
    terrain: 'gentle Suffolk countryside and Heritage Coast',
    features: 'pink-washed cottages, Constable country, estuaries',
    atmosphere: 'soft diffused light, painterly quality'
  },
  essex: {
    terrain: 'Essex marshes and rolling farmland',
    features: 'weatherboard villages, Thames estuary, ancient woodland',
    atmosphere: 'moody estuary light, atmospheric sky'
  },
  cambridgeshire: {
    terrain: 'Cambridgeshire Fens and gently rolling chalk',
    features: 'cathedral silhouette, endless fields, drainage channels',
    atmosphere: 'vast sky over flat productive land'
  },

  // Midlands
  lincolnshire: {
    terrain: 'Lincolnshire Wolds and fenland',
    features: 'church spires, market towns, endless arable fields',
    atmosphere: 'big sky country, dramatic cloud formations'
  },
  nottinghamshire: {
    terrain: 'Sherwood Forest and Trent Valley',
    features: 'ancient oak woodland, river meadows, red brick villages',
    atmosphere: 'dappled forest light, Robin Hood country'
  },
  derbyshire: {
    terrain: 'Peak District limestone dales and gritstone edges',
    features: 'dramatic crags, dry stone walls, lead mining heritage',
    atmosphere: 'dramatic moorland light, clouds over peaks'
  },
  staffordshire: {
    terrain: 'Staffordshire Moorlands and Trent Valley',
    features: 'pottery country, canal network, rolling farmland',
    atmosphere: 'soft Midlands light over green pastures'
  },
  shropshire: {
    terrain: 'Shropshire Hills and Welsh Marches',
    features: 'Long Mynd ridge, timber-framed market towns',
    atmosphere: 'mystical borderland light, ancient hillforts'
  },

  // North
  yorkshire: {
    terrain: 'Yorkshire Dales limestone and moorland',
    features: 'dry stone walls, waterfalls, grey stone villages',
    atmosphere: 'dramatic dale light, clouds over moors'
  },
  lancashire: {
    terrain: 'Forest of Bowland and Ribble Valley',
    features: 'rolling fells, stone villages, river valleys',
    atmosphere: 'moody Pennine light, rain-washed greens'
  },
  cumbria: {
    terrain: 'Lake District mountains and lakes',
    features: 'dramatic fells, mirror lakes, whitewashed farms',
    atmosphere: 'mountain light through clouds, reflections'
  },
  northumberland: {
    terrain: 'Cheviot Hills and Northumbrian coast',
    features: 'castle ruins, empty beaches, dark sky country',
    atmosphere: 'wild northern light, dramatic skies'
  },
  durham: {
    terrain: 'Durham Dales and Pennine foothills',
    features: 'cathedral city, lead mining heritage, moorland',
    atmosphere: 'atmospheric northern light, ancient landscape'
  },

  // Scotland
  scotland: {
    terrain: 'Scottish Highlands and glens',
    features: 'lochs, mountains, heather moorland, castles',
    atmosphere: 'dramatic Highland light, mist in glens'
  },
  highland: {
    terrain: 'dramatic Highland mountains and sea lochs',
    features: 'munros, whisky distilleries, crofting landscape',
    atmosphere: 'ethereal mountain light, weather drama'
  },
  borders: {
    terrain: 'Scottish Borders rolling hills',
    features: 'abbey ruins, wool towns, river valleys',
    atmosphere: 'soft pastoral light, peaceful valleys'
  },
  fife: {
    terrain: 'Fife coastal kingdom and farmland',
    features: 'fishing villages, golf courses, East Neuk charm',
    atmosphere: 'bright coastal light, North Sea horizon'
  },

  // Wales
  wales: {
    terrain: 'Welsh mountains and green valleys',
    features: 'Snowdonia peaks, castles, sheep-dotted hills',
    atmosphere: 'dramatic mountain light, Celtic mystery'
  },
  pembrokeshire: {
    terrain: 'Pembrokeshire coastal path and islands',
    features: 'wild cliffs, sea birds, hidden coves',
    atmosphere: 'Atlantic light, dramatic coastal weather'
  },
  powys: {
    terrain: 'Brecon Beacons and Cambrian Mountains',
    features: 'waterfalls, red kites, market towns',
    atmosphere: 'mountain mist, green valley light'
  },
  gwynedd: {
    terrain: 'Snowdonia mountain peaks and coastline',
    features: 'dramatic peaks, slate quarries, Welsh heritage',
    atmosphere: 'dramatic mountain weather, mythical landscape'
  },

  // Northern Ireland
  antrim: {
    terrain: 'Antrim Coast and Glens',
    features: 'Giants Causeway, dramatic cliffs, green glens',
    atmosphere: 'wild Atlantic light, ancient geology'
  },
  down: {
    terrain: 'Mourne Mountains and coastal drumlin landscape',
    features: 'sweeping mountains to sea, fishing villages',
    atmosphere: 'dramatic Irish light, mountains and sea'
  }
}

/**
 * Default landscape for counties not in the detailed list
 */
const DEFAULT_LANDSCAPE = {
  terrain: 'rolling British countryside and pastoral farmland',
  features: 'hedgerows, country lanes, village church spires',
  atmosphere: 'soft English light, peaceful rural scene'
}

interface CountyImageOptions {
  width?: number
  height?: number
  styleHint?: string
  seed?: number
  /** Include safe zone for text overlays */
  safeZone?: boolean
  /** Season hint (spring, summer, autumn, winter) */
  season?: string
}

/**
 * CountyImageGenerator - Generate atmospheric county card images
 * Uses Runware Flux.2 [dev] with Pollinations as fallback
 */
export class CountyImageGenerator {
  private userAgent = 'FarmCompanion-Frontend/1.0.0'

  /**
   * Generate atmospheric landscape for a UK county
   */
  async generateCountyImage(
    countyName: string,
    countySlug: string,
    options: CountyImageOptions = {}
  ): Promise<Buffer | null> {
    try {
      imageGenLogger.info('Generating county image', { countyName, countySlug })

      const width = options.width ?? 2048
      const height = options.height ?? 1152 // 16:9 aspect for cards
      const seed = options.seed ?? this.hashString(countySlug)
      const prompt = this.createCountyPrompt(countyName, countySlug, options)

      imageGenLogger.debug('Prompt created', { promptPreview: prompt.substring(0, 120) })

      // Try Runware first (60% cheaper, 40% faster)
      let imageBuffer = await this.callRunware(prompt, { width, height, seed })

      // Fallback to Pollinations
      if (!imageBuffer) {
        imageGenLogger.info('Falling back to Pollinations', { countyName })
        imageBuffer = await this.callPollinations(prompt, { width, height, seed, maxAttempts: 3 })
      }

      if (imageBuffer) {
        imageGenLogger.info('County image generated successfully', { countyName, bytes: imageBuffer.length })
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
   * Create Harvest Visual Signature prompt for county cards
   * "Atmospheric Almanac" - evocative British landscape photography
   */
  private createCountyPrompt(
    countyName: string,
    countySlug: string,
    options: CountyImageOptions
  ): string {
    // Find matching landscape characteristics
    const slugLower = countySlug.toLowerCase()
    let landscape = DEFAULT_LANDSCAPE

    for (const [key, value] of Object.entries(COUNTY_LANDSCAPES)) {
      if (slugLower.includes(key) || countyName.toLowerCase().includes(key)) {
        landscape = value
        break
      }
    }

    // Seasonal variations
    const seasonalHints: Record<string, string> = {
      spring: 'fresh spring growth, blossom on trees, new lambs in fields',
      summer: 'lush summer greenery, golden crops, warm hazy light',
      autumn: 'golden autumn colors, harvest time, misty mornings',
      winter: 'frost on fields, bare trees, low winter sun'
    }

    const season = options.season || this.getCurrentSeason()
    const seasonalHint = seasonalHints[season] || seasonalHints.summer

    const parts = [
      `${countyName} countryside landscape`,
      landscape.terrain,
      landscape.features,
      HARVEST_STYLE.camera,
      landscape.atmosphere,
      seasonalHint,
      'editorial landscape photography',
      'authentic British countryside',
      'National Geographic quality',
      options.safeZone ? 'darkened vignette in top-left for text overlay' : undefined,
      options.styleHint
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Get current season based on month
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
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
        negativePrompt: HARVEST_COUNTY_NEGATIVE,
        width: opts.width,
        height: opts.height,
        seed: opts.seed,
        steps: 28,
        cfgScale: 3.5,
        outputFormat: 'webp'
      })

      if (buffer) {
        imageGenLogger.info('Runware generated county image', { bytes: buffer.length })
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

      const fullPrompt = `${prompt}, Negative: ${HARVEST_COUNTY_NEGATIVE}`
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?${params.toString()}`

      try {
        imageGenLogger.debug('Pollinations attempt', { attempt: i + 1, maxAttempts: opts.maxAttempts })

        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        })

        if (response.status >= 200 && response.status < 300 && response.data?.length > 0) {
          imageGenLogger.info('Pollinations generated county image', { bytes: response.data.length })
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
