import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { kv } from '@vercel/kv'
import { Resend } from 'resend'
import { validateAndSanitize, ValidationSchemas, ValidationError } from '@/lib/input-validation'

// Using the centralized validation schema from input-validation.ts

const redis = Redis.fromEnv()
const limiter = new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(5, '10 m') // 5 submissions per 10 minutes
})

const resend = new Resend(process.env.RESEND_API_KEY)
const TO = process.env.CONTACT_TO_EMAIL!
const FROM = process.env.CONTACT_FROM_EMAIL!

export async function POST(req: NextRequest) {
  try {
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

    // Parse and validate JSON
    let data: unknown
    try { 
      data = await req.json() 
    } catch { 
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) 
    }

    // Validate and sanitize input
    const v = await validateAndSanitize(
      ValidationSchemas.contactForm,
      data,
      { sanitize: true, strict: true }
    )
    
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
          replyTo: v.email,
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
  } catch (error) {
    console.error('Contact form error:', error)
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: `Validation error: ${error.message}`, field: error.field },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' }, 
      { status: 500 }
    )
  }
}
