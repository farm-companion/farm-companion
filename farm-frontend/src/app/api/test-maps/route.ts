import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({
      error: 'API key not found',
      environment: process.env.NODE_ENV,
      hasApiKey: false
    }, { status: 500 })
  }

  try {
    // Test the API key with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${apiKey}`
    const response = await fetch(testUrl)
    const data = await response.json()

    // Also test the Maps JavaScript API loading
    const mapsJsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    const mapsResponse = await fetch(mapsJsUrl)
    const mapsData = await mapsResponse.text()

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
    return NextResponse.json({
      error: 'API key test failed',
      environment: process.env.NODE_ENV,
      hasApiKey: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      testError: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
