import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing environment variables...')
    
    const envVars = {
      REDIS_URL: process.env.REDIS_URL ? 'set' : 'not set',
      PHOTO_MAX_MB: process.env.PHOTO_MAX_MB,
      PHOTO_ALLOWED_TYPES: process.env.PHOTO_ALLOWED_TYPES,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    }
    
    console.log('Environment variables:', envVars)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Environment variables check',
      envVars
    })
  } catch (error) {
    console.error('Environment test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
