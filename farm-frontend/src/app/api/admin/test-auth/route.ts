import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/test-auth', request)

  try {
    logger.info('Processing admin auth test request')

    // Require authentication to use this test endpoint
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('Unauthorized auth test attempt')
      throw errors.authorization('Unauthorized')
    }

    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      logger.warn('Missing credentials in auth test')
      throw errors.validation('Email and password are required')
    }

    // Get the expected credentials (trimmed)
    const expectedEmail = (process.env.ADMIN_EMAIL || 'admin@farmcompanion.co.uk').trim()
    const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim()

    const emailMatch = email.trim() === expectedEmail
    const passwordMatch = password.trim() === expectedPassword

    logger.info('Auth test comparison completed', {
      emailMatch,
      passwordMatch,
      submittedEmailLength: email.length,
      expectedEmailLength: expectedEmail.length,
      submittedPasswordLength: password.length,
      expectedPasswordLength: expectedPassword.length,
      adminEmailSet: !!process.env.ADMIN_EMAIL,
      adminPasswordSet: !!process.env.ADMIN_PASSWORD
    })

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
        email: emailMatch,
        password: passwordMatch
      },
      environment: {
        adminEmailSet: !!process.env.ADMIN_EMAIL,
        adminPasswordSet: !!process.env.ADMIN_PASSWORD
      }
    })
  } catch (error) {
    return handleApiError(error, 'api/admin/test-auth')
  }
}
