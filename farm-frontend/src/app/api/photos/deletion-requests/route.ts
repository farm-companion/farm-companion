// Farm Photos API - Deletion Requests Endpoint
// PuredgeOS 3.0 Compliant Photo Management

import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingDeletionRequests,
  getRecoverablePhotos,
  cleanupExpiredDeletedPhotos
} from '@/lib/photo-storage'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// GET - Get pending deletion requests and recoverable photos
export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/photos/deletion-requests', request)

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'pending' | 'recoverable' | 'cleanup'

    logger.info('Processing deletion requests query', { type })

    if (type === 'recoverable') {
      // Get photos that can still be recovered
      const recoverablePhotos = await getRecoverablePhotos()

      logger.info('Recoverable photos fetched', { count: recoverablePhotos.length })

      return NextResponse.json({
        success: true,
        photos: recoverablePhotos,
        count: recoverablePhotos.length
      }, { headers: corsHeaders })

    } else if (type === 'cleanup') {
      // Clean up expired deleted photos
      const cleanedCount = await cleanupExpiredDeletedPhotos()

      logger.info('Expired deleted photos cleaned up', { cleanedCount })

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired deleted photos`,
        cleanedCount
      }, { headers: corsHeaders })

    } else {
      // Default: get pending deletion requests
      const pendingRequests = await getPendingDeletionRequests()

      logger.info('Pending deletion requests fetched', { count: pendingRequests.length })

      return NextResponse.json({
        success: true,
        requests: pendingRequests,
        count: pendingRequests.length
      }, { headers: corsHeaders })
    }

  } catch (error) {
    const response = handleApiError(error, 'api/photos/deletion-requests')
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
