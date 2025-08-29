#!/usr/bin/env node

/**
 * Simple Redis cleanup script for farm photos
 * This script will clean up all photo references from Redis
 */

const { createClient } = require('redis')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function cleanupRedisOnly() {
  try {
    console.log('🧹 Starting Redis photo cleanup...\n')

    await redis.connect()
    console.log('🔗 Connected to Redis')

    // Get all pending photos
    const pendingIds = await redis.lRange('moderation:queue', 0, -1)
    console.log(`📋 Found ${pendingIds.length} pending photos in moderation queue`)

    // Get all approved photos
    const farmKeys = await redis.keys('farm:*:photos:approved')
    let totalApproved = 0
    for (const farmKey of farmKeys) {
      const photoIds = await redis.sMembers(farmKey)
      totalApproved += photoIds.length
    }
    console.log(`✅ Found ${totalApproved} approved photos across ${farmKeys.length} farms`)

    if (pendingIds.length === 0 && totalApproved === 0) {
      console.log('🎉 No photos found in Redis - already clean!')
      return
    }

    console.log('\n⚠️  WARNING: This will permanently delete all photo data from Redis!')
    console.log('To proceed with deletion, run this script with the --delete flag:')
    console.log('node scripts/cleanup-redis-only.js --delete')

    // Check if --delete flag is provided
    if (process.argv.includes('--delete')) {
      console.log('\n🗑️  Cleaning up Redis photo data...')

      // Delete pending photos
      if (pendingIds.length > 0) {
        console.log(`🗑️  Deleting ${pendingIds.length} pending photos...`)
        for (const id of pendingIds) {
          try {
            await redis.del(`photo:${id}`)
            console.log(`  ✅ Deleted photo:${id}`)
          } catch (error) {
            console.error(`  ❌ Failed to delete photo:${id}:`, error.message)
          }
        }
        await redis.del('moderation:queue')
        console.log('  ✅ Cleared moderation queue')
      }

      // Delete approved photos
      if (farmKeys.length > 0) {
        console.log(`🗑️  Deleting approved photos from ${farmKeys.length} farms...`)
        for (const farmKey of farmKeys) {
          const photoIds = await redis.sMembers(farmKey)
          console.log(`  📁 Processing ${farmKey} (${photoIds.length} photos)`)
          
          for (const photoId of photoIds) {
            try {
              await redis.del(`photo:${photoId}`)
              console.log(`    ✅ Deleted photo:${photoId}`)
            } catch (error) {
              console.error(`    ❌ Failed to delete photo:${photoId}:`, error.message)
            }
          }
          
          // Clear the approved photos set for this farm
          await redis.del(farmKey)
          console.log(`    ✅ Cleared ${farmKey}`)
        }
      }

      console.log('\n🎉 Successfully cleaned up all photo data from Redis!')
      console.log('💡 Note: You may also want to clean up blob storage files manually')
    } else {
      console.log('\n💡 Run with --delete flag to actually delete the data')
    }

  } catch (error) {
    console.error('❌ Error cleaning up Redis photos:', error)
  } finally {
    await redis.disconnect()
  }
}

// Run the script
cleanupRedisOnly()
