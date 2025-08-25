import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called')
    
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('Form data received:', { email, password: password ? '[REDACTED]' : 'undefined' })

    // Validate input
    if (!email || !password) {
      console.log('Missing credentials:', { hasEmail: !!email, hasPassword: !!password })
      return NextResponse.redirect(new URL('/admin/login?error=missing-credentials', request.url))
    }

    // Authenticate user
    console.log('Calling authenticateAdmin...')
    const result = await authenticateAdmin(email, password)
    console.log('Authentication result:', { success: result.success, error: result.error })

    if (result.success) {
      console.log('Authentication successful, redirecting to admin dashboard')
      // Redirect to admin dashboard on success
      return NextResponse.redirect(new URL('/admin', request.url))
    } else {
      console.log('Authentication failed, redirecting back to login with error')
      // Redirect back to login with error
      return NextResponse.redirect(new URL(`/admin/login?error=invalid-credentials`, request.url))
    }

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.redirect(new URL('/admin/login?error=server-error', request.url))
  }
}
