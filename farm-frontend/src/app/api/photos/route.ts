// Farm Photos API - Farm Photos Service Integration
// PuredgeOS 3.0 Compliant Photo Management

import { NextRequest, NextResponse } from 'next/server'
import { 
  getFarmPhotos,
  getPendingPhotosForAdmin
} from '@/lib/farm-photos-api'
import { FARM_PHOTOS_CONFIG, getFarmPhotosApiUrl } from '@/config/farm-photos'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

// POST - Submit New Photo (Proxy to farm-photos service)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to the farm-photos service
    const farmPhotosUrl = getFarmPhotosApiUrl(FARM_PHOTOS_CONFIG.ENDPOINTS.SUBMIT)
    
    const response = await fetch(farmPhotosUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const result = await response.json()
    
    return NextResponse.json(result, { 
      status: response.status,
      headers: corsHeaders 
    })
    
  } catch (error) {
    console.error('Error proxying photo submission:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process photo submission. Please try again.'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET - Get Photos for a Farm or All Pending Photos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmSlug = searchParams.get('farmSlug')
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | undefined
    
    // If no farm slug but status is pending, get all pending photos for admin
    if (!farmSlug && status === 'pending') {
      // Forward to farm-photos admin endpoint
      const farmPhotosUrl = getFarmPhotosApiUrl(FARM_PHOTOS_CONFIG.ENDPOINTS.GET_PENDING)
      
      console.log('Frontend proxy: Connecting to farm-photos at:', farmPhotosUrl)
      console.log('Frontend proxy: API_URL config:', FARM_PHOTOS_CONFIG.API_URL)
      console.log('Frontend proxy: Environment FARM_PHOTOS_API_URL:', process.env.FARM_PHOTOS_API_URL)
      
      const response = await fetch(farmPhotosUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      return NextResponse.json({
        photos: result.photos || [],
        total: result.totalCount || 0,
        status: 'pending'
      }, { headers: corsHeaders })
    }
    
    // Farm slug is required for other queries
    if (!farmSlug) {
      return NextResponse.json(
        { error: 'Farm slug is required' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Get photos for the farm from farm-photos service
    const photos = await getFarmPhotos(farmSlug, status)
    
    return NextResponse.json({
      photos: photos || [],
      total: photos?.length || 0,
      farmSlug,
      status: status || 'all'
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
