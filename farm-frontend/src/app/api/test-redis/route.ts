import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  const logger = createRouteLogger('api/test-redis')

  try {
    logger.info('Testing Redis connection')

    // Test basic Redis operations
    await redis.set('test:key', 'test:value')
    const value = await redis.get('test:key')
    await redis.del('test:key')

    logger.info('Redis test completed successfully', { testValue: value })

    return NextResponse.json({
      success: true,
      message: 'Redis is working',
      testValue: value
    })
  } catch (error) {
    return handleApiError(error, 'api/test-redis')
  }
}
