import { NextResponse } from 'next/server'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  const logger = createRouteLogger('api/test-env')

  try {
    logger.info('Testing environment variables')

    const envVars = {
      REDIS_URL: process.env.REDIS_URL ? 'set' : 'not set',
      PHOTO_MAX_MB: process.env.PHOTO_MAX_MB,
      PHOTO_ALLOWED_TYPES: process.env.PHOTO_ALLOWED_TYPES,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    }

    logger.info('Environment variables retrieved', { envVars })

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      envVars
    })
  } catch (error) {
    return handleApiError(error, 'api/test-env')
  }
}
