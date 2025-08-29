#!/usr/bin/env node

const { createClient } = require('redis')
const { head } = require('@vercel/blob')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function restoreExistingPhotos() {
  try {
    await redis.connect()
    console.log('🔗 Connected to Redis')

    // Photo IDs that exist in blob storage
    const photoIds = [
      '0af25cae-68c2-4612-96d9-245666741298',
      'ac869cbd-7201-4fe7-aa37-228737ff21fb',
      'cd148309-22e1-4083-b475-f9a6b9c2ebc1'
    ]
    
    for (const photoId of photoIds) {
      console.log(`🔍 Checking photo: ${photoId}`)
      
      // Check if photo exists in blob storage
      const objectKey = `farm-photos/priory-farm-shop/${photoId}/main.jpg`
      const blobInfo = await head(objectKey)
      
      if (blobInfo) {
        console.log(`✅ Photo exists in blob storage: ${blobInfo.url}`)
        
        // Check if photo already exists in database
        const existingPhoto = await redis.hGetAll(`photo:${photoId}`)
        
        if (Object.keys(existingPhoto).length === 0) {
          console.log(`📝 Restoring photo to database: ${photoId}`)
          
          // Create photo object with correct URL
          const photo = {
            id: photoId,
            farmSlug: 'priory-farm-shop',
            url: blobInfo.url,
            caption: '',
            authorName: '',
            authorEmail: '',
            createdAt: Date.now(),
            status: 'pending'
          }
          
          // Store photo in database
          const pipeline = redis.multi()
          
          // Store photo metadata
          pipeline.hSet(`photo:${photo.id}`, {
            id: photo.id,
            farmSlug: photo.farmSlug,
            url: photo.url,
            caption: photo.caption,
            authorName: photo.authorName,
            authorEmail: photo.authorEmail,
            createdAt: photo.createdAt.toString(),
            status: photo.status
          })
          
          // Add to farm's pending photos
          pipeline.sAdd(`farm:${photo.farmSlug}:photos:pending`, photo.id)
          
          // Add to moderation queue
          pipeline.lPush('moderation:queue', photo.id)
          
          await pipeline.exec()
          
          console.log(`✅ Photo restored: ${photoId}`)
        } else {
          console.log(`ℹ️  Photo already exists in database: ${photoId}`)
        }
      } else {
        console.log(`❌ Photo not found in blob storage: ${photoId}`)
      }
    }
    
    console.log('✅ Photo restoration completed')
    
  } catch (error) {
    console.error('❌ Error restoring photos:', error)
  } finally {
    await redis.disconnect()
  }
}

restoreExistingPhotos()
