#!/usr/bin/env node

const { createClient } = require('redis')

const redis = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
})

async function checkRedis() {
  try {
    await redis.connect()
    console.log('🔗 Connected to Redis')

    // Check moderation queue
    const pendingIds = await redis.lRange('moderation:queue', 0, -1)
    console.log(`📋 Moderation queue: ${pendingIds.length} items`)
    console.log('   IDs:', pendingIds)

    // Check all photo keys
    const photoKeys = await redis.keys('photo:*')
    console.log(`📸 Photo keys: ${photoKeys.length} items`)
    console.log('   Keys:', photoKeys)

    // Check farm photo sets
    const farmKeys = await redis.keys('farm:*:photos:*')
    console.log(`🏠 Farm photo sets: ${farmKeys.length} items`)
    console.log('   Keys:', farmKeys)

    // If there are photo keys, show their data
    if (photoKeys.length > 0) {
      console.log('\n📄 Photo data:')
      for (const key of photoKeys) {
        const data = await redis.hGetAll(key)
        console.log(`   ${key}:`, data)
      }
    }

  } catch (error) {
    console.error('❌ Error checking Redis:', error)
  } finally {
    await redis.disconnect()
  }
}

checkRedis()
