import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Redis connection...')
    
    // Test basic Redis operations
    await redis.set('test:key', 'test:value')
    const value = await redis.get('test:key')
    await redis.del('test:key')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Redis is working',
      testValue: value
    })
  } catch (error) {
    console.error('Redis test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
