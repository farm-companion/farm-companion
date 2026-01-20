import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/migrate-farms', request)

  try {
    logger.info('Processing farm submissions migration request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized farm migration attempt')
      throw errors.authorization('Unauthorized')
    }

    logger.info('Starting farm submissions migration to Redis')

    // Read existing farm submissions from file system
    const farmsDir = path.join(process.cwd(), 'data', 'farms')

    try {
      await fs.access(farmsDir)
    } catch {
      logger.info('No farms directory found, nothing to migrate')
      return NextResponse.json({ message: 'No farms directory found, nothing to migrate' })
    }

    const files = await fs.readdir(farmsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))

    if (jsonFiles.length === 0) {
      logger.info('No farm submission files found')
      return NextResponse.json({ message: 'No farm submission files found' })
    }

    logger.info('Found farm submissions to migrate', {
      fileCount: jsonFiles.length
    })

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

        logger.info('Migrated farm submission', {
          farmName: submission.name,
          farmId
        })
        migratedCount++

      } catch (error: unknown) {
        logger.error('Error migrating farm file', {
          file
        }, error as Error)
      }
    }

    logger.info('Farm submissions migration completed')

    // Verify migration
    const migratedSubmissions = await redis.hgetall('farm_submissions')
    const totalInRedis = Object.keys(migratedSubmissions || {}).length

    logger.info('Migration verification completed', {
      migratedCount,
      totalInRedis
    })

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully`,
      migratedCount,
      totalInRedis
    })

  } catch (error: unknown) {
    return handleApiError(error, 'api/admin/migrate-farms')
  }
}
