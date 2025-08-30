import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { 
  checkDataIntegrity, 
  cleanupOrphanedIndexes,
  ValidationError,
  ConstraintViolationError 
} from '@/lib/database-constraints'

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schema = searchParams.get('schema') as 'farms' | 'photos' | 'submissions' | null
    const action = searchParams.get('action') as 'check' | 'cleanup' | null

    if (!schema || !['farms', 'photos', 'submissions'].includes(schema)) {
      return NextResponse.json({ 
        error: 'Invalid schema. Must be one of: farms, photos, submissions' 
      }, { status: 400 })
    }

    if (!action || !['check', 'cleanup'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be one of: check, cleanup' 
      }, { status: 400 })
    }

    if (action === 'check') {
      // Check data integrity
      const integrity = await checkDataIntegrity(schema)
      
      return NextResponse.json({
        schema,
        action: 'check',
        timestamp: new Date().toISOString(),
        ...integrity
      })
    } else if (action === 'cleanup') {
      // Cleanup orphaned indexes
      const cleanedCount = await cleanupOrphanedIndexes(schema)
      
      return NextResponse.json({
        schema,
        action: 'cleanup',
        timestamp: new Date().toISOString(),
        cleanedCount,
        message: `Cleaned up ${cleanedCount} orphaned indexes`
      })
    }

  } catch (error) {
    console.error('Database integrity check error:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}`, field: error.field },
        { status: 400 }
      )
    }
    
    if (error instanceof ConstraintViolationError) {
      return NextResponse.json(
        { error: `Constraint violation: ${error.message}`, field: error.constraint },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { schemas = ['farms', 'photos', 'submissions'], actions = ['check'] } = body

    if (!Array.isArray(schemas) || !schemas.every(s => ['farms', 'photos', 'submissions'].includes(s))) {
      return NextResponse.json({ 
        error: 'Invalid schemas. Must be an array of: farms, photos, submissions' 
      }, { status: 400 })
    }

    if (!Array.isArray(actions) || !actions.every(a => ['check', 'cleanup'].includes(a))) {
      return NextResponse.json({ 
        error: 'Invalid actions. Must be an array of: check, cleanup' 
      }, { status: 400 })
    }

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

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('Database integrity batch operation error:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}`, field: error.field },
        { status: 400 }
      )
    }
    
    if (error instanceof ConstraintViolationError) {
      return NextResponse.json(
        { error: `Constraint violation: ${error.message}`, field: error.constraint },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
