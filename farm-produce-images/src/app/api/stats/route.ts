import { NextResponse } from 'next/server'
import { getProduceStats } from '@/lib/database'
import { ApiResponse, StatsResponse } from '@/types/api'

export async function GET(): Promise<NextResponse<ApiResponse<StatsResponse>>> {
  try {
    const stats = await getProduceStats()

    const response: StatsResponse = {
      stats,
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Stats API error:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
