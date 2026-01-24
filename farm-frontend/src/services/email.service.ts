/**
 * Email Service
 * Handles all email sending operations using Resend API
 */

import { Resend } from 'resend'
import { createRouteLogger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Farm Companion <hello@farmcompanion.co.uk>'
const REPLY_TO_EMAIL = 'hello@farmcompanion.co.uk'
const ADMIN_EMAIL = process.env.CONTACT_TO_EMAIL || 'hello@farmcompanion.co.uk'

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
}

/**
 * Send a generic email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const logger = createRouteLogger('email.service')

  if (!process.env.RESEND_API_KEY) {
    logger.error('RESEND_API_KEY not configured')
    throw new Error('Email service not configured')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [options.to],
      subject: options.subject,
      replyTo: options.replyTo || REPLY_TO_EMAIL,
      html: options.html || options.text || '',
      text: options.text,
    })

    if (error) {
      throw error
    }

    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      resultId: data?.id,
    })
  } catch (error) {
    logger.error('Email sending failed', { to: options.to, subject: options.subject }, error as Error)
    throw error
  }
}

/**
 * Send contact form confirmation email to user
 */
export async function sendContactConfirmation(params: {
  email: string
  name: string
  subject: string
  message: string
  timestamp: string
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Received - Farm Companion</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; background: #f9f9f7; }
        .title { color: #1E1F23; font-size: 24px; font-weight: 700; margin-bottom: 16px; }
        .subtitle { color: #6F6F6F; font-size: 16px; margin-bottom: 24px; }
        .message-card { background: white; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .message-item { margin: 16px 0; }
        .message-label { color: #1E1F23; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .message-value { color: #6F6F6F; font-size: 16px; margin-top: 4px; }
        .message-content { color: #1E1F23; font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin-top: 8px; background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #00C2B2; }
        .response-time { background: #D4FF4F; color: #1E1F23; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .response-time h3 { margin: 0 0 8px 0; font-size: 16px; font-weight: 600; }
        .response-time p { margin: 0; font-size: 14px; opacity: 0.9; }
        .footer { background: #1E1F23; color: white; padding: 24px; text-align: center; }
        .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
        .timestamp { color: #6F6F6F; font-size: 12px; margin-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Farm Companion</h1>
        </div>

        <div class="content">
          <div class="title">Message Received</div>
          <div class="subtitle">Thank you for reaching out to us</div>

          <div class="message-card">
            <div class="message-item">
              <div class="message-label">Subject</div>
              <div class="message-value">${params.subject}</div>
            </div>
            <div class="message-item">
              <div class="message-label">Message</div>
              <div class="message-content">${params.message}</div>
            </div>
          </div>

          <div class="response-time">
            <h3>📧 What happens next?</h3>
            <p>We typically respond within 24-48 hours during business days (Monday-Friday, 9 AM - 6 PM GMT).</p>
          </div>

          <div class="timestamp">
            Received: ${new Date(params.timestamp).toLocaleString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/London',
            })}
          </div>
        </div>

        <div class="footer">
          <p>The UK's premium guide to real food, real people, and real places.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
MESSAGE RECEIVED - Farm Companion
================================

Thank you for reaching out to us!

MESSAGE DETAILS:
================
Subject: ${params.subject}
Message: ${params.message}

RESPONSE TIME:
==============
We typically respond within 24-48 hours during business days (Monday-Friday, 9 AM - 6 PM GMT).

Best regards,
The Farm Companion Team

---
The UK's premium guide to real food, real people, and real places.
  `

  await sendEmail({
    to: params.email,
    subject: 'Message Received - Farm Companion',
    html,
    text,
  })
}

/**
 * Send contact form notification to admin
 */
export async function sendContactNotification(params: {
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 32px 24px; background: #f9f9f7; }
        .message-card { background: white; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .message-item { margin: 16px 0; }
        .message-label { color: #1E1F23; font-weight: 600; font-size: 14px; text-transform: uppercase; }
        .message-value { color: #6F6F6F; font-size: 16px; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Message</h1>
        </div>
        <div class="content">
          <div class="message-card">
            <div class="message-item">
              <div class="message-label">From</div>
              <div class="message-value">${params.name} (${params.email})</div>
            </div>
            <div class="message-item">
              <div class="message-label">Subject</div>
              <div class="message-value">${params.subject}</div>
            </div>
            <div class="message-item">
              <div class="message-label">Message</div>
              <div class="message-value">${params.message}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
New Contact Message - Farm Companion

From: ${params.name} (${params.email})
Subject: ${params.subject}
Message: ${params.message}
Received: ${params.timestamp}
  `

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Contact Message - ${params.subject}`,
    html,
    text,
    replyTo: params.email,
  })
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcome(params: { email: string; name: string }): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .features { background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid #00C2B2; }
        .feature-item { margin: 16px 0; display: flex; align-items: center; }
        .feature-icon { color: #00C2B2; margin-right: 12px; font-size: 20px; }
        .cta-button { display: inline-block; background: #00C2B2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Farm Companion!</h1>
        </div>
        <div class="content">
          <p>Hello ${params.name},</p>
          <p>Thank you for subscribing to Farm Companion! You're now part of our community of food lovers, farm enthusiasts, and local produce supporters.</p>
          <div class="features">
            <h3 style="margin: 0 0 16px 0; color: #00C2B2;">What you'll receive:</h3>
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
          </div>
          <a href="https://farmcompanion.co.uk/map" class="cta-button">Explore Farm Shops</a>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to Farm Companion!

Hi ${params.name},

Thanks for subscribing! You're now part of our community.

What you'll receive:
- Seasonal produce guides
- New farm shop discoveries
- Community highlights

Explore farm shops: https://farmcompanion.co.uk/map

— The Farm Companion team
  `

  await sendEmail({
    to: params.email,
    subject: '🎉 Welcome to Farm Companion!',
    html,
    text,
  })
}

/**
 * Send feedback confirmation email
 */
export async function sendFeedbackConfirmation(params: {
  email: string
  name: string
  subject: string
  feedbackId: string
}): Promise<void> {
  const text = `
Hi ${params.name},

Thank you for your feedback! We've received it and will review it shortly.

Feedback ID: ${params.feedbackId}
Subject: ${params.subject}

Best regards,
The Farm Companion Team
  `

  await sendEmail({
    to: params.email,
    subject: 'Feedback Received - Farm Companion',
    text,
  })
}

/**
 * Send feedback notification to admin
 */
export async function sendFeedbackNotification(params: {
  name: string
  email: string
  subject: string
  message: string
  feedbackId: string
}): Promise<void> {
  const text = `
New Feedback Received

ID: ${params.feedbackId}
From: ${params.name} (${params.email})
Subject: ${params.subject}
Message: ${params.message}
  `

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Feedback Received - ${params.subject}`,
    text,
    replyTo: params.email,
  })
}
