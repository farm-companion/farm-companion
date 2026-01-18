import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import createRateLimiter from '@/lib/rate-limit'
import { checkCsrf } from '@/lib/csrf'
import { validateAndSanitize, ValidationSchemas, ValidationError as InputValidationError } from '@/lib/input-validation'

// Lazy-initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Email sending function with Resend API
async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    const client = getResend()
    const result = await client.emails.send({
      from: 'Farm Companion <hello@farmcompanion.co.uk>',
      to: [to],
      subject: subject,
      html: html,
      text: text,
      replyTo: 'hello@farmcompanion.co.uk'
    })

    console.log('Email sent successfully:', result)
    return result
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}

// Generate feedback ID
function generateFeedbackId(): string {
  return `FB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!checkCsrf(request)) {
      return NextResponse.json({ error: 'CSRF protection failed' }, { status: 400 })
    }

    // Rate limiting
    const rl = createRateLimiter({ keyPrefix: 'feedback', limit: 10, windowSec: 3600 })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'
    if (!await rl.consume(ip)) {
      return NextResponse.json({ error: 'Too many submissions. Please wait before submitting again.' }, { status: 429 })
    }

    // Parse and validate JSON
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    // Validate input using comprehensive validation
    let feedbackData
    try {
      feedbackData = await validateAndSanitize(ValidationSchemas.feedbackForm, body, {
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

    const { name, email, subject, message, hp, t } = feedbackData

    // Anti-spam checks
    if (hp) {
      return NextResponse.json({ ok: true }) // honeypot triggered
    }
    
    if (Date.now() - t < 1500) {
      return NextResponse.json({ ok: true }) // too fast submission
    }



    // Generate feedback ID
    const feedbackId = generateFeedbackId()
    const timestamp = new Date().toISOString()

    // Store feedback in database (placeholder)
    // TODO: Implement database storage
    console.log('Storing feedback:', {
      id: feedbackId,
      name,
      email,
      subject,
      message,
      timestamp,
      status: 'pending'
    })

    // Send confirmation email to user with enhanced PuredgeOS 3.0 styling
    const userEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank you for your feedback - Farm Companion</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px 24px; background: #f9f9f7; }
          .greeting { color: #1E1F23; font-size: 18px; font-weight: 600; margin-bottom: 16px; }
          .message { color: #6F6F6F; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
          .feedback-card { background: white; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .feedback-item { margin: 12px 0; }
          .feedback-label { color: #1E1F23; font-weight: 600; font-size: 14px; }
          .feedback-value { color: #6F6F6F; font-size: 14px; margin-top: 4px; }
          .feedback-message { color: #1E1F23; font-size: 14px; line-height: 1.5; white-space: pre-wrap; margin-top: 8px; }
          .response-time { background: linear-gradient(135deg, #D4FF4F 0%, #C4EF3F 100%); padding: 16px; border-radius: 8px; margin: 24px 0; }
          .response-time h3 { color: #1E1F23; margin: 0 0 8px 0; font-size: 16px; font-weight: 600; }
          .response-time p { color: #1E1F23; margin: 0; font-size: 14px; }
          .contact-info { background: #E4E2DD; padding: 16px; border-radius: 8px; margin: 24px 0; }
          .contact-info a { color: #00C2B2; text-decoration: none; font-weight: 600; }
          .footer { background: #1E1F23; color: white; padding: 24px; text-align: center; }
          .footer p { margin: 0; font-size: 14px; opacity: 0.8; }
          .signature { color: #6F6F6F; font-size: 16px; margin-top: 24px; }
          .signature strong { color: #1E1F23; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Farm Companion</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Thank you for your feedback!</div>
            
            <div class="message">
              Hi ${name},<br><br>
              We've received your feedback and appreciate you taking the time to share your thoughts with us. Your input helps us improve and serve our community better.
            </div>
            
            <div class="feedback-card">
              <div class="feedback-item">
                <div class="feedback-label">Feedback ID</div>
                <div class="feedback-value">${feedbackId}</div>
              </div>
              <div class="feedback-item">
                <div class="feedback-label">Subject</div>
                <div class="feedback-value">${subject}</div>
              </div>
              <div class="feedback-item">
                <div class="feedback-label">Your Message</div>
                <div class="feedback-message">${message}</div>
              </div>
            </div>
            
            <div class="response-time">
              <h3>⏱️ Response Time</h3>
              <p>We typically respond within 24-48 hours during business days (Monday-Friday, 9 AM - 6 PM GMT).</p>
            </div>
            
            <div class="contact-info">
              <strong>Need immediate assistance?</strong><br>
              Email us directly at <a href="mailto:hello@farmcompanion.co.uk">hello@farmcompanion.co.uk</a>
            </div>
            
            <div class="signature">
              Best regards,<br>
              <strong>The Farm Companion Team</strong>
            </div>
          </div>
          
          <div class="footer">
            <p>The UK's premium guide to real food, real people, and real places.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const userEmailText = `
Thank you for your feedback!

Hi ${name},

We've received your feedback and appreciate you taking the time to share your thoughts with us. Your input helps us improve and serve our community better.

FEEDBACK DETAILS:
================
Feedback ID: ${feedbackId}
Subject: ${subject}
Message: ${message}

RESPONSE TIME:
==============
We typically respond within 24-48 hours during business days (Monday-Friday, 9 AM - 6 PM GMT).

IMMEDIATE ASSISTANCE:
====================
If you need immediate assistance, please email us directly at:
hello@farmcompanion.co.uk

Best regards,
The Farm Companion Team

---
The UK's premium guide to real food, real people, and real places.
    `

    await sendEmail(
      email,
      'Thank you for your feedback - Farm Companion',
      userEmailHtml,
      userEmailText
    )

    // Send notification email to admin with enhanced PuredgeOS 3.0 styling
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Feedback Received - Farm Companion</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px 24px; background: #f9f9f7; }
          .title { color: #1E1F23; font-size: 24px; font-weight: 700; margin-bottom: 16px; }
          .subtitle { color: #6F6F6F; font-size: 16px; margin-bottom: 24px; }
          .feedback-card { background: white; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .feedback-item { margin: 16px 0; }
          .feedback-label { color: #1E1F23; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .feedback-value { color: #6F6F6F; font-size: 16px; margin-top: 4px; }
          .feedback-message { color: #1E1F23; font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin-top: 8px; background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #00C2B2; }
          .priority-badge { display: inline-block; background: linear-gradient(135deg, #D4FF4F 0%, #C4EF3F 100%); color: #1E1F23; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
          .action-section { background: linear-gradient(135deg, #E4E2DD 0%, #D4D2CD 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; }
          .reply-button { display: inline-block; background: linear-gradient(135deg, #00C2B2 0%, #00A896 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s ease; }
          .reply-button:hover { transform: translateY(-2px); }
          .response-time { background: #FF5A5F; color: white; padding: 16px; border-radius: 8px; margin: 24px 0; }
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
            <div class="priority-badge">⚠️ New Feedback Requires Attention</div>
            <div class="title">New Feedback Received</div>
            <div class="subtitle">A user has submitted feedback that requires your response</div>
            
            <div class="feedback-card">
              <div class="feedback-item">
                <div class="feedback-label">Feedback ID</div>
                <div class="feedback-value">${feedbackId}</div>
              </div>
              <div class="feedback-item">
                <div class="feedback-label">From</div>
                <div class="feedback-value">${name} (${email})</div>
              </div>
              <div class="feedback-item">
                <div class="feedback-label">Subject</div>
                <div class="feedback-value">${subject}</div>
              </div>
              <div class="feedback-item">
                <div class="feedback-label">Message</div>
                <div class="feedback-message">${message}</div>
              </div>
              <div class="feedback-item">
                <div class="feedback-label">Submitted</div>
                <div class="feedback-value">${new Date(timestamp).toLocaleString('en-GB', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZone: 'Europe/London'
                })}</div>
              </div>
            </div>
            
            <div class="response-time">
              <h3>⏰ Response Required</h3>
              <p>Please respond to this feedback within 24-48 hours to maintain our high service standards.</p>
            </div>
            
            <div class="action-section">
              <a href="mailto:${email}?subject=Re: ${subject}&body=Hi ${name},%0D%0A%0D%0AThank you for your feedback regarding: ${subject}%0D%0A%0D%0A[Your response here]%0D%0A%0D%0ABest regards,%0D%0AThe Farm Companion Team" class="reply-button">
                📧 Reply to User
              </a>
            </div>
            
            <div class="timestamp">
              Feedback ID: ${feedbackId} | Received: ${new Date(timestamp).toISOString()}
            </div>
          </div>
          
          <div class="footer">
            <p>The UK's premium guide to real food, real people, and real places.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const adminEmailText = `
⚠️ NEW FEEDBACK REQUIRES ATTENTION ⚠️

Farm Companion - Feedback Notification
=====================================

FEEDBACK DETAILS:
================
Feedback ID: ${feedbackId}
From: ${name} (${email})
Subject: ${subject}
Message: ${message}
Submitted: ${new Date(timestamp).toLocaleString('en-GB', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit',
  timeZone: 'Europe/London'
})}

RESPONSE REQUIRED:
=================
Please respond to this feedback within 24-48 hours to maintain our high service standards.

REPLY TO USER:
==============
Email: ${email}
Subject: Re: ${subject}

QUICK REPLY TEMPLATE:
====================
Hi ${name},

Thank you for your feedback regarding: ${subject}

[Your response here]

Best regards,
The Farm Companion Team

---
The UK's premium guide to real food, real people, and real places.
    `

    await sendEmail(
      'hello@farmcompanion.co.uk',
      `New Feedback Received - ${subject}`,
      adminEmailHtml,
      adminEmailText
    )

    return NextResponse.json(
      { 
        message: 'Feedback submitted successfully',
        feedbackId,
        timestamp
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
