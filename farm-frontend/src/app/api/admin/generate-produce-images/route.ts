import { NextRequest, NextResponse } from 'next/server'
import { PRODUCE } from '@/data/produce'
import { ProduceImageGenerator } from '@/lib/produce-image-generator'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError, errors } from '@/lib/errors'

const logger = createRouteLogger('admin/generate-produce-images')

// Simple API key auth - set ADMIN_API_KEY in your environment
function checkApiKey(request: NextRequest): boolean {
  const apiKey = process.env.ADMIN_API_KEY
  if (!apiKey) return true // No key configured = allow (dev mode)

  const providedKey = request.headers.get('x-api-key') ||
                      new URL(request.url).searchParams.get('apiKey')
  return providedKey === apiKey
}

// Specific prompts for produce that need extra detail to avoid confusion
// Each prompt must clearly describe the actual food item
const PRODUCE_SPECIFIC_PROMPTS: Record<string, string> = {
  'kale': 'Fresh curly kale leaves, dark green leafy vegetable with ruffled edges, NOT broccoli, showing the characteristic wavy leaf structure',
  'purple-sprouting-broccoli': 'Purple sprouting broccoli with thin purple-green stems and small purple florets, British spring vegetable',
  'leeks': 'Fresh whole leeks with white and light green stalks, long cylindrical allium vegetable',
  'asparagus': 'Fresh green asparagus spears with tight purple-green tips, spring vegetable',
  'beetroot': 'Fresh raw beetroot with deep purple-red skin, root vegetable with leafy tops',
  'parsnips': 'Fresh parsnips, cream-colored root vegetables, similar shape to carrots but white',
  'swede': 'Fresh swede root vegetable, round with purple and cream skin, also called rutabaga',
  'celeriac': 'Fresh celeriac root, knobbly cream-colored root vegetable, celery root',
  'chard': 'Fresh Swiss chard leaves with colorful stems, leafy green vegetable',
  'spring-greens': 'Fresh spring greens, loose-leafed cabbage, bright green leafy vegetable',
  'cavolo-nero': 'Cavolo nero, dark green Italian kale with long crinkled leaves, Tuscan kale',
  'pak-choi': 'Fresh pak choi, Chinese cabbage with white stems and dark green leaves',
  'turnips': 'Fresh turnips, round root vegetables with white and purple skin',
  'kohlrabi': 'Fresh kohlrabi, pale green or purple bulb vegetable above ground',
  'artichokes': 'Fresh globe artichokes, large green flower bud vegetable',
  'broad-beans': 'Fresh broad beans in their pods, green fava beans',
  'runner-beans': 'Fresh runner beans, long flat green bean pods',
  'french-beans': 'Fresh French beans, thin tender green beans',
  'mangetout': 'Fresh mangetout peas, flat edible pea pods, snow peas',
  'rhubarb': 'Fresh rhubarb stalks, long pink-red stalks with green leaves',
  'gooseberries': 'Fresh gooseberries, small green oval berries',
  'blackcurrants': 'Fresh blackcurrants, small dark purple berries in clusters',
  'redcurrants': 'Fresh redcurrants, small translucent red berries in clusters',
  'damsons': 'Fresh damsons, small dark purple stone fruits',
  'greengages': 'Fresh greengages, small green-yellow stone fruits, type of plum',
  'medlars': 'Fresh medlars, small brown apple-like fruits',
  'quince': 'Fresh quince fruit, large yellow pear-shaped fruit',
  'courgettes': 'Fresh courgettes, dark green zucchini squash',
  'marrows': 'Fresh marrow, large green striped squash vegetable',
  'pumpkins': 'Fresh pumpkin, large orange round squash',
  'squash': 'Fresh butternut squash, tan-colored gourd-shaped vegetable',
}

/**
 * POST /api/admin/generate-produce-images
 *
 * Generate AI images for produce items.
 *
 * Query params:
 * - slug: Specific produce slug to generate (optional, generates all if not specified)
 * - count: Number of variations per item (default: 2, max: 4)
 * - force: If "true", regenerate even if images exist
 */
