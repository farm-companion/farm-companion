// Farm Photos API - Individual Photo Endpoint
// PuredgeOS 3.0 Compliant Photo Management

import { NextRequest, NextResponse } from 'next/server'
import { 
  getPhotoSubmission, 
  updatePhotoStatus,
  requestPhotoDeletion,
  reviewDeletionRequest,
  recoverDeletedPhoto
} from '@/lib/photo-storage'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// GET - Get Photo Details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    
    // Validate photo ID format
    if (!photoId || !photoId.startsWith('photo_')) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Get photo submission
    const submission = await getPhotoSubmission(photoId)
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404, headers: corsHeaders }
      )
    }
    
    return NextResponse.json(submission, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// PATCH - Update Photo Status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const body = await request.json()
    
    // Validate photo ID format
    if (!photoId || !photoId.startsWith('photo_')) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Handle different PATCH operations
    if (body.action === 'request_deletion') {
      // Request photo deletion
      const result = await requestPhotoDeletion({
        photoId,
        requestedBy: body.requestedBy || 'Unknown',
        requesterEmail: body.requesterEmail || '',
        requesterRole: body.requesterRole || 'submitter',
        reason: body.reason || 'No reason provided'
      })
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400, headers: corsHeaders }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: result.message,
        requestId: result.requestId
      }, { headers: corsHeaders })
      
    } else if (body.action === 'review_deletion') {
      // Review deletion request (admin only)
      const result = await reviewDeletionRequest({
        requestId: body.requestId,
        status: body.status,
        reviewedBy: body.reviewedBy || 'admin',
        rejectionReason: body.rejectionReason
      })
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400, headers: corsHeaders }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: result.message
      }, { headers: corsHeaders })
      
    } else if (body.action === 'recover') {
      // Recover deleted photo (admin only)
      const result = await recoverDeletedPhoto(photoId)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400, headers: corsHeaders }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: result.message
      }, { headers: corsHeaders })
      
    } else {
      // Standard status update (approve/reject)
      // Validate required fields
      if (!body.status || !['approved', 'rejected'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be "approved" or "rejected"' },
          { status: 400, headers: corsHeaders }
        )
      }
      
      if (!body.reviewedBy) {
        return NextResponse.json(
          { error: 'Reviewer information is required' },
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Update photo status
      const success = await updatePhotoStatus(
        photoId,
        body.status,
        body.reviewedBy,
        body.rejectionReason
      )
      
      if (!success) {
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404, headers: corsHeaders }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: `Photo ${body.status} successfully`
      }, { headers: corsHeaders })
    }
    
  } catch (error) {
    console.error('Error updating photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// DELETE - Delete Photo (Admin only - immediate deletion)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    
    // Validate photo ID format
    if (!photoId || !photoId.startsWith('photo_')) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Get submission before deletion
    const submission = await getPhotoSubmission(photoId)
    if (!submission) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404, headers: corsHeaders }
      )
    }
    
    // For immediate deletion (admin only), we'll use the deletion request system
    // but mark it as approved immediately
    const result = await requestPhotoDeletion({
      photoId,
      requestedBy: 'admin',
      requesterEmail: 'admin@farmcompanion.co.uk',
      requesterRole: 'admin',
      reason: 'Immediate deletion by admin'
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Immediately approve the deletion request
    const approvalResult = await reviewDeletionRequest({
      requestId: result.requestId!,
      status: 'approved',
      reviewedBy: 'admin'
    })
    
    if (!approvalResult.success) {
      return NextResponse.json(
        { error: approvalResult.error },
        { status: 400, headers: corsHeaders }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
      photoId
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
