import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sending function with Resend API
async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      throw new Error('Email service not configured')
    }

    const result = await resend.emails.send({
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString()

    // Send confirmation email to user with PuredgeOS 3.0 styling
    const userEmailHtml = `
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
                <div class="message-value">${subject}</div>
              </div>
              <div class="message-item">
                <div class="message-label">Message</div>
                <div class="message-content">${message}</div>
              </div>
            </div>
            
            <div class="response-time">
              <h3>📧 What happens next?</h3>
              <p>We typically respond within 24-48 hours during business days (Monday-Friday, 9 AM - 6 PM GMT).</p>
            </div>
            
            <div class="timestamp">
              Received: ${new Date(timestamp).toLocaleString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'Europe/London'
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

    const userEmailText = `
MESSAGE RECEIVED - Farm Companion
================================

Thank you for reaching out to us!

MESSAGE DETAILS:
================
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
      'Message Received - Farm Companion',
      userEmailHtml,
      userEmailText
    )

    // Send notification email to admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message - Farm Companion</title>
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
            <div class="priority-badge">⚠️ New Contact Message Requires Attention</div>
            <div class="title">New Contact Message Received</div>
            <div class="subtitle">A user has sent a message that requires your response</div>
            
            <div class="message-card">
              <div class="message-item">
                <div class="message-label">From</div>
                <div class="message-value">${name} (${email})</div>
              </div>
              <div class="message-item">
                <div class="message-label">Subject</div>
                <div class="message-value">${subject}</div>
              </div>
              <div class="message-item">
                <div class="message-label">Message</div>
                <div class="message-content">${message}</div>
              </div>
              <div class="message-item">
                <div class="message-label">Submitted</div>
                <div class="message-value">${new Date(timestamp).toLocaleString('en-GB', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZone: 'Europe/London'
                })}</div>
              </div>
            </div>
            
            <div class="action-section">
              <a href="mailto:${email}?subject=Re: ${subject}&body=Hi ${name},%0D%0A%0D%0AThank you for your message regarding: ${subject}%0D%0A%0D%0A[Your response here]%0D%0A%0D%0ABest regards,%0D%0AThe Farm Companion Team" class="reply-button">
                📧 Reply to User
              </a>
            </div>
            
            <div class="response-time">
              <h3>⏰ Response Time Target</h3>
              <p>Please respond within 24-48 hours to maintain our high service standards.</p>
            </div>
            
            <div class="timestamp">
              Received: ${new Date(timestamp).toLocaleString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'Europe/London'
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

    const adminEmailText = `
⚠️ NEW CONTACT MESSAGE REQUIRES ATTENTION ⚠️

Farm Companion - Contact Message Notification
============================================

MESSAGE DETAILS:
================
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
Please respond to this message within 24-48 hours to maintain our high service standards.

REPLY TO USER:
==============
Email: ${email}
Subject: Re: ${subject}

QUICK REPLY TEMPLATE:
====================
Hi ${name},

Thank you for your message regarding: ${subject}

[Your response here]

Best regards,
The Farm Companion Team

---
The UK's premium guide to real food, real people, and real places.
    `

    await sendEmail(
      'hello@farmcompanion.co.uk',
      `New Contact Message - ${subject}`,
      adminEmailHtml,
      adminEmailText
    )

    return NextResponse.json(
      { message: 'Message sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
