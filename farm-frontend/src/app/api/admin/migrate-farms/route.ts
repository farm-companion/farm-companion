import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting farm submissions migration to Redis...')
    
    // Read existing farm submissions from file system
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    
    try {
      await fs.access(farmsDir)
    } catch {
      console.log('📁 No farms directory found, nothing to migrate')
      return NextResponse.json({ message: 'No farms directory found, nothing to migrate' })
    }
    
    const files = await fs.readdir(farmsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    if (jsonFiles.length === 0) {
      console.log('📁 No farm submission files found')
      return NextResponse.json({ message: 'No farm submission files found' })
    }
    
    console.log(`📁 Found ${jsonFiles.length} farm submission(s) to migrate`)
    
    let migratedCount = 0
    
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
        migratedCount++
        
      } catch (error: unknown) {
        console.error(`❌ Error migrating ${file}:`, error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    console.log('🎉 Farm submissions migration completed!')
    
    // Verify migration
    const migratedSubmissions = await redis.hgetall('farm_submissions')
    const totalInRedis = Object.keys(migratedSubmissions || {}).length
    
    return NextResponse.json({ 
      success: true,
      message: `Migration completed successfully`,
      migratedCount,
      totalInRedis
    })
    
  } catch (error: unknown) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
