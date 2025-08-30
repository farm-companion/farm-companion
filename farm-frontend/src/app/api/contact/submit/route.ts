import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { kv } from '@vercel/kv'
import { Resend } from 'resend'

const Input = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be less than 80 characters'),
  email: z.string().email('Invalid email format'),
  topic: z.enum(['general','bug','data-correction','partnership']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  consent: z.boolean(),
  _hp: z.string().max(0, 'Honeypot field must be empty').optional(),
  ttf: z.number().int().nonnegative('Time to fill must be a positive number').optional(),
})

const redis = Redis.fromEnv()
const limiter = new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(5, '10 m') // 5 submissions per 10 minutes
})

const resend = new Resend(process.env.RESEND_API_KEY)
const TO = process.env.CONTACT_TO_EMAIL!
const FROM = process.env.CONTACT_FROM_EMAIL!

export async function POST(req: NextRequest) {
  // Kill-switch check
  if (process.env.CONTACT_FORM_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Contact form disabled' }, { status: 503 })
  }

  // Basic origin check (same-origin POST)
  const origin = req.headers.get('origin') || ''
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk'
  if (!origin.startsWith(host)) {
    // Soften to 403 if you embed elsewhere
    // return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  const rate = await limiter.limit(`contact:${ip}`)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many messages. Please try later.' }, 
      { status: 429 }
    )
  }

  // Parse JSON
  let data: unknown
  try { 
    data = await req.json() 
  } catch { 
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) 
  }

  const parsed = Input.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() }, 
      { status: 422 }
    )
  }
  
  const v = parsed.data
  
  // Anti-spam checks
  if (!v.consent) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 })
  }
  
  if (v._hp) {
    return NextResponse.json({ error: 'Spam detected' }, { status: 400 })
  }
  
  if ((v.ttf ?? 0) < 1500) {
    return NextResponse.json({ error: 'Form filled too quickly' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const createdAt = Date.now()

  // Store message (optional but helpful)
  try {
    await kv.hset(`contact:${id}`, { 
      id, 
      createdAt, 
      ip, 
      ...v, 
      status: 'received' 
    })
    await kv.lpush('contact:inbox', id)
  } catch (e) {
    // non-fatal
    console.error('kv store failed', e)
  }

  // Send admin forward (don't fail the user if email fails)
  ;(async () => {
    try {
      await resend.emails.send({
        from: FROM,
        to: TO,
        subject: `Contact: ${v.topic} — ${v.name}`,
        reply_to: v.email,
        text: [
          `Name: ${v.name}`,
          `Email: ${v.email}`,
          `Topic: ${v.topic}`,
          `Time to fill: ${v.ttf} ms`,
          '',
          v.message
        ].join('\n')
      })
    } catch (e) {
      console.error('admin email failed', e)
    }
  })()

  // Send user acknowledgement (non-blocking)
  ;(async () => {
    try {
      await resend.emails.send({
        from: FROM,
        to: v.email,
        subject: 'We received your message — Farm Companion',
        text: `Hi ${v.name},\n\nThanks for contacting Farm Companion. We've received your message and will reply soon.\n\n— The Farm Companion team`,
      })
    } catch (e) {
      console.error('ack email failed', e)
    }
  })()

  return NextResponse.json({ ok: true, id }, { status: 201 })
}
