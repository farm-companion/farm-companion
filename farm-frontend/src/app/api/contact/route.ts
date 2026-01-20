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
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/contact', request)
  const ip = getClientIP(request)

  try {
    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      await trackIPReputation(ip, 'failure')
      throw errors.authorization('Access denied')
    }

    // Apply rate limiting
    const rateLimit = await rateLimiters.contact.consume(ip)
    if (!rateLimit) {
      await trackIPReputation(ip, 'failure')
      throw errors.rateLimit()
    }

    // CSRF protection
    if (!checkCsrf(request)) {
      await trackIPReputation(ip, 'failure')
      throw errors.authorization('Invalid request origin')
    }

    const body = await request.json().catch(() => ({}))

    // Validate input with Zod
    const parse = ContactSchema.safeParse(body)
    if (!parse.success) {
      await trackIPReputation(ip, 'failure')
      throw errors.validation('Invalid data provided', {
        errors: parse.error.errors,
      })
    }

    const data = parse.data

    // Spam checks (silent discard for spam)
    if (!validateHoneypot(data.hp)) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ ok: true })
    }

    if (!validateSubmissionTime(data.t)) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ ok: true })
    }

    // Content validation
    const contentValidation = await validateContent(data.message)
    if (!contentValidation.valid) {
      await trackIPReputation(ip, 'spam')
      throw errors.validation('Invalid content detected')
    }

    // Optional: verify Cloudflare Turnstile
    if (data.token) {
      const turnstileValid = await verifyTurnstile(data.token, ip)
      if (!turnstileValid) {
        await trackIPReputation(ip, 'spam')
        throw errors.validation('Bot check failed')
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
    await trackIPReputation(ip, 'failure')
    return handleApiError(error, 'api/contact', { ip })
  }
}
