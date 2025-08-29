#!/usr/bin/env node

/**
 * Comprehensive cleanup script for farm photos
 * This script will clean up both blob storage and Redis data
 */

const { list, del } = require('@vercel/blob')
const { createClient } = require('redis')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function cleanupAllPhotos() {
  try {
    console.log('🧹 Starting comprehensive photo cleanup...\n')

    // Step 1: Clean up blob storage
    console.log('📦 Step 1: Cleaning up blob storage...')
    const { blobs } = await list({ prefix: 'farm-photos/' })
    console.log(`   Found ${blobs.length} farm photos in blob storage`)

    if (blobs.length > 0) {
      if (process.argv.includes('--delete')) {
        console.log('   🗑️  Deleting blob storage files...')
        let deletedCount = 0
        for (const blob of blobs) {
          try {
            await del(blob.pathname)
            console.log(`     ✅ Deleted: ${blob.pathname}`)
            deletedCount++
          } catch (error) {
            console.error(`     ❌ Failed to delete ${blob.pathname}:`, error.message)
          }
        }
        console.log(`   🎉 Deleted ${deletedCount} out of ${blobs.length} blob files`)
      } else {
        console.log('   💡 Run with --delete flag to delete blob storage files')
      }
    } else {
      console.log('   ✅ No farm photos found in blob storage')
    }

    // Step 2: Clean up Redis data
    console.log('\n🗄️  Step 2: Cleaning up Redis data...')
    await redis.connect()
    console.log('   🔗 Connected to Redis')

    // Get pending photos
    const pendingIds = await redis.lRange('moderation:queue', 0, -1)
    console.log(`   📋 Found ${pendingIds.length} pending photos in moderation queue`)

    // Get approved photos
    const farmKeys = await redis.keys('farm:*:photos:approved')
    let totalApproved = 0
    for (const farmKey of farmKeys) {
      const photoIds = await redis.sMembers(farmKey)
      totalApproved += photoIds.length
    }
    console.log(`   ✅ Found ${totalApproved} approved photos across ${farmKeys.length} farms`)

    if (pendingIds.length > 0 || totalApproved > 0) {
      if (process.argv.includes('--delete')) {
        console.log('   🗑️  Deleting Redis photo data...')

        // Delete pending photos
        if (pendingIds.length > 0) {
          console.log(`     📋 Deleting ${pendingIds.length} pending photos...`)
          for (const id of pendingIds) {
            try {
              await redis.del(`photo:${id}`)
              console.log(`       ✅ Deleted photo:${id}`)
            } catch (error) {
              console.error(`       ❌ Failed to delete photo:${id}:`, error.message)
            }
          }
          await redis.del('moderation:queue')
          console.log('       ✅ Cleared moderation queue')
        }

        // Delete approved photos
        if (farmKeys.length > 0) {
          console.log(`     ✅ Deleting approved photos from ${farmKeys.length} farms...`)
          for (const farmKey of farmKeys) {
            const photoIds = await redis.sMembers(farmKey)
            console.log(`       📁 Processing ${farmKey} (${photoIds.length} photos)`)
            
            for (const photoId of photoIds) {
              try {
                await redis.del(`photo:${photoId}`)
                console.log(`         ✅ Deleted photo:${photoId}`)
              } catch (error) {
                console.error(`         ❌ Failed to delete photo:${photoId}:`, error.message)
              }
            }
            
            await redis.del(farmKey)
            console.log(`         ✅ Cleared ${farmKey}`)
          }
        }

        console.log('   🎉 Successfully cleaned up all Redis photo data!')
      } else {
        console.log('   💡 Run with --delete flag to delete Redis data')
      }
    } else {
      console.log('   ✅ No photo data found in Redis')
    }

    console.log('\n🎉 Cleanup process completed!')
    
    if (!process.argv.includes('--delete')) {
      console.log('\n📝 To actually perform the cleanup, run:')
      console.log('   node scripts/cleanup-all-photos.js --delete')
    } else {
      console.log('\n✨ All farm photos have been cleaned up!')
      console.log('   You can now start fresh with the new upload system.')
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}

// Run the script
cleanupAllPhotos()
