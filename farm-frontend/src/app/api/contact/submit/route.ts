import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { kv } from '@vercel/kv'
import { validateAndSanitize, ValidationSchemas, ValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'
import { sendEmailViaGateway } from '@/lib/email-gateway'
import { verifyTurnstile } from '@/lib/security'

// Using the centralized validation schema from input-validation.ts

const redis = Redis.fromEnv()
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m') // 5 submissions per 10 minutes
})

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

    // Origin check - strictly enforced
    const origin = req.headers.get('origin') || ''
    const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk'
    if (!origin.startsWith(host)) {
      logger.warn('Origin check failed', { ip, origin, host })
      throw errors.authorization('Invalid request origin')
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

    // Turnstile CAPTCHA verification (mandatory)
    const turnstileOk = await verifyTurnstile(v.turnstileToken, ip)
    if (!turnstileOk) {
      logger.warn('Turnstile verification failed', { ip })
      throw errors.validation('CAPTCHA verification failed. Please try again.')
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

    // Send admin notification only (fixed recipient, via gateway).
    // User acknowledgement emails are intentionally removed to prevent
    // abuse as a spam relay to arbitrary addresses.
    if (TO && FROM) {
      sendEmailViaGateway({
        from: FROM,
        to: TO,
        subject: `Contact: ${v.topic} - ${v.name}`,
        replyTo: v.email,
        text: [
          `Name: ${v.name}`,
          `Email: ${v.email}`,
          `Topic: ${v.topic}`,
          `Time to fill: ${v.ttf} ms`,
          '',
          v.message,
        ].join('\n'),
        tag: 'contact-admin',
      }).catch((e) => {
        moduleLogger.error('Failed to send admin notification', { ip, id }, e as Error)
      })
    }

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
