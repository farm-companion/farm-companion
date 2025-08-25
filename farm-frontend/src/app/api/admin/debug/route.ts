import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Only allow this in development or with a secret key
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
      adminPasswordSet: !!process.env.ADMIN_PASSWORD,
      adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
      adminPasswordPreview: process.env.ADMIN_PASSWORD ? 
        `${process.env.ADMIN_PASSWORD.substring(0, 4)}...${process.env.ADMIN_PASSWORD.substring(-4)}` : 
        'NOT SET'
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
