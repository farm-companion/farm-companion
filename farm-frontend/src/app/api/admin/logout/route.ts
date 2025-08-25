import { NextRequest, NextResponse } from 'next/server'
import { logoutAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Logout the user
    await logoutAdmin()
    
    // Redirect to login page
    return NextResponse.redirect(new URL('/admin/login', request.url))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}