export async function POST(request: NextRequest) {
  try {
    if (!checkApiKey(request)) {
      throw errors.authentication('Invalid API key')
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const count = Math.min(parseInt(searchParams.get('count') || '2'), 4)
    const force = searchParams.get('force') === 'true'

    logger.info('Starting produce image generation', { slug, count, force })

    // Filter produce items
    const produceItems = slug
      ? PRODUCE.filter(p => p.slug === slug)
      : PRODUCE

    if (produceItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No produce found with slug: ${slug}`
      }, { status: 404 })
    }

    const generator = new ProduceImageGenerator()
    const results: Array<{
      slug: string
      name: string
      success: boolean
      urls?: string[]
      error?: string
    }> = []

    for (const produce of produceItems) {
      try {
        logger.info(`Processing: ${produce.name}`)

        // Check if images already exist
        if (!force && produce.images && produce.images.length > 0) {
          logger.info(`Skipping ${produce.name} - already has ${produce.images.length} images`)
          results.push({
            slug: produce.slug,
            name: produce.name,
            success: true,
            urls: produce.images.map(img => img.src)
          })
          continue
        }

        // Generate variations with specific prompt if available
        const specificPrompt = PRODUCE_SPECIFIC_PROMPTS[produce.slug]
        const urls: string[] = []

        for (let i = 1; i <= count; i++) {
          logger.info(`Generating variation ${i}/${count} for ${produce.name}`)

          const buffer = await generator.generateProduceImage(
            specificPrompt || produce.name,
            produce.slug,
            { seed: hashString(`${produce.slug}-${i}`) }
          )

          if (buffer) {
            const url = await generator.uploadImage(
              buffer,
              produce.slug,
              i,
              produce.name,
              force
            )
            urls.push(url)
            logger.info(`Uploaded variation ${i} for ${produce.name}`, { url })
          }
        }

        results.push({
          slug: produce.slug,
          name: produce.name,
          success: urls.length > 0,
          urls
        })

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error(`Failed to generate images for ${produce.name}`, { error: message })
        results.push({
          slug: produce.slug,
          name: produce.name,
          success: false,
          error: message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    logger.info('Produce image generation complete', { successCount, failureCount })

    // Generate TypeScript snippet for updating produce.ts
    const tsSnippet = results
      .filter(r => r.success && r.urls && r.urls.length > 0)
      .map(r => {
        const imageArray = r.urls!.map((url, i) =>
          `      { src: '${url}', alt: 'Fresh ${r.name.toLowerCase()} - variation ${i + 1}' }`
        ).join(',\n')
        return `  // ${r.name}\n  images: [\n${imageArray}\n  ],`
      })
      .join('\n\n')

    return NextResponse.json({
      success: true,
      message: `Generated images for ${successCount} produce items, ${failureCount} failures`,
      processed: results.length,
      results,
      tsSnippet: tsSnippet || null
    })

  } catch (error) {
    return handleApiError(error, 'admin/generate-produce-images')
  }
}

/**
 * GET /api/admin/generate-produce-images
 *
 * Get stats on produce items and their images.
 */
export async function GET(request: NextRequest) {
  try {
    if (!checkApiKey(request)) {
      throw errors.authentication('Invalid API key')
    }

    const produceStats = PRODUCE.map(p => ({
      slug: p.slug,
      name: p.name,
      imageCount: p.images?.length || 0,
      hasImages: (p.images?.length || 0) > 0,
      monthsInSeason: p.monthsInSeason
    }))

    const withImages = produceStats.filter(p => p.hasImages).length
    const withoutImages = produceStats.filter(p => !p.hasImages).length

    return NextResponse.json({
      totalProduce: PRODUCE.length,
      withImages,
      withoutImages,
      produce: produceStats
    })

  } catch (error) {
    return handleApiError(error, 'admin/generate-produce-images')
  }
}

// Simple hash function for seed generation
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}
