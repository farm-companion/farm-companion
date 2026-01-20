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
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

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
  const logger = createRouteLogger('api/photos/[id]', request)

  try {
    const { id: photoId } = await params

    logger.info('Fetching photo details', { photoId })

    // Validate photo ID format
    if (!photoId || !photoId.startsWith('photo_')) {
      logger.warn('Invalid photo ID format', { photoId })
      throw errors.validation('Invalid photo ID')
    }
    
    // Get photo submission
    const submission = await getPhotoSubmission(photoId)

    if (!submission) {
      logger.warn('Photo not found', { photoId })
      throw errors.notFound('Photo')
    }

    logger.info('Photo details fetched successfully', { photoId })

    return NextResponse.json(submission, { headers: corsHeaders })

  } catch (error) {
    const response = handleApiError(error, 'api/photos/[id]')
    // Add CORS headers to error response
    const headers = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
    return new NextResponse(response.body, { status: response.status, headers })
  }
}

// PATCH - Update Photo Status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createRouteLogger('api/photos/[id]', request)

  try {
    const { id: photoId } = await params
    const body = await request.json()

    logger.info('Processing photo update', { photoId, action: body.action })

    // Validate photo ID format
    if (!photoId || !photoId.startsWith('photo_')) {
      logger.warn('Invalid photo ID format in PATCH', { photoId })
      throw errors.validation('Invalid photo ID')
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
        action: body.status === 'approved' ? 'approve' : 'reject',
        reviewedBy: body.reviewedBy || 'admin',
        reviewNotes: body.rejectionReason
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
        logger.warn('Invalid status in photo update', { photoId, status: body.status })
        throw errors.validation('Invalid status. Must be "approved" or "rejected"')
      }

      if (!body.reviewedBy) {
        logger.warn('Missing reviewer information', { photoId })
        throw errors.validation('Reviewer information is required')
      }
      
      // Update photo status
      const success = await updatePhotoStatus(
        photoId,
        body.status,
        {
          reviewedBy: body.reviewedBy,
          rejectionReason: body.rejectionReason
        }
      )

      if (!success) {
        logger.warn('Photo not found for status update', { photoId })
        throw errors.notFound('Photo')
      }

      logger.info('Photo status updated successfully', {
        photoId,
        status: body.status,
        reviewedBy: body.reviewedBy
      })

      return NextResponse.json({
        success: true,
        message: `Photo ${body.status} successfully`
      }, { headers: corsHeaders })
    }

  } catch (error) {
    const response = handleApiError(error, 'api/photos/[id]')
    const headers = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
    return new NextResponse(response.body, { status: response.status, headers })
  }
}

// DELETE - Delete Photo (Admin only - immediate deletion)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createRouteLogger('api/photos/[id]', request)

  try {
    const { id: photoId } = await params

    logger.info('Processing photo deletion', { photoId })

    // Validate photo ID format
    if (!photoId || !photoId.startsWith('photo_')) {
      logger.warn('Invalid photo ID format in DELETE', { photoId })
      throw errors.validation('Invalid photo ID')
    }
    
    // Get submission before deletion
    const submission = await getPhotoSubmission(photoId)
    if (!submission) {
      logger.warn('Photo not found for deletion', { photoId })
      throw errors.notFound('Photo')
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
      action: 'approve',
      reviewedBy: 'admin'
    })
    
    if (!approvalResult.success) {
      return NextResponse.json(
        { error: approvalResult.error },
        { status: 400, headers: corsHeaders }
      )
    }
    
    logger.info('Photo deleted successfully', { photoId })

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
      photoId
    }, { headers: corsHeaders })

  } catch (error) {
    const response = handleApiError(error, 'api/photos/[id]')
    const headers = new Headers(response.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
    return new NextResponse(response.body, { status: response.status, headers })
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
