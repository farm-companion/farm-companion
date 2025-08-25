import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Get the expected credentials (trimmed)
    const expectedEmail = (process.env.ADMIN_EMAIL || 'admin@farmcompanion.co.uk').trim()
    const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim()

    // Log everything for debugging
    console.log('=== AUTH TEST ===')
    console.log('Submitted email:', email)
    console.log('Expected email:', expectedEmail)
    console.log('Email match:', email.trim() === expectedEmail)
    console.log('Submitted password length:', password.length)
    console.log('Expected password length:', expectedPassword.length)
    console.log('Password match:', password.trim() === expectedPassword)
    console.log('Environment variables:')
    console.log('- ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET')
    console.log('- ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '[SET]' : '[NOT SET]')
    console.log('==================')

    return NextResponse.json({
      success: true,
      submitted: {
        email: email.trim(),
        passwordLength: password.length,
        passwordPreview: password.substring(0, 4) + '...'
      },
      expected: {
        email: expectedEmail,
        passwordLength: expectedPassword.length,
        passwordPreview: expectedPassword.substring(0, 4) + '...'
      },
      match: {
        email: email.trim() === expectedEmail,
        password: password.trim() === expectedPassword
      },
      environment: {
        adminEmailSet: !!process.env.ADMIN_EMAIL,
        adminPasswordSet: !!process.env.ADMIN_PASSWORD
      }
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed' 
    }, { status: 500 })
  }
}
