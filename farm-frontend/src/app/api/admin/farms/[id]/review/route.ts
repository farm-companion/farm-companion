import { NextRequest, NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'

interface ReviewAction {
  action: 'approve' | 'reject' | 'request_changes'
  notes?: string
  reviewedBy: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, notes, reviewedBy }: ReviewAction = await request.json()
    const { id: farmId } = await params

    // Validate action
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get the farm submission from Redis
    const farmStr = await redis.hget('farm_submissions', farmId)
    
    if (!farmStr) {
      return NextResponse.json(
        { error: 'Farm submission not found' },
        { status: 404 }
      )
    }

    const farm = JSON.parse(String(farmStr))

    // Update farm status
    const now = new Date().toISOString()
    const updatedFarm = {
      ...farm,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested',
      reviewedAt: now,
      reviewedBy,
      reviewNotes: notes || null,
      ...(action === 'approve' && {
        approvedAt: now,
        approvedBy: reviewedBy
      })
    }

    // Save updated farm back to Redis
    await redis.hset('farm_submissions', farmId, JSON.stringify(updatedFarm))

    // Send appropriate email notifications
    await sendReviewNotification(updatedFarm, action, notes)

    return NextResponse.json({ 
      success: true, 
      message: `Farm ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested'} successfully` 
    })

  } catch (error) {
    console.error('Error reviewing farm submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendReviewNotification(farm: any, action: string, notes?: string) {
  const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested'
  
  // Send notification to farm contact if email provided
  if (farm.contact.email) {
    console.log('📧 FARM REVIEW NOTIFICATION:', {
      to: farm.contact.email,
      from: 'hello@farmcompanion.co.uk',
      subject: `Farm Shop Review Update: ${farm.name}`,
      farmId: farm.id,
      farmName: farm.name,
      action: actionText,
      notes: notes || 'No additional notes provided',
      message: `Your farm shop submission "${farm.name}" has been ${actionText}. ${
        action === 'approve' 
          ? 'Your farm is now live on our directory!' 
          : action === 'reject'
          ? 'Unfortunately, we cannot add your farm to our directory at this time.'
          : 'Please review the requested changes and resubmit.'
      }`
    })
  }

  // Send admin notification
  console.log('📧 ADMIN REVIEW NOTIFICATION:', {
    to: 'hello@farmcompanion.co.uk',
    subject: `Farm Review Completed: ${farm.name}`,
    farmId: farm.id,
    farmName: farm.name,
    action: actionText,
    reviewedBy: farm.reviewedBy,
    reviewNotes: notes || 'No notes provided'
  })
}
