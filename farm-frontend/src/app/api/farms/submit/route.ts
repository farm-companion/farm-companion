import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createRecord, ValidationError, ConstraintViolationError } from '@/lib/database-constraints'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'

// Rate limiter setup
const redis = Redis.fromEnv()
const limiter = new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(5, '10 m') // 5 submissions per 10 minutes
})

export async function POST(req: NextRequest) {
  // Kill-switch check
  if (process.env.ADD_FORM_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Add form disabled' }, { status: 503 })
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  const { success, reset, remaining } = await limiter.limit(`add:${ip}`)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait before submitting again.' }, 
      { 
        status: 429, 
        headers: { 
          'X-RateLimit-Remaining': String(remaining), 
          'X-RateLimit-Reset': String(reset) 
        }
      }
    )
  }

  // Parse request body
  let data: unknown
  try { 
    data = await req.json() 
  } catch { 
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) 
  }

  // Validate input using comprehensive validation
  let v
  try {
    v = await validateAndSanitize(ValidationSchemas.farmSubmission, data, {
      sanitize: true,
      strict: false
    })
  } catch (error) {
    if (error instanceof InputValidationError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          message: error.message,
          field: error.field
        }, 
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: 'Invalid input data' }, 
      { status: 400 }
    )
  }

  // Anti-spam checks
  if (v._hp) {
    return NextResponse.json({ error: 'Spam detected' }, { status: 400 })
  }

  if ((v.ttf ?? 0) < 2000) {
    return NextResponse.json({ error: 'Form filled too quickly' }, { status: 400 })
  }

  // Generate unique ID
  const id = crypto.randomUUID()
  
  // Prepare farm data
  const farmData = {
    id,
    name: v.name.trim(),
    address: v.address.trim(),
    city: v.city?.trim() || '',
    county: v.county.trim(),
    postcode: v.postcode.trim(),
    contactEmail: v.contactEmail?.trim() || '',
    website: v.website?.trim() || '',
    phone: v.phone?.trim() || '',
    lat: v.lat?.trim() || '',
    lng: v.lng?.trim() || '',
    offerings: v.offerings?.trim() || '',
    story: v.story?.trim() || '',
    hours: v.hours || [],
    status: 'pending' as const,
    createdAt: Date.now(),
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
    approvedAt: null,
    approvedBy: null
  }

  try {
    // Use database constraints system for atomic operation
    await createRecord('submissions', farmData, id)
    
    // Add to pending queue
    await kv.lpush('farm-submissions:pending', id)

    // Send confirmation email if contact email provided (fire-and-forget)
    if (v.contactEmail) {
      ;(async () => {
        try {
          // Import email function if it exists
          const { sendSubmissionAckEmail } = await import('@/lib/email').catch(() => ({ sendSubmissionAckEmail: null }))
          if (sendSubmissionAckEmail) {
            await sendSubmissionAckEmail({ 
              to: v.contactEmail!, 
              farmName: v.name 
            })
          }
        } catch (e) {
          console.error('Ack email failed:', e)
          // Don't fail the request if email fails
        }
      })()
    }

    return NextResponse.json(
      { 
        ok: true, 
        id,
        message: 'Farm shop submitted successfully. We\'ll review and add it to our directory within 2-3 business days.'
      }, 
      { status: 201 }
    )

  } catch (error) {
    console.error('Error storing farm submission:', error)
    
    // Handle specific validation errors
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
      { error: 'Failed to store submission' }, 
      { status: 500 }
    )
  }
}
