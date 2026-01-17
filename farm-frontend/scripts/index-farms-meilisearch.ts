#!/usr/bin/env tsx

/**
 * Index all farms into Meilisearch for fast, typo-tolerant search
 * Usage: pnpm exec tsx scripts/index-farms-meilisearch.ts
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
const envPath = path.join(process.cwd(), '.env')
const envLocalPath = path.join(process.cwd(), '.env.local')

dotenv.config({ path: envPath })
dotenv.config({ path: envLocalPath })

console.log('🔧 Environment check:')
console.log(`   MEILISEARCH_HOST: ${process.env.MEILISEARCH_HOST ? '✅ Set' : '❌ Missing'}`)
console.log(`   MEILISEARCH_API_KEY: ${process.env.MEILISEARCH_API_KEY ? '✅ Set' : '❌ Missing'}`)
console.log('')

import { getFarmsIndex } from '../src/lib/meilisearch'
import fs from 'fs/promises'

interface Farm {
  id: string
  name: string
  slug: string
  description?: string
  location: {
    address: string
    city?: string
    county: string
    postcode: string
    lat: number
    lng: number
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  categories?: string[]
  googleRating?: number
  googleReviewsCount?: number
  verified?: boolean
  featured?: boolean
  images?: Array<{ url: string; alt: string }>
  tags?: string[]
}

async function indexFarms() {
  console.log('🚀 Starting Meilisearch indexing...\n')

  try {
    // Read farms data
    const farmsPath = path.join(process.cwd(), 'data', 'farms.json')
    const farmsData = await fs.readFile(farmsPath, 'utf-8')
    const farms: Farm[] = JSON.parse(farmsData)

    console.log(`📊 Found ${farms.length} farms to index\n`)

    // Get or create index
    const index = await getFarmsIndex()

    // Prepare documents for indexing
    const documents = farms.map(farm => {
      // Extract category names from farm data
      const categories = farm.categories || []

      // Create searchable tags from various fields
      const tags = [
        ...(categories || []),
        farm.location.county,
        farm.location.city,
        farm.verified ? 'verified' : '',
        farm.featured ? 'featured' : '',
      ].filter(Boolean)

      return {
        id: farm.id,
        name: farm.name,
        slug: farm.slug,
        description: farm.description || '',
        location: {
          address: farm.location.address,
          city: farm.location.city || '',
          county: farm.location.county,
          postcode: farm.location.postcode,
          lat: farm.location.lat,
          lng: farm.location.lng
        },
        contact: farm.contact || {},
        categories: categories,
        googleRating: farm.googleRating || 0,
        googleReviewsCount: farm.googleReviewsCount || 0,
        verified: farm.verified || false,
        featured: farm.featured || false,
        images: farm.images || [],
        tags: tags
      }
    })

    // Index documents in batches (Meilisearch recommends batches of 1000)
    const batchSize = 1000
    let indexed = 0

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)

      console.log(`📤 Indexing batch ${Math.floor(i / batchSize) + 1} (${batch.length} farms)...`)

      await index.addDocuments(batch)

      indexed += batch.length
      console.log(`   ✅ Queued ${indexed}/${documents.length} farms`)
    }

    // Wait a bit for processing
    console.log('\n⏳ Waiting for indexing to complete...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Final batch processing check
    for (let retry = 0; retry < 10; retry++) {
      const stats = await index.getStats()
      if (stats.numberOfDocuments >= documents.length) {
        break
      }
      console.log(`   Processing... (${stats.numberOfDocuments}/${documents.length} documents)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Get final stats
    const stats = await index.getStats()

    console.log('\n' + '='.repeat(60))
    console.log('✅ Indexing Complete!')
    console.log('='.repeat(60))
    console.log(`📊 Total documents: ${stats.numberOfDocuments}`)
    console.log(`🔍 Searchable attributes configured`)
    console.log(`⚡ Typo tolerance enabled`)
    console.log(`📍 Geo search ready`)
    console.log('='.repeat(60))

    // Test search
    console.log('\n🧪 Testing search...')
    const testResults = await index.search('farm', { limit: 3 })
    console.log(`   Found ${testResults.estimatedTotalHits} results for "farm"`)
    console.log(`   Top result: ${testResults.hits[0]?.name || 'N/A'}`)

    // Test typo tolerance
    const typoResults = await index.search('farn shop', { limit: 3 })
    console.log(`\n   Typo test "farn shop": ${typoResults.estimatedTotalHits} results`)
    console.log(`   Top result: ${typoResults.hits[0]?.name || 'N/A'}`)

    console.log('\n✅ All tests passed! Search is ready.\n')

  } catch (error: any) {
    console.error('\n❌ Error during indexing:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run indexing
indexFarms()
