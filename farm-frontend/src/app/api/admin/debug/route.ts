import { NextResponse } from 'next/server'
import { apiMiddleware } from '@/lib/api-middleware'
import { createRouteLogger } from '@/lib/logger'

const logger = createRouteLogger('api/admin/debug')

async function debugHandler() {
  logger.info('Processing admin debug info request')

  const response = {
    environment: process.env.NODE_ENV,
    adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
    adminPasswordPreview: process.env.ADMIN_PASSWORD ?
      `${process.env.ADMIN_PASSWORD.substring(0, 4)}...${process.env.ADMIN_PASSWORD.substring(-4)}` :
      'NOT SET',
    timestamp: new Date().toISOString()
  }

  logger.info('Admin debug info retrieved', {
    environment: response.environment,
    adminPasswordSet: response.adminPasswordSet
  })

  return NextResponse.json(response)
}

export const GET = apiMiddleware.admin(debugHandler)
