#!/usr/bin/env node

const { createClient } = require('redis')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function deleteProblematicPhoto() {
  try {
    await redis.connect()
    console.log('🔗 Connected to Redis')

    // The problematic photo ID
    const problematicPhotoId = 'b0083f15-09c5-455f-9228-ffa2adec5392'
    
    console.log(`🗑️  Deleting problematic photo: ${problematicPhotoId}`)
    
    // Delete the photo data
    const deleted = await redis.del(`photo:${problematicPhotoId}`)
    console.log(`   Photo data deleted: ${deleted > 0 ? 'Yes' : 'No'}`)
    
    // Remove from moderation queue
    const removedFromQueue = await redis.lRem('moderation:queue', 0, problematicPhotoId)
    console.log(`   Removed from moderation queue: ${removedFromQueue} times`)
    
    // Check if it's in any farm's approved photos
    const farmKeys = await redis.keys('farm:*:photos:approved')
    for (const farmKey of farmKeys) {
      const removedFromFarm = await redis.sRem(farmKey, problematicPhotoId)
      if (removedFromFarm > 0) {
        console.log(`   Removed from ${farmKey}: Yes`)
      }
    }
    
    console.log('✅ Problematic photo cleanup completed')
    
    // Verify it's gone
    const remainingData = await redis.hGetAll(`photo:${problematicPhotoId}`)
    if (Object.keys(remainingData).length === 0) {
      console.log('✅ Photo data confirmed deleted')
    } else {
      console.log('❌ Photo data still exists:', remainingData)
    }
    
  } catch (error) {
    console.error('❌ Error deleting problematic photo:', error)
  } finally {
    await redis.disconnect()
  }
}

deleteProblematicPhoto()
