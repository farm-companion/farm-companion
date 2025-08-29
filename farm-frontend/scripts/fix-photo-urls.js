#!/usr/bin/env node

/**
 * Utility script to fix existing photo URLs that don't have file extensions
 * This script will update the URLs in Redis to include the correct file extensions
 */

import { createClient } from 'redis'

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function fixPhotoUrls() {
  try {
    await redis.connect()
    console.log('Connected to Redis')

    // Get all pending photos
    const pendingIds = await redis.lRange('moderation:queue', 0, -1)
    console.log(`Found ${pendingIds.length} pending photos`)

    for (const id of pendingIds) {
      try {
        const photoData = await redis.hGetAll(`photo:${id}`)
        if (!photoData || Object.keys(photoData).length === 0) {
          console.log(`No data found for photo ${id}`)
          continue
        }

        const url = photoData.url
        console.log(`Processing photo ${id}: ${url}`)

        // Check if URL needs fixing (doesn't have a file extension)
        if (url && !url.includes('.') && url.includes('/main')) {
          console.log(`  URL needs fixing: ${url}`)
          
          // Try to determine the correct extension
          // For now, we'll default to .webp since that's what we're using for new uploads
          const fixedUrl = url.replace('/main', '/main.webp')
          
          console.log(`  Fixed URL: ${fixedUrl}`)
          
          // Update the URL in Redis
          await redis.hSet(`photo:${id}`, 'url', fixedUrl)
          console.log(`  Updated photo ${id} URL in Redis`)
        } else {
          console.log(`  URL already has extension or is in correct format: ${url}`)
        }
      } catch (error) {
        console.error(`Error processing photo ${id}:`, error)
      }
    }

    // Also check approved photos
    const farmKeys = await redis.keys('farm:*:photos:approved')
    console.log(`Found ${farmKeys.length} farms with approved photos`)

    for (const farmKey of farmKeys) {
      const photoIds = await redis.sMembers(farmKey)
      console.log(`Farm ${farmKey} has ${photoIds.length} approved photos`)

      for (const photoId of photoIds) {
        try {
          const photoData = await redis.hGetAll(`photo:${photoId}`)
          if (!photoData || Object.keys(photoData).length === 0) {
            continue
          }

          const url = photoData.url
          if (url && !url.includes('.') && url.includes('/main')) {
            console.log(`  Fixing approved photo ${photoId}: ${url}`)
            const fixedUrl = url.replace('/main', '/main.webp')
            await redis.hSet(`photo:${photoId}`, 'url', fixedUrl)
            console.log(`  Updated approved photo ${photoId} URL in Redis`)
          }
        } catch (error) {
          console.error(`Error processing approved photo ${photoId}:`, error)
        }
      }
    }

    console.log('Finished fixing photo URLs')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await redis.disconnect()
  }
}

// Run the script
fixPhotoUrls()
