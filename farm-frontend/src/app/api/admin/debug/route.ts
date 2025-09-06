import { NextResponse } from 'next/server'
import { apiMiddleware } from '@/lib/api-middleware'

async function debugHandler() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
    adminPasswordSet: !!process.env.ADMIN_PASSWORD,
    adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
    adminPasswordPreview: process.env.ADMIN_PASSWORD ? 
      `${process.env.ADMIN_PASSWORD.substring(0, 4)}...${process.env.ADMIN_PASSWORD.substring(-4)}` : 
      'NOT SET',
    timestamp: new Date().toISOString()
  })
}

export const GET = apiMiddleware.admin(debugHandler)
