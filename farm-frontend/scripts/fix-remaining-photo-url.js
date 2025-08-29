#!/usr/bin/env node

const { createClient } = require('redis')
const { head } = require('@vercel/blob')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function fixRemainingPhotoUrl() {
  try {
    await redis.connect()
    console.log('🔗 Connected to Redis')

    // The photo that still has the old URL
    const photoId = '879ae389-c302-426c-9bd5-af8440a6cd0f'
    
    console.log(`🔍 Checking photo: ${photoId}`)
    
    // Check if photo exists in blob storage
    const objectKey = `farm-photos/priory-farm-shop/${photoId}/main.jpg`
    const blobInfo = await head(objectKey)
    
    if (blobInfo) {
      console.log(`✅ Photo exists in blob storage: ${blobInfo.url}`)
      
      // Update the photo URL in the database
      await redis.hSet(`photo:${photoId}`, 'url', blobInfo.url)
      
      console.log(`✅ Photo URL updated: ${photoId}`)
      console.log(`   Old URL: https://blob.vercel-storage.com/farm-photos/priory-farm-shop/${photoId}/main.jpg`)
      console.log(`   New URL: ${blobInfo.url}`)
    } else {
      console.log(`❌ Photo not found in blob storage: ${photoId}`)
    }
    
    console.log('✅ Photo URL fix completed')
    
  } catch (error) {
    console.error('❌ Error fixing photo URL:', error)
  } finally {
    await redis.disconnect()
  }
}

fixRemainingPhotoUrl()
