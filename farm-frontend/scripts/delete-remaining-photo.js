#!/usr/bin/env node

const { createClient } = require('redis')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function deleteRemainingPhoto() {
  try {
    await redis.connect()
    console.log('🔗 Connected to Redis')

    // The remaining photo IDs
    const remainingPhotoIds = [
      '0af25cae-68c2-4612-96d9-245666741298',
      'ac869cbd-7201-4fe7-aa37-228737ff21fb',
      'cd148309-22e1-4083-b475-f9a6b9c2ebc1'
    ]
    
    for (const photoId of remainingPhotoIds) {
      console.log(`🗑️  Deleting remaining photo: ${photoId}`)
      
      // Delete the photo data
      const deleted = await redis.del(`photo:${photoId}`)
      console.log(`   Photo data deleted: ${deleted > 0 ? 'Yes' : 'No'}`)
      
      // Remove from moderation queue
      const removedFromQueue = await redis.lRem('moderation:queue', 0, photoId)
      console.log(`   Removed from moderation queue: ${removedFromQueue} times`)
      
      // Check if it's in any farm's approved photos
      const farmKeys = await redis.keys('farm:*:photos:approved')
      for (const farmKey of farmKeys) {
        const removedFromFarm = await redis.sRem(farmKey, photoId)
        if (removedFromFarm > 0) {
          console.log(`   Removed from ${farmKey}: Yes`)
        }
      }
      
      // Verify it's gone
      const remainingData = await redis.hGetAll(`photo:${photoId}`)
      if (Object.keys(remainingData).length === 0) {
        console.log(`✅ Photo ${photoId} data confirmed deleted`)
      } else {
        console.log(`❌ Photo ${photoId} data still exists:`, remainingData)
      }
    }
    
    console.log('✅ All remaining photos cleanup completed')
    
  } catch (error) {
    console.error('❌ Error deleting remaining photos:', error)
  } finally {
    await redis.disconnect()
  }
}

deleteRemainingPhoto()
