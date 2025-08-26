import { kv } from '@vercel/kv'

export default function createRateLimiter({ 
  keyPrefix, 
  limit, 
  windowSec 
}: {
  keyPrefix: string
  limit: number
  windowSec: number
}) {
  return {
    async consume(key: string) {
      const now = Math.floor(Date.now() / 1000)
      const bucket = `${keyPrefix}:${key}:${Math.floor(now / windowSec)}`
      
      try {
        const count = await kv.incr(bucket)
        if (count === 1) {
          await kv.expire(bucket, windowSec)
        }
        return count <= limit
      } catch (error) {
        console.warn('Rate limiter KV error, falling back to in-memory:', error)
        // Fallback to in-memory rate limiting for development
        return true
      }
    }
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Contact form: 5 submissions per hour per IP
  contact: createRateLimiter({ keyPrefix: 'contact', limit: 5, windowSec: 3600 }),
  
  // Farm submission: 3 submissions per day per IP
  farmSubmission: createRateLimiter({ keyPrefix: 'farm-submit', limit: 3, windowSec: 86400 }),
  
  // Feedback: 10 submissions per hour per IP
  feedback: createRateLimiter({ keyPrefix: 'feedback', limit: 10, windowSec: 3600 }),
  
  // Newsletter: 3 subscriptions per hour per IP
  newsletter: createRateLimiter({ keyPrefix: 'newsletter', limit: 3, windowSec: 3600 }),
  
  // Image upload: 10 uploads per hour per IP
  upload: createRateLimiter({ keyPrefix: 'upload', limit: 10, windowSec: 3600 }),
  
  // General API: 100 requests per minute per IP
  api: createRateLimiter({ keyPrefix: 'api', limit: 100, windowSec: 60 }),
}

// Utility function to get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Utility function to apply rate limiting to a request
export async function applyRateLimit(
  req: Request, 
  limiter: ReturnType<typeof createRateLimiter>,
  identifier?: string
): Promise<{ allowed: boolean; remaining?: number }> {
  const ip = getClientIP(req)
  const key = identifier ? `${ip}:${identifier}` : ip
  const allowed = await limiter.consume(key)
  
  return { allowed }
}
