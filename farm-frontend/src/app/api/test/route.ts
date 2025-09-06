import { NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { apiMiddleware } from '@/lib/api-middleware'
import { withRetry } from '@/lib/error-handler'

async function testHandler() {
  // Use retry logic for database operations
  const result = await withRetry(async () => {
    const client = await ensureConnection()
    const testKey = 'test:connection'
    await client.set(testKey, 'test-value')
    const value = await client.get(testKey)
    await client.del(testKey)
    return value
  }, 3, 1000)
  
  return NextResponse.json({
    status: 'ok',
    redis: 'connected',
    test: result,
    timestamp: new Date().toISOString()
  })
}

export const GET = apiMiddleware.basic(testHandler)
