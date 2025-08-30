// Admin Authentication System
// PuredgeOS 3.0 Compliant Security

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

// Extend global type for auth attempts tracking
declare global {
  var authAttempts: Record<string, number> | undefined
  var authAttemptsTime: Record<string, number> | undefined
}

// Admin credentials - MUST be set via environment variables
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL?.trim() || '',
  password: process.env.ADMIN_PASSWORD?.trim() || ''
}

// Validate admin credentials are configured
function validateAdminCredentials(): void {
  if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
    throw new Error('Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.')
  }
  
  // Ensure password meets minimum security requirements
  if (ADMIN_CREDENTIALS.password.length < 12) {
    throw new Error('Admin password must be at least 12 characters long.')
  }
  
  // Log security warning if using default email
  if (ADMIN_CREDENTIALS.email === 'admin@farmcompanion.co.uk') {
    console.warn('⚠️  SECURITY: Using default admin email. Consider changing ADMIN_EMAIL.')
  }
}

// Session management
const SESSION_COOKIE = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Rate limiting for authentication attempts
const AUTH_ATTEMPTS_KEY = 'auth_attempts'
const AUTH_ATTEMPTS_WINDOW = 15 * 60 * 1000 // 15 minutes

// Get authentication attempts for an email
async function getAuthAttempts(email: string): Promise<number> {
  try {
    // For now, use a simple in-memory approach
    // In production, this should use Redis or similar
    const attempts = global.authAttempts?.[email] || 0
    const lastAttempt = global.authAttemptsTime?.[email] || 0
    
    // Reset if window has passed
    if (Date.now() - lastAttempt > AUTH_ATTEMPTS_WINDOW) {
      return 0
    }
    
    return attempts
  } catch (error) {
    console.error('Failed to get auth attempts:', error)
    return 0
  }
}

// Increment authentication attempts for an email
async function incrementAuthAttempts(email: string): Promise<void> {
  try {
    // Initialize global storage if not exists
    if (!global.authAttempts) global.authAttempts = {}
    if (!global.authAttemptsTime) global.authAttemptsTime = {}
    
    global.authAttempts[email] = (global.authAttempts[email] || 0) + 1
    global.authAttemptsTime[email] = Date.now()
  } catch (error) {
    console.error('Failed to increment auth attempts:', error)
  }
}

// Clear authentication attempts for an email (on successful login)
async function clearAuthAttempts(email: string): Promise<void> {
  try {
    if (global.authAttempts) {
      delete global.authAttempts[email]
    }
    if (global.authAttemptsTime) {
      delete global.authAttemptsTime[email]
    }
  } catch (error) {
    console.error('Failed to clear auth attempts:', error)
  }
}

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
    // Validate admin credentials are configured
    validateAdminCredentials()
    
    // Security logging (without exposing sensitive data)
    console.log('🔐 AUTH: Authentication attempt for:', email)
    console.log('🔐 AUTH: Credentials configured:', !!ADMIN_CREDENTIALS.email && !!ADMIN_CREDENTIALS.password)
    
    // Validate input
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    
    if (!trimmedEmail || !trimmedPassword) {
      console.log('🔐 AUTH: Failed - Empty credentials')
      return {
        success: false,
        error: 'Email and password are required'
      }
    }
    
    // Rate limiting check (basic implementation)
    const authAttempts = await getAuthAttempts(trimmedEmail)
    if (authAttempts > 5) {
      console.log('🔐 AUTH: Failed - Too many attempts for:', trimmedEmail)
      return {
        success: false,
        error: 'Too many login attempts. Please try again later.'
      }
    }
    
    // Validate credentials
    if (trimmedEmail !== ADMIN_CREDENTIALS.email || trimmedPassword !== ADMIN_CREDENTIALS.password) {
      await incrementAuthAttempts(trimmedEmail)
      console.log('🔐 AUTH: Failed - Invalid credentials for:', trimmedEmail)
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }
    
    // Clear failed attempts on successful authentication
    await clearAuthAttempts(trimmedEmail)
    
    // Create secure session data with unique ID
    const sessionId = crypto.randomUUID()
    const sessionData = {
      id: sessionId,
      email: ADMIN_CREDENTIALS.email,
      name: 'Farm Companion Admin',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    }
    
    console.log('🔐 AUTH: Success - Creating session for:', sessionData.email)
    
    // Set secure session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'strict', // Prevent CSRF
      maxAge: SESSION_DURATION / 1000,
      path: '/admin' // Restrict to admin paths
    })
    
    console.log('🔐 AUTH: Session created successfully')
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
