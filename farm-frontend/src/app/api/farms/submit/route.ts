import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kv } from '@vercel/kv'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Input validation schema
const FarmInput = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name must be less than 120 characters'),
  address: z.string().min(6, 'Address must be at least 6 characters').max(240, 'Address must be less than 240 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(80, 'City must be less than 80 characters'),
  county: z.string().min(2, 'County must be at least 2 characters').max(80, 'County must be less than 80 characters'),
  postcode: z.string().min(3, 'Postcode must be at least 3 characters').max(12, 'Postcode must be less than 12 characters'),
  contactEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  offerings: z.string().optional(),
  story: z.string().optional(),
  hours: z.array(z.object({
    day: z.string(),
    open: z.string().optional(),
    close: z.string().optional()
  })).optional(),
  _hp: z.string().max(0, 'Honeypot field must be empty').optional().or(z.literal('')), // honeypot
  ttf: z.number().int().nonnegative('Time to fill must be a positive number').optional(), // time to fill
})

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
  const { success, limit, reset, remaining } = await limiter.limit(`add:${ip}`)
  
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

  // Validate input
  const parsed = FarmInput.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: parsed.error.flatten() 
      }, 
      { status: 422 }
    )
  }

  const v = parsed.data

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
    // Store in Redis with new key pattern to avoid conflicts
    await kv.hset(`farm-submission:${id}`, farmData)
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
    return NextResponse.json(
      { error: 'Failed to store submission' }, 
      { status: 500 }
    )
  }
}
