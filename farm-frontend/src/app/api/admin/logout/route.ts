import { NextRequest, NextResponse } from 'next/server'
import { logoutAdmin } from '@/lib/auth'
import { createRouteLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/admin/logout', request)

  try {
    logger.info('Processing admin logout request')

    // Logout the user
    await logoutAdmin()

    logger.info('Admin logout successful, redirecting to login page')

    // Redirect to login page
    return NextResponse.redirect(new URL('/admin/login', request.url))
  } catch (error) {
    logger.error('Admin logout error', {}, error as Error)
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}
