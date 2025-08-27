#!/usr/bin/env node

/**
 * Migration script to move farm submissions from file system to Redis
 * Run this script to migrate existing farm submissions to the new Redis-based system
 */

const Redis = require('ioredis')
const fs = require('fs/promises')
const path = require('path')

async function migrateFarmsToRedis() {
  try {
    console.log('🔄 Starting farm submissions migration to Redis...')
    
    // Connect to Redis
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    
    // Read existing farm submissions from file system
    const farmsDir = path.join(__dirname, '..', 'data', 'farms')
    
    try {
      await fs.access(farmsDir)
    } catch {
      console.log('📁 No farms directory found, nothing to migrate')
      await redis.quit()
      return
    }
    
    const files = await fs.readdir(farmsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    if (jsonFiles.length === 0) {
      console.log('📁 No farm submission files found')
      await redis.quit()
      return
    }
    
    console.log(`📁 Found ${jsonFiles.length} farm submission(s) to migrate`)
    
    // Migrate each farm submission
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(farmsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const submission = JSON.parse(content)
        
        // Use the farm ID as the key in Redis
        const farmId = submission.id || file.replace('.json', '')
        
        // Store in Redis hash
        await redis.hset('farm_submissions', farmId, JSON.stringify(submission))
        
        console.log(`✅ Migrated: ${submission.name} (${farmId})`)
        
      } catch (error) {
        console.error(`❌ Error migrating ${file}:`, error.message)
      }
    }
    
    console.log('🎉 Farm submissions migration completed!')
    
    // Verify migration
    const migratedSubmissions = await redis.hgetall('farm_submissions')
    console.log(`📊 Total submissions in Redis: ${Object.keys(migratedSubmissions || {}).length}`)
    
    await redis.quit()
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateFarmsToRedis()
