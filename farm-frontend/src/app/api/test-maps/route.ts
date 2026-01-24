import { NextRequest, NextResponse } from 'next/server'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/test-maps', request)
  try {
    logger.info('Processing Google Maps API key test')

    // Use testing key for server-side API calls (IP restricted)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY_TESTING || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      logger.warn('Google Maps API key not found')
      return NextResponse.json({
        error: 'API key not found',
        environment: process.env.NODE_ENV,
        hasApiKey: false
      }, { status: 500 })
    }
    // Test the API key with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${apiKey}`
    const response = await fetch(testUrl)
    const data = await response.json()

    // Also test the Maps JavaScript API loading
    const mapsJsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    const mapsResponse = await fetch(mapsJsUrl)
    const mapsData = await mapsResponse.text()

    logger.info('Google Maps API key test successful', { geocodingStatus: data.status })

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      hasApiKey: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      geocodingTest: data.status,
      geocodingResults: data.results?.length || 0,
      mapsJsTest: mapsResponse.status,
      mapsJsContentLength: mapsData.length,
      mapsJsContainsError: mapsData.includes('error') || mapsData.includes('Error'),
      mapsJsContainsAuthFailure: mapsData.includes('AuthFailure') || mapsData.includes('auth_failure')
    })
  } catch (error) {
    return handleApiError(error, 'api/test-maps')
  }
}
