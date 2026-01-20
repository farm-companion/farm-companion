import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/login', request)

  try {
    logger.info('Processing admin login request')

    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    logger.info('Login form data received', {
      email,
      hasPassword: !!password
    })

    // Validate input
    if (!email || !password) {
      logger.warn('Missing login credentials', {
        hasEmail: !!email,
        hasPassword: !!password
      })
      return NextResponse.redirect(new URL('/admin/login?error=missing-credentials', request.url))
    }

    // Authenticate user
    logger.info('Attempting admin authentication', { email })
    const result = await authenticateAdmin(email, password)

    logger.info('Admin authentication result', {
      email,
      success: result.success,
      error: result.error
    })

    if (result.success) {
      logger.info('Admin authentication successful, redirecting to dashboard', { email })
      // Redirect to admin dashboard on success
      return NextResponse.redirect(new URL('/admin', request.url))
    } else {
      logger.warn('Admin authentication failed', {
        email,
        error: result.error
      })
      // Redirect back to login with error
      return NextResponse.redirect(new URL(`/admin/login?error=invalid-credentials`, request.url))
    }

  } catch (error) {
    logger.error('Admin login error', {}, error as Error)
    return NextResponse.redirect(new URL('/admin/login?error=server-error', request.url))
  }
}
