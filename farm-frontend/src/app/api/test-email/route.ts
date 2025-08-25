// Test Email API Endpoint
// For debugging email functionality

import { NextResponse } from 'next/server'
import { testEmailService } from '@/lib/email'

export async function POST() {
  try {
    const result = await testEmailService()
    
    if (result.success) {
      return NextResponse.json(
        { message: 'Test email sent successfully' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint. Use POST to test email functionality.',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0
    }
  })
}
