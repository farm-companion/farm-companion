// Newsletter Subscription API
// PuredgeOS 3.0 Compliant with Bot Protection

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Module logger for helper functions
const moduleLogger = createRouteLogger('api/newsletter/subscribe')

// reCAPTCHA verification
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    })

    const data = await response.json()
    return data.success && data.score > 0.5
  } catch (error) {
    moduleLogger.error('reCAPTCHA verification failed', {}, error as Error)
    return false
  }
}

// Send welcome email
async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: 'Farm Companion <hello@farmcompanion.co.uk>',
      to: email,
      subject: '🎉 Welcome to Farm Companion!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Farm Companion</title>
          <style>
            body { margin: 0; padding: 0; font-family: 'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; color: #1E1F23; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; }
            .welcome-text { font-size: 18px; color: #1E1F23; margin-bottom: 24px; line-height: 1.6; }
            .features { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid #00C2B2; }
            .feature-item { margin: 16px 0; display: flex; align-items: center; }
            .feature-icon { color: #00C2B2; margin-right: 12px; font-size: 20px; }
            .cta-button { display: inline-block; background: #00C2B2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { background: #1E1F23; color: white; padding: 24px; text-align: center; border-radius: 0 0 12px 12px; }
            .unsubscribe { color: #A0A0A0; font-size: 12px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Farm Companion!</h1>
            </div>
            
            <div class="content">
              <p class="welcome-text">Hello ${name},</p>
              
              <p class="welcome-text">
                Thank you for subscribing to Farm Companion! You're now part of our community of food lovers, 
                farm enthusiasts, and local produce supporters.
              </p>
              
              <div class="features">
                <h3 style="margin: 0 0 16px 0; color: #00C2B2; font-size: 20px; font-weight: 600;">What you'll receive:</h3>
                <div class="feature-item">
                  <span class="feature-icon">🌱</span>
                  <span>Seasonal produce guides and what's fresh now</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🏡</span>
                  <span>New farm shop discoveries and features</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📸</span>
                  <span>Community highlights and farm stories</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🎁</span>
                  <span>Exclusive offers and early access to events</span>
                </div>
              </div>
              
              <a href="https://farmcompanion.co.uk/map" class="cta-button">Explore Farm Shops</a>
              
              <p style="font-size: 14px; color: #6F6F6F; margin-top: 32px;">
                We respect your privacy and will never share your email with third parties. 
                You can unsubscribe at any time using the link below.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-size: 14px; opacity: 0.8;">
                Farm Companion - Connecting you with real food, real people, and real places
              </p>
              <p class="unsubscribe">
                <a href="https://farmcompanion.co.uk/unsubscribe?email=${encodeURIComponent(email)}" style="color: #A0A0A0;">
                  Unsubscribe
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    moduleLogger.info('Welcome email sent successfully', { email, name })
    return true
  } catch (error) {
    moduleLogger.error('Failed to send welcome email', { email, name }, error as Error)
    return false
  }
}

// Store subscription (in production, use database)
async function storeSubscription(email: string, name: string, source?: string) {
  // TODO: Implement database storage
  // For now, just log the subscription
  moduleLogger.info('New newsletter subscription', {
    email,
    name,
    source,
    timestamp: new Date().toISOString()
  })
  return true
}

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/newsletter/subscribe', request)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'

  try {
    logger.info('Processing newsletter subscription request', { ip })

    // CSRF protection
    if (!checkCsrf(request)) {
      logger.warn('CSRF protection failed', { ip })
      throw errors.authorization('CSRF protection failed')
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'newsletter', limit: 5, windowSec: 3600 })
    if (!await rl.consume(ip)) {
      logger.warn('Rate limit exceeded for newsletter subscription', { ip })
      throw errors.rateLimit('Too many subscription attempts. Please try again later.')
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      throw errors.validation('Invalid JSON in request body')
    }
    
    // Validate input using comprehensive validation
    let subscriptionData
    try {
      subscriptionData = await validateAndSanitize(ValidationSchemas.newsletterSubscription, body, {
        sanitize: true,
        strict: false
      })
    } catch (error) {
      if (error instanceof InputValidationError) {
        logger.warn('Validation failed for newsletter subscription', {
          ip,
          field: error.field,
          message: error.message
        })
        throw errors.validation(error.message, { field: error.field })
      }
      throw errors.validation('Invalid input data')
    }

    const { email, name, recaptchaToken, source, hp, t } = subscriptionData

    logger.info('Validating subscription request', { ip, email, source })

    // Anti-spam checks
    if (hp) {
      logger.warn('Honeypot triggered for newsletter subscription', { ip })
      return NextResponse.json({ ok: true }) // honeypot triggered
    }

    if (Date.now() - t < 1500) {
      logger.warn('Submission too fast (possible bot)', { ip })
      return NextResponse.json({ ok: true }) // too fast submission
    }

    // reCAPTCHA verification (if token provided)
    if (recaptchaToken && !(await verifyRecaptcha(recaptchaToken))) {
      logger.warn('reCAPTCHA verification failed', { ip, email })
      throw errors.validation('Security verification failed. Please try again.')
    }
    
    // Additional bot protection checks
    const suspiciousPatterns = [
      /^test@/i,
      /^admin@/i,
      /^info@/i,
      /^noreply@/i,
      /^mail@/i,
      /^webmaster@/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
      logger.warn('Suspicious email pattern detected', { ip, email })
      // Don't block, but log for monitoring
    }

    // Store subscription
    await storeSubscription(email, name, source)

    // Send welcome email
    const emailSent = await sendWelcomeEmail(email, name)

    logger.info('Newsletter subscription completed successfully', {
      ip,
      email,
      name,
      source,
      emailSent
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to Farm Companion newsletter!',
      emailSent
    })

  } catch (error) {
    return handleApiError(error, 'api/newsletter/subscribe', { ip })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Newsletter subscription endpoint',
    features: [
      'Email validation',
      'Rate limiting',
      'Bot protection',
      'reCAPTCHA integration',
      'Welcome emails',
      'GDPR compliance'
    ]
  })
}
