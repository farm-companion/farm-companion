import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { kv } from '@vercel/kv'
import { Resend } from 'resend'
import { validateAndSanitize, ValidationSchemas, ValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Using the centralized validation schema from input-validation.ts

const redis = Redis.fromEnv()
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m') // 5 submissions per 10 minutes
})

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key_for_build')
const TO = process.env.CONTACT_TO_EMAIL!
const FROM = process.env.CONTACT_FROM_EMAIL!

// Module logger for helper functions
const moduleLogger = createRouteLogger('api/contact/submit')

export async function POST(req: NextRequest) {
  const logger = createRouteLogger('api/contact/submit', req)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'

  try {
    logger.info('Processing contact form submission', { ip })

    // Kill-switch check
    if (process.env.CONTACT_FORM_ENABLED !== 'true') {
      logger.warn('Contact form disabled via kill switch', { ip })
      throw errors.validation('Contact form is currently disabled')
    }

    // Basic origin check (same-origin POST)
    const origin = req.headers.get('origin') || ''
    const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk'
    if (!origin.startsWith(host)) {
      // Soften to 403 if you embed elsewhere
      logger.warn('Origin check failed (allowing for now)', { ip, origin, host })
      // throw errors.authorization('Invalid request origin')
    }

    // Rate limiting
    const rate = await limiter.limit(`contact:${ip}`)
    if (!rate.success) {
      logger.warn('Rate limit exceeded for contact form', { ip })
      throw errors.rateLimit('Too many messages. Please try later.')
    }

    // Parse and validate JSON
    let data: unknown
    try {
      data = await req.json()
    } catch {
      throw errors.validation('Invalid JSON in request body')
    }

    // Validate and sanitize input
    const v = await validateAndSanitize(
      ValidationSchemas.contactForm,
      data,
      { sanitize: true, strict: true }
    )

    logger.info('Contact form data validated', {
      ip,
      name: v.name,
      email: v.email,
      topic: v.topic
    })

    // Anti-spam checks
    if (!v.consent) {
      logger.warn('Consent not provided', { ip })
      throw errors.validation('Consent is required to submit the form')
    }

    if (v._hp) {
      logger.warn('Honeypot triggered in contact form', { ip })
      throw errors.validation('Spam detected')
    }

    if ((v.ttf ?? 0) < 1500) {
      logger.warn('Form filled too quickly (possible bot)', { ip, ttf: v.ttf })
      throw errors.validation('Form filled too quickly')
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
      logger.info('Contact message stored in KV', { ip, id })
    } catch (e) {
      // non-fatal
      moduleLogger.error('Failed to store contact message in KV', { ip, id }, e as Error)
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
        moduleLogger.info('Admin notification email sent', { ip, id, topic: v.topic })
      } catch (e) {
        moduleLogger.error('Failed to send admin notification email', { ip, id }, e as Error)
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
        moduleLogger.info('Acknowledgement email sent to user', { ip, id, email: v.email })
      } catch (e) {
        moduleLogger.error('Failed to send acknowledgement email', { ip, id, email: v.email }, e as Error)
      }
    })()

    logger.info('Contact form submission completed successfully', {
      ip,
      id,
      name: v.name,
      email: v.email,
      topic: v.topic
    })

    return NextResponse.json({ ok: true, id }, { status: 201 })
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      logger.warn('Validation error in contact form', {
        ip,
        field: error.field,
        message: error.message
      })
      throw errors.validation(error.message, { field: error.field })
    }

    return handleApiError(error, 'api/contact/submit', { ip })
  }
}
