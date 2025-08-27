import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'
import { getCurrentUser } from '@/lib/auth'

const redis = new Redis(process.env.REDIS_URL!)

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all farm submissions from Redis
    const submissions = await redis.hgetall('farm_submissions') || {}
    
    // Convert to array and sort by submission date (newest first)
    const submissionsArray = Object.entries(submissions).map(([id, submissionStr]) => {
      const submission = JSON.parse(submissionStr as string)
      return {
        ...submission,
        id,
        submittedAt: submission.submittedAt || new Date().toISOString()
      }
    })
    
    submissionsArray.sort((a: any, b: any) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    return NextResponse.json({ submissions: submissionsArray })

  } catch (error) {
    console.error('Error fetching farm submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
