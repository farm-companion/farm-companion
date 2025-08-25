// Admin Authentication System
// PuredgeOS 3.0 Compliant Security

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Admin credentials (in production, use environment variables)
const ADMIN_CREDENTIALS = {
  email: (process.env.ADMIN_EMAIL || 'admin@farmcompanion.co.uk').trim(),
  password: (process.env.ADMIN_PASSWORD || 'admin123').trim() // Change this in production!
}

// Session management
const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface AdminUser {
  email: string
  name: string
  role: 'admin'
  permissions: string[]
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    
    if (!session) {
      console.log('No session cookie found')
      return false
    }
    
    const sessionData = JSON.parse(session.value)
    const now = Date.now()
    
    // Check if session is expired
    if (sessionData.expiresAt < now) {
      console.log('Session expired')
      return false
    }
    
    console.log('User is authenticated:', sessionData.email)
    return true
  } catch (error) {
    console.error('Authentication check failed:', error)
    return false
  }
}

// Get current admin user
export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    
    if (!session) return null
    
    const sessionData = JSON.parse(session.value)
    const now = Date.now()
    
    // Check if session is expired
    if (sessionData.expiresAt < now) {
      return null
    }
    
    return {
      email: sessionData.email,
      name: sessionData.name,
      role: 'admin',
      permissions: ['photo_management', 'claims_management', 'user_management']
    }
  } catch (error) {
    console.error('Get current user failed:', error)
    return null
  }
}

// Authenticate admin user
export async function authenticateAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== AUTHENTICATION DEBUG ===')
    console.log('Attempting authentication for:', email)
    console.log('Expected email:', ADMIN_CREDENTIALS.email)
    console.log('Email match:', email === ADMIN_CREDENTIALS.email)
    console.log('Password length received:', password.length)
    console.log('Expected password length:', ADMIN_CREDENTIALS.password.length)
    console.log('Password match:', password === ADMIN_CREDENTIALS.password)
    console.log('Environment variables:')
    console.log('- ADMIN_EMAIL:', process.env.ADMIN_EMAIL)
    console.log('- ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '[SET]' : '[NOT SET]')
    console.log('============================')
    
    // Validate credentials (trim both submitted and expected values)
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    
    if (trimmedEmail !== ADMIN_CREDENTIALS.email || trimmedPassword !== ADMIN_CREDENTIALS.password) {
      console.log('Authentication failed: Invalid credentials')
      console.log('Email comparison:', `"${trimmedEmail}" === "${ADMIN_CREDENTIALS.email}"`)
      console.log('Password comparison:', `"${trimmedPassword}" === "${ADMIN_CREDENTIALS.password}"`)
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }
    
    // Create session data
    const sessionData = {
      email: ADMIN_CREDENTIALS.email,
      name: 'Farm Companion Admin',
      expiresAt: Date.now() + SESSION_DURATION
    }
    
    console.log('Creating session for:', sessionData.email)
    
    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000
    })
    
    console.log('Session created successfully')
    return { success: true }
  } catch (error) {
    console.error('Authentication failed:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

// Logout admin user
export async function logoutAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Require authentication middleware
export async function requireAuth(): Promise<AdminUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    console.log('No authenticated user found, redirecting to login')
    redirect('/admin/login')
  }
  
  return user
}

// Check if user has specific permission
export function hasPermission(user: AdminUser, permission: string): boolean {
  return user.permissions.includes(permission)
}
