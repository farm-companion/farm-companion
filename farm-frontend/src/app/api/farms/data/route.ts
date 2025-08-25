import { NextResponse } from 'next/server'
import { getFarmData } from '@/lib/farm-data'

export async function GET() {
  try {
    const farms = await getFarmData()
    
    return NextResponse.json({
      farms,
      total: farms.length,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error serving farm data:', error)
    return NextResponse.json(
      { error: 'Failed to load farm data' },
      { status: 500 }
    )
  }
}
