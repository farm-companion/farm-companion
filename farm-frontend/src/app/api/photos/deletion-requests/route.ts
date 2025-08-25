// Farm Photos API - Deletion Requests Endpoint
// PuredgeOS 3.0 Compliant Photo Management

import { NextRequest, NextResponse } from 'next/server'
import { 
  getPendingDeletionRequests,
  getRecoverablePhotos,
  cleanupExpiredDeletedPhotos
} from '@/lib/photo-storage'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// GET - Get pending deletion requests and recoverable photos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'pending' | 'recoverable' | 'cleanup'
    
    if (type === 'recoverable') {
      // Get photos that can still be recovered
      const recoverablePhotos = await getRecoverablePhotos()
      
      return NextResponse.json({
        success: true,
        photos: recoverablePhotos,
        count: recoverablePhotos.length
      }, { headers: corsHeaders })
      
    } else if (type === 'cleanup') {
      // Clean up expired deleted photos
      const cleanedCount = await cleanupExpiredDeletedPhotos()
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired deleted photos`,
        cleanedCount
      }, { headers: corsHeaders })
      
    } else {
      // Default: get pending deletion requests
      const pendingRequests = await getPendingDeletionRequests()
      
      return NextResponse.json({
        success: true,
        requests: pendingRequests,
        count: pendingRequests.length
      }, { headers: corsHeaders })
    }
    
  } catch (error) {
    console.error('Error fetching deletion requests:', error)
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
