import { SITE_URL } from './site'
import { logger } from '@/lib/logger'

const securityLogger = logger.child({ route: 'lib/security' })

// CSRF protection: check origin and referer headers
export function checkCsrf(req: Request): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const allowed = new URL(SITE_URL).origin
  
  // Check origin header first (more reliable)
  if (origin && origin === allowed) {
    return true
  }
  
  // Fallback to referer header
  if (referer && referer.startsWith(allowed)) {
    return true
  }
  
  return false
}

// Safe redirect helper - only allow relative paths you control
export function safePath(p: string): string {
  if (p.startsWith('/') && !p.startsWith('//') && !p.includes('..')) {
    return p
  }
  return '/'
}

// Honeypot field validation
export function validateHoneypot(hp?: string): boolean {
  // If honeypot field is filled, it's likely a bot
  return !hp || hp.trim() === ''
}

// Form submission time validation
export function validateSubmissionTime(timestamp: number): boolean {
  const now = Date.now()
  const timeDiff = now - timestamp
  
  // Must be at least 1.5 seconds after page load (prevents instant submissions)
  if (timeDiff < 1500) {
    return false
  }
  
  // Must not be more than 1 hour old (prevents replay attacks)
  if (timeDiff > 3600000) {
    return false
  }
  
  return true
}

// Cloudflare Turnstile verification
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    securityLogger.warn('TURNSTILE_SECRET_KEY not configured')
    return true // Allow if not configured
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    })
    
    const result = await response.json()
    return result.success === true
  } catch (error) {
    securityLogger.error('Turnstile verification failed', { ip }, error as Error)
    return false
  }
}

// Content validation for spam detection
export function validateContent(content: string): { valid: boolean; reason?: string } {
  // Check for excessive links
  const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length
  if (linkCount > 3) {
    return { valid: false, reason: 'Too many links' }
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /buy.*viagra/i,
    /casino.*online/i,
    /loan.*quick/i,
    /click.*here/i,
    /free.*money/i,
    /make.*money.*fast/i,
    /weight.*loss/i,
    /diet.*pill/i,
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(content))) {
    return { valid: false, reason: 'Suspicious content detected' }
  }
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (capsRatio > 0.7) {
    return { valid: false, reason: 'Too much capitalization' }
  }
  
  // Check for excessive punctuation
  const punctRatio = (content.match(/[!?]{2,}/g) || []).length
  if (punctRatio > 2) {
    return { valid: false, reason: 'Excessive punctuation' }
  }
  
  return { valid: true }
}

// IP reputation tracking (basic implementation)
export async function trackIPReputation(ip: string, action: 'success' | 'failure' | 'spam'): Promise<void> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    return // Skip if KV not configured
  }
  
  try {
    const key = `reputation:${ip}`
    const now = Date.now()
    
    // Get current reputation
    const current = await fetch(`${process.env.VERCEL_KV_REST_API_URL}/get/${key}`, {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_KV_REST_API_TOKEN}`,
      },
    }).then(res => res.json()).catch(() => ({ result: null }))
    
    const reputationData = current.result || { score: 0, lastAction: now, actions: [] }
    
    // Update score based on action
    switch (action) {
      case 'success':
        reputationData.score = Math.max(0, reputationData.score - 1) // Reduce negative score
        break
      case 'failure':
        reputationData.score += 1
        break
      case 'spam':
        reputationData.score += 5
        break
    }
    
    // Keep only last 10 actions
    reputationData.actions = [
      ...reputationData.actions.slice(-9),
      { action, timestamp: now }
    ]
    reputationData.lastAction = now
    
    // Store updated reputation
    await fetch(`${process.env.VERCEL_KV_REST_API_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reputationData),
    })
  } catch (error) {
    securityLogger.error('Failed to track IP reputation', { ip, action }, error as Error)
  }
}

// Check if IP is blocked due to reputation
export async function isIPBlocked(ip: string): Promise<boolean> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    return false // Allow if KV not configured
  }
  
  try {
    const key = `reputation:${ip}`
    const response = await fetch(`${process.env.VERCEL_KV_REST_API_URL}/get/${key}`, {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_KV_REST_API_TOKEN}`,
      },
    })
    
    const result = await response.json()
    if (result.result && result.result.score >= 10) {
      return true // Block if score is 10 or higher
    }
    
    return false
  } catch (error) {
    securityLogger.error('Failed to check IP reputation', { ip }, error as Error)
    return false // Allow if check fails
  }
}
