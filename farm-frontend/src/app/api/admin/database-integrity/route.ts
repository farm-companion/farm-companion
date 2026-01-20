import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  checkDataIntegrity,
  cleanupOrphanedIndexes,
  ValidationError,
  ConstraintViolationError
} from '@/lib/database-constraints'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  const logger = createRouteLogger('api/admin/database-integrity', req)

  try {
    logger.info('Processing database integrity check request')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized database integrity check attempt')
      throw errors.authorization('Unauthorized')
    }

    const { searchParams } = new URL(req.url)
    const schema = searchParams.get('schema') as 'farms' | 'photos' | 'submissions' | null
    const action = searchParams.get('action') as 'check' | 'cleanup' | null

    if (!schema || !['farms', 'photos', 'submissions'].includes(schema)) {
      logger.warn('Invalid schema parameter', { schema })
      throw errors.validation('Invalid schema. Must be one of: farms, photos, submissions')
    }

    if (!action || !['check', 'cleanup'].includes(action)) {
      logger.warn('Invalid action parameter', { action })
      throw errors.validation('Invalid action. Must be one of: check, cleanup')
    }

    logger.info('Executing database integrity operation', { schema, action })

    if (action === 'check') {
      // Check data integrity
      const integrity = await checkDataIntegrity(schema)

      logger.info('Database integrity check completed', {
        schema,
        valid: integrity.valid,
        errorsCount: integrity.errors.length,
        orphanedIndexes: integrity.orphanedIndexes?.length || 0
      })

      return NextResponse.json({
        schema,
        action: 'check',
        timestamp: new Date().toISOString(),
        ...integrity
      })
    } else if (action === 'cleanup') {
      // Cleanup orphaned indexes
      const cleanedCount = await cleanupOrphanedIndexes(schema)

      logger.info('Database cleanup completed', { schema, cleanedCount })

      return NextResponse.json({
        schema,
        action: 'cleanup',
        timestamp: new Date().toISOString(),
        cleanedCount,
        message: `Cleaned up ${cleanedCount} orphaned indexes`
      })
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Database validation error', {
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    if (error instanceof ConstraintViolationError) {
      logger.warn('Database constraint violation', {
        constraint: error.constraint,
        message: error.message
      })
      throw errors.validation(error.message, { constraint: error.constraint })
    }

    return handleApiError(error, 'api/admin/database-integrity')
  }
}

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/admin/database-integrity', req)

  try {
    logger.info('Processing batch database integrity operation')

    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized batch database integrity operation attempt')
      throw errors.authorization('Unauthorized')
    }

    const body = await req.json().catch(() => ({}))
    const { schemas = ['farms', 'photos', 'submissions'], actions = ['check'] } = body

    if (!Array.isArray(schemas) || !schemas.every(s => ['farms', 'photos', 'submissions'].includes(s))) {
      logger.warn('Invalid schemas in batch operation', { schemas })
      throw errors.validation('Invalid schemas. Must be an array of: farms, photos, submissions')
    }

    if (!Array.isArray(actions) || !actions.every(a => ['check', 'cleanup'].includes(a))) {
      logger.warn('Invalid actions in batch operation', { actions })
      throw errors.validation('Invalid actions. Must be an array of: check, cleanup')
    }

    logger.info('Executing batch database operations', {
      schemas,
      actions,
      totalOperations: schemas.length * actions.length
    })

    const results = []

    for (const schema of schemas) {
      for (const action of actions) {
        try {
          if (action === 'check') {
            const integrity = await checkDataIntegrity(schema)
            results.push({
              schema,
              action: 'check',
              success: true,
              ...integrity
            })
          } else if (action === 'cleanup') {
            const cleanedCount = await cleanupOrphanedIndexes(schema)
            results.push({
              schema,
              action: 'cleanup',
              success: true,
              cleanedCount
            })
          }
        } catch (error) {
          results.push({
            schema,
            action,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    logger.info('Batch database operations completed', {
      totalOperations: results.length,
      successCount,
      failureCount
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Batch operation validation error', {
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    if (error instanceof ConstraintViolationError) {
      logger.warn('Batch operation constraint violation', {
        constraint: error.constraint,
        message: error.message
      })
      throw errors.validation(error.message, { constraint: error.constraint })
    }

    return handleApiError(error, 'api/admin/database-integrity')
  }
}
