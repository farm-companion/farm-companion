import { NextRequest, NextResponse } from 'next/server'

interface W3WResponse {
  coordinates: {
    lat: number
    lng: number
  }
  words: string
  language: string
  map: string
}

interface W3WError {
  error: {
    code: string
    message: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const words = searchParams.get('words')

    if (!words) {
      return NextResponse.json(
        { error: 'Words parameter is required' },
        { status: 400 }
      )
    }

    // Validate words format (3 words separated by dots or spaces)
    const wordsRegex = /^[a-z]+\.[a-z]+\.[a-z]+$/
    if (!wordsRegex.test(words)) {
      return NextResponse.json(
        { error: 'Invalid what3words format. Use format: word1.word2.word3' },
        { status: 400 }
      )
    }

    const apiKey = process.env.W3W_API_KEY
    if (!apiKey) {
      console.error('W3W_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'what3words API key not configured' },
        { status: 500 }
      )
    }

    // Call what3words API
    const response = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData: W3WError = await response.json()
      console.error('what3words API error:', errorData)
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to convert what3words address' },
        { status: response.status }
      )
    }

    const data: W3WResponse = await response.json()

    return NextResponse.json({
      coordinates: data.coordinates,
      words: data.words,
      language: data.language,
      map: data.map
    })

  } catch (error) {
    console.error('what3words conversion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
