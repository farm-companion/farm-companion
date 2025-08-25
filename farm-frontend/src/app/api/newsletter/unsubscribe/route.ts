// Newsletter Unsubscribe API
// GDPR Compliant Unsubscribe Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema
const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().optional() // Optional security token
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = unsubscribeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    
    const { email } = validation.data
    
    // TODO: Implement actual unsubscribe logic with database
    // For now, just log the unsubscribe request
    console.log('Unsubscribe request:', { email, timestamp: new Date().toISOString() })
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from Farm Companion newsletter.'
    })
    
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter is required' },
      { status: 400 }
    )
  }
  
  // TODO: Implement actual unsubscribe logic
  console.log('Unsubscribe via GET:', { email, timestamp: new Date().toISOString() })
  
  return NextResponse.json({
    success: true,
    message: 'Successfully unsubscribed from Farm Companion newsletter.'
  })
}
