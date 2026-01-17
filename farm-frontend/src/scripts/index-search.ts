/**
 * Index Search Script
 *
 * Indexes all farms from the database into Meilisearch for fast search.
 *
 * Usage: pnpm tsx src/scripts/index-search.ts
 */

import { prisma } from '../lib/prisma'
import { setupSearchIndex, indexFarms } from '../lib/search'

async function main() {
  console.log('🔍 Starting Meilisearch indexing...\n')

  try {
    // Setup index with configuration
    console.log('⚙️  Configuring search index...')
    await setupSearchIndex()

    // Fetch all active farms with categories
    console.log('📖 Fetching farms from database...')
    const farms = await prisma.farm.findMany({
      where: { status: 'active' },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    console.log(`✓ Found ${farms.length} farms\n`)

    // Index farms in batches of 100
    console.log('📦 Indexing farms...')
    const batchSize = 100
    let indexed = 0

    for (let i = 0; i < farms.length; i += batchSize) {
      const batch = farms.slice(i, i + batchSize)
      await indexFarms(batch)
      indexed += batch.length

      const percentage = Math.round((indexed / farms.length) * 100)
      console.log(`Progress: ${percentage}% (${indexed}/${farms.length})`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Indexing Complete!')
    console.log('='.repeat(60))
    console.log(`✓ Indexed ${indexed} farms`)
    console.log('\n🔍 Search is now available!')
    console.log('Test it: http://localhost:7700')
  } catch (error) {
    console.error('\n❌ Indexing failed:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
