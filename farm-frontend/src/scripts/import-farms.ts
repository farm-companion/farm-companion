#!/usr/bin/env tsx
/**
 * Import farms from pipeline JSON to PostgreSQL
 *
 * This script bridges the farm-pipeline output to the live database.
 * It handles upserts, category mapping, and image record creation.
 *
 * Usage:
 *   pnpm tsx src/scripts/import-farms.ts [options]
 *
 * Options:
 *   --source=<path|url>  Source JSON file or URL (default: ../farm-pipeline/farms.uk.json)
 *   --dry-run            Preview changes without writing to database
 *   --limit=<n>          Process only first N farms
 *   --force              Overwrite existing farm data
 *   --skip-images        Skip creating image records
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient, Prisma } from '@prisma/client'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

// =============================================================================
// TYPES
// =============================================================================

interface PipelineLocation {
  lat: number
  lng: number
  address: string
  city?: string
  county: string
  postcode: string
}

interface PipelineContact {
  phone?: string
  email?: string
  website?: string
}

interface PipelineGooglePhoto {
  reference: string
  width?: number
  height?: number
  attributions?: string[]
}

interface PipelineOpeningHour {
  day: string
  open?: string
  close?: string
}

interface PipelineFarm {
  id: string
  name: string
  slug: string
  description?: string
  location: PipelineLocation
  contact: PipelineContact
  offerings: string[]
  hours: PipelineOpeningHour[]
  images: string[]
  google_photos?: PipelineGooglePhoto[]
  verified: boolean
  rating?: number
  user_ratings_total?: number
  price_level?: number
  place_id?: string
  types: string[]
}

interface Options {
  source: string
  dryRun: boolean
  limit?: number
  force: boolean
  skipImages: boolean
}

interface ImportStats {
  total: number
  created: number
  updated: number
  skipped: number
  errors: number
  imagesCreated: number
  categoriesLinked: number
}

// =============================================================================
// CATEGORY MAPPING
// =============================================================================

// Map pipeline offerings to database category slugs
const OFFERING_TO_CATEGORY_SLUG: Record<string, string> = {
  // Produce
  'Vegetables': 'vegetable-farms',
  'Veg Boxes': 'veg-box-schemes',
  'Fruit': 'fruit-farms',
  'Apples': 'fruit-farms',
  'Berries': 'fruit-farms',
  'Strawberries': 'pick-your-own',
  // Meat & Dairy
  'Meat': 'meat-producers',
  'Beef': 'meat-producers',
  'Lamb': 'meat-producers',
  'Pork': 'meat-producers',
  'Poultry': 'meat-producers',
  'Chicken': 'meat-producers',
  'Butchery': 'meat-producers',
  'Cheese': 'cheese-makers',
  'Dairy': 'dairy-farms',
  'Milk': 'dairy-farms',
  'Cream': 'dairy-farms',
  'Eggs': 'free-range-eggs',
  'Free Range': 'free-range-eggs',
  // Specialty
  'Honey': 'honey-beekeeping',
  'Jams & Preserves': 'preserves-jams',
  'Cider': 'cider-apple-juice',
  'Juice': 'cider-apple-juice',
  'Wine': 'vineyards',
  'Beer': 'breweries-distilleries',
  'Alcohol': 'breweries-distilleries',
  // Activities
  'Pick Your Own': 'pick-your-own',
  'Cafe': 'farm-cafes',
  'Coffee': 'farm-cafes',
  'Tea Room': 'farm-cafes',
  'Restaurant': 'farm-cafes',
  // Other
  'Organic': 'organic-farms',
  'Plants': 'plant-nurseries',
  'Plant Nursery': 'plant-nurseries',
  'Flowers': 'cut-flowers',
  'Christmas Trees': 'christmas-trees',
  'Pumpkins': 'pumpkin-patches',
  'Groceries': 'farm-shops',
  'Bakery': 'bakeries-flour-mills',
  'Baked Goods': 'bakeries-flour-mills',
}

// =============================================================================
// HELPERS
// =============================================================================

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {
    source: resolve(process.cwd(), '../farm-pipeline/farms.uk.json'),
    dryRun: false,
    force: false,
    skipImages: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1]
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--skip-images') {
      options.skipImages = true
    }
  }

  return options
}

async function loadFarms(source: string): Promise<PipelineFarm[]> {
  let content: string

  if (source.startsWith('http://') || source.startsWith('https://')) {
    console.log(`📥 Fetching from URL: ${source}`)
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    content = await response.text()
  } else {
    const filePath = resolve(source)
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    console.log(`📂 Loading from file: ${filePath}`)
    content = await readFile(filePath, 'utf-8')
  }

  return JSON.parse(content)
}

function generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
  let slug = baseSlug
  let counter = 1

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  existingSlugs.add(slug)
  return slug
}

function isValidCoordinate(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

// =============================================================================
// MAIN IMPORT LOGIC
// =============================================================================

async function importFarms() {
  const options = parseArgs()
  const stats: ImportStats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    imagesCreated: 0,
    categoriesLinked: 0,
  }

  console.log('🌾 Farm Companion - Pipeline Import Script')
  console.log('='.repeat(60))
  console.log(`📋 Mode: ${options.dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.log(`📋 Force overwrite: ${options.force}`)
  console.log(`📋 Skip images: ${options.skipImages}`)
  if (options.limit) console.log(`📋 Limit: ${options.limit} farms`)
  console.log('')

  try {
    // Load farms from source
    let farms = await loadFarms(options.source)
    stats.total = farms.length
    console.log(`📊 Loaded ${farms.length} farms from pipeline`)

    // Apply limit if specified
    if (options.limit && options.limit < farms.length) {
      farms = farms.slice(0, options.limit)
      console.log(`📊 Processing first ${options.limit} farms`)
    }

    // Load existing categories for mapping
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true },
    })
    const categoryBySlug = new Map(categories.map(c => [c.slug, c.id]))
    console.log(`📊 Found ${categories.length} categories in database`)

    // Load existing farms for duplicate detection
    const existingFarms = await prisma.farm.findMany({
      select: { id: true, slug: true, googlePlaceId: true },
    })
    const farmByPlaceId = new Map(
      existingFarms.filter(f => f.googlePlaceId).map(f => [f.googlePlaceId, f])
    )
    const farmBySlug = new Map(existingFarms.map(f => [f.slug, f]))
    const existingSlugs = new Set(existingFarms.map(f => f.slug))
    console.log(`📊 Found ${existingFarms.length} existing farms in database`)
    console.log('')

    // Process each farm
    for (let i = 0; i < farms.length; i++) {
      const farm = farms[i]
      const progress = `[${i + 1}/${farms.length}]`

      try {
        // Validate coordinates
        if (!isValidCoordinate(farm.location.lat, farm.location.lng)) {
          console.log(`${progress} ⚠️  Skipping ${farm.name}: Invalid coordinates`)
          stats.skipped++
          continue
        }

        // Check for existing farm by Google Place ID or slug
        const existingByPlaceId = farm.place_id ? farmByPlaceId.get(farm.place_id) : null
        const existingBySlug = farmBySlug.get(farm.slug)
        const existing = existingByPlaceId || existingBySlug

        if (existing && !options.force) {
          console.log(`${progress} ⊘ Skipping ${farm.name}: Already exists (${existing.slug})`)
          stats.skipped++
          continue
        }

        // Generate unique slug if needed
        const slug = existing ? existing.slug : generateUniqueSlug(farm.slug, existingSlugs)

        // Prepare farm data
        const farmData: Prisma.FarmCreateInput = {
          name: farm.name,
          slug,
          description: farm.description || null,
          address: farm.location.address || '',
          city: farm.location.city || null,
          county: farm.location.county || '',
          postcode: farm.location.postcode || '',
          latitude: new Prisma.Decimal(farm.location.lat),
          longitude: new Prisma.Decimal(farm.location.lng),
          phone: farm.contact.phone || null,
          email: farm.contact.email || null,
          website: farm.contact.website || null,
          googlePlaceId: farm.place_id || null,
          googleRating: farm.rating ? new Prisma.Decimal(farm.rating) : null,
          googleReviewsCount: farm.user_ratings_total || 0,
          openingHours: farm.hours.length > 0 ? farm.hours : Prisma.JsonNull,
          verified: farm.verified,
          status: 'active',
        }

        if (options.dryRun) {
          console.log(`${progress} 🔍 Would ${existing ? 'update' : 'create'}: ${farm.name}`)
          if (existing) stats.updated++
          else stats.created++
        } else {
          // Upsert farm
          const upsertedFarm = await prisma.farm.upsert({
            where: { slug },
            create: farmData,
            update: {
              ...farmData,
              // Don't overwrite these on update unless forcing
              ...(options.force ? {} : {
                verified: undefined,
                status: undefined,
              }),
            },
          })

          // Link categories based on offerings
          if (farm.offerings && farm.offerings.length > 0) {
            const categoryIds = new Set<string>()
            for (const offering of farm.offerings) {
              const categorySlug = OFFERING_TO_CATEGORY_SLUG[offering]
              if (categorySlug) {
                const categoryId = categoryBySlug.get(categorySlug)
                if (categoryId) categoryIds.add(categoryId)
              }
            }

            // Always add "Farm Shops" category
            const farmShopsId = categoryBySlug.get('farm-shops')
            if (farmShopsId) categoryIds.add(farmShopsId)

            // Create category links
            for (const categoryId of categoryIds) {
              try {
                await prisma.farmCategory.upsert({
                  where: {
                    farmId_categoryId: {
                      farmId: upsertedFarm.id,
                      categoryId,
                    },
                  },
                  create: {
                    farmId: upsertedFarm.id,
                    categoryId,
                  },
                  update: {},
                })
                stats.categoriesLinked++
              } catch {
                // Ignore duplicate category links
              }
            }
          }

          // Create image records for Google photos
          if (!options.skipImages && farm.google_photos && farm.google_photos.length > 0) {
            for (let j = 0; j < farm.google_photos.length; j++) {
              const photo = farm.google_photos[j]
              if (!photo.reference) continue

              try {
                // Check if image already exists
                const existingImage = await prisma.image.findFirst({
                  where: {
                    farmId: upsertedFarm.id,
                    googlePhotoRef: photo.reference,
                  },
                })

                if (!existingImage) {
                  await prisma.image.create({
                    data: {
                      farmId: upsertedFarm.id,
                      url: '', // Will be fetched on demand
                      altText: `${farm.name} farm shop`,
                      uploadedBy: 'pipeline',
                      status: 'approved',
                      source: 'google',
                      isHero: j === 0, // First photo is hero
                      displayOrder: j,
                      googlePhotoRef: photo.reference,
                      googleAttribution: photo.attributions?.join(', ') || null,
                    },
                  })
                  stats.imagesCreated++
                }
              } catch (imgError) {
                // Ignore image creation errors
                console.warn(`  ⚠️  Failed to create image for ${farm.name}`)
              }
            }
          }

          console.log(`${progress} ✅ ${existing ? 'Updated' : 'Created'}: ${farm.name}`)
          if (existing) stats.updated++
          else stats.created++
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`${progress} ❌ Error processing ${farm.name}: ${message}`)
        stats.errors++
      }
    }

    // Print summary
    console.log('')
    console.log('='.repeat(60))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total farms processed: ${stats.total}`)
    console.log(`✅ Created: ${stats.created}`)
    console.log(`🔄 Updated: ${stats.updated}`)
    console.log(`⊘ Skipped: ${stats.skipped}`)
    console.log(`❌ Errors: ${stats.errors}`)
    console.log(`🖼️  Images created: ${stats.imagesCreated}`)
    console.log(`🏷️  Categories linked: ${stats.categoriesLinked}`)

    if (options.dryRun) {
      console.log('')
      console.log('💡 This was a dry run. No changes were made.')
      console.log('   Run without --dry-run to apply changes.')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
importFarms().catch(error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
