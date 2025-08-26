import { kv } from '@vercel/kv'

export interface SecurityEvent {
  timestamp: number
  type: 'rate_limit' | 'csrf_violation' | 'spam_detected' | 'upload_attempt' | 'consent_update' | 'error'
  ip: string
  userAgent?: string
  path: string
  method: string
  details: Record<string, any>
}

export interface MetricsData {
  route: string
  statusCode: number
  responseTime: number
  timestamp: number
}

// Log security events to KV
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    console.warn('KV not configured, skipping security event logging')
    return
  }

  try {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    }

    // Store in KV with TTL (30 days)
    const key = `security:${fullEvent.timestamp}:${fullEvent.ip}`
    await kv.setex(key, 60 * 60 * 24 * 30, fullEvent)

    // Also increment counters for monitoring
    const counterKey = `metrics:security:${fullEvent.type}:${Math.floor(Date.now() / (60 * 60 * 1000))}` // Hourly bucket
    await kv.incr(counterKey)
    await kv.expire(counterKey, 60 * 60 * 24) // 24 hour TTL

  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Log API metrics
export async function logAPIMetrics(data: MetricsData): Promise<void> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    return
  }

  try {
    // Store response time metrics
    const metricsKey = `metrics:api:${data.route}:${Math.floor(Date.now() / (60 * 1000))}` // Minute bucket
    await kv.lpush(metricsKey, JSON.stringify(data))
    await kv.expire(metricsKey, 60 * 60) // 1 hour TTL

    // Increment status code counters
    const statusKey = `metrics:status:${data.statusCode}:${Math.floor(Date.now() / (60 * 60 * 1000))}` // Hourly bucket
    await kv.incr(statusKey)
    await kv.expire(statusKey, 60 * 60 * 24) // 24 hour TTL

  } catch (error) {
    console.error('Failed to log API metrics:', error)
  }
}

// Get security event summary
export async function getSecuritySummary(hours: number = 24): Promise<Record<string, number>> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    return {}
  }

  try {
    const now = Date.now()
    const startTime = now - (hours * 60 * 60 * 1000)
    
    const summary: Record<string, number> = {}
    
    // Get counts for different event types
    const eventTypes = ['rate_limit', 'csrf_violation', 'spam_detected', 'upload_attempt', 'consent_update', 'error']
    
    for (const eventType of eventTypes) {
      let total = 0
      const hourCount = Math.ceil(hours)
      
      for (let i = 0; i < hourCount; i++) {
        const bucketTime = Math.floor((now - (i * 60 * 60 * 1000)) / (60 * 60 * 1000))
        const key = `metrics:security:${eventType}:${bucketTime}`
        const count = await kv.get(key) || 0
        total += Number(count)
      }
      
      summary[eventType] = total
    }
    
    return summary
  } catch (error) {
    console.error('Failed to get security summary:', error)
    return {}
  }
}

// Get API performance metrics
export async function getAPIMetrics(route: string, minutes: number = 60): Promise<{
  avgResponseTime: number
  requestCount: number
  errorRate: number
}> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    return { avgResponseTime: 0, requestCount: 0, errorRate: 0 }
  }

  try {
    const now = Date.now()
    const startTime = now - (minutes * 60 * 1000)
    
    let totalResponseTime = 0
    let requestCount = 0
    let errorCount = 0
    
    // Collect metrics from recent buckets
    for (let i = 0; i < minutes; i++) {
      const bucketTime = Math.floor((now - (i * 60 * 1000)) / (60 * 1000))
      const key = `metrics:api:${route}:${bucketTime}`
      const metrics = await kv.lrange(key, 0, -1)
      
      for (const metricStr of metrics) {
        try {
          const metric = JSON.parse(metricStr) as MetricsData
          if (metric.timestamp >= startTime) {
            totalResponseTime += metric.responseTime
            requestCount++
            if (metric.statusCode >= 400) {
              errorCount++
            }
          }
        } catch {
          // Skip invalid metrics
        }
      }
    }
    
    return {
      avgResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
      requestCount,
      errorRate: requestCount > 0 ? errorCount / requestCount : 0,
    }
  } catch (error) {
    console.error('Failed to get API metrics:', error)
    return { avgResponseTime: 0, requestCount: 0, errorRate: 0 }
  }
}

// Clean up old metrics (run periodically)
export async function cleanupOldMetrics(): Promise<void> {
  if (!process.env.VERCEL_KV_REST_API_URL) {
    return
  }

  try {
    const now = Date.now()
    const cutoff = now - (7 * 24 * 60 * 60 * 1000) // 7 days ago
    
    // This would require scanning keys, which might not be efficient in KV
    // In practice, you'd use TTLs and let them expire naturally
    console.log('Metrics cleanup completed (using TTL-based expiration)')
  } catch (error) {
    console.error('Failed to cleanup old metrics:', error)
  }
}
