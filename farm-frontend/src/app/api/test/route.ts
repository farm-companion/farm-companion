import { NextResponse } from 'next/server'
import redis, { ensureConnection } from '@/lib/redis'

export async function GET() {
  try {
    const client = await ensureConnection()
    const testKey = 'test:connection'
    await client.set(testKey, 'test-value')
    const result = await client.get(testKey)
    await client.del(testKey)
    
    return NextResponse.json({
      status: 'ok',
      redis: 'connected',
      test: result
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
