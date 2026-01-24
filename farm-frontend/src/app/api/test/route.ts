import { NextRequest, NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/test', request)

  try {
    logger.info('Processing Redis connection test')

    const client = await ensureConnection()
    const testKey = 'test:connection'
    await client.set(testKey, 'test-value')
    const value = await client.get(testKey)
    await client.del(testKey)

    logger.info('Redis connection test successful')

    return NextResponse.json({
      status: 'ok',
      redis: 'connected',
      test: value,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error, 'api/test')
  }
}
