import { NextRequest, NextResponse } from 'next/server'
import { ContactSchema, sanitizeText } from '@/lib/validation'
import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import {
  checkCsrf,
  validateHoneypot,
  validateSubmissionTime,
  verifyTurnstile,
  validateContent,
  trackIPReputation,
  isIPBlocked,
} from '@/lib/security'
import { createRouteLogger } from '@/lib/logger'
import { processContactForm } from '@/services/contact.service'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/contact', request)
  const ip = getClientIP(request)

  try {
    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Apply rate limiting
    const rateLimit = await rateLimiters.contact.consume(ip)
    if (!rateLimit) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    // CSRF protection
    if (!checkCsrf(request)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    // Validate input with Zod
    const parse = ContactSchema.safeParse(body)
    if (!parse.success) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }

    const data = parse.data

    // Spam checks
    if (!validateHoneypot(data.hp)) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ ok: true }) // Silent discard
    }

    if (!validateSubmissionTime(data.t)) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ ok: true }) // Silent discard
    }

    // Content validation
    const contentValidation = await validateContent(data.message)
    if (!contentValidation.valid) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ error: 'Invalid content detected' }, { status: 400 })
    }

    // Optional: verify Cloudflare Turnstile
    if (data.token) {
      const turnstileValid = await verifyTurnstile(data.token, ip)
      if (!turnstileValid) {
        await trackIPReputation(ip, 'spam')
        return NextResponse.json({ error: 'Bot check failed' }, { status: 400 })
      }
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeText(data.name),
      email: data.email.toLowerCase().trim(),
      subject: sanitizeText(data.subject),
      message: sanitizeText(data.message),
    }

    // Process contact form (send emails)
    await processContactForm(sanitizedData)

    // Track successful submission
    await trackIPReputation(ip, 'success')

    logger.info('Contact form submitted successfully', { ip })

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 200 })
  } catch (error) {
    logger.error('Contact form error', { ip }, error as Error)
    await trackIPReputation(ip, 'failure')
    return NextResponse.json({ error: 'Internal server error. Please try again later.' }, { status: 500 })
  }
}
