import { NextRequest, NextResponse } from 'next/server'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'

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
  const logger = createRouteLogger('api/w3w/convert', request)

  try {
    logger.info('Processing what3words conversion request')

    const { searchParams } = new URL(request.url)
    const words = searchParams.get('words')

    if (!words) {
      logger.warn('Missing words parameter in what3words request')
      throw errors.validation('Words parameter is required')
    }

    // Validate words format (3 words separated by dots or spaces)
    const wordsRegex = /^[a-z]+\.[a-z]+\.[a-z]+$/
    if (!wordsRegex.test(words)) {
      logger.warn('Invalid what3words format', { words })
      throw errors.validation('Invalid what3words format. Use format: word1.word2.word3')
    }

    const apiKey = process.env.W3W_API_KEY
    if (!apiKey) {
      logger.error('W3W_API_KEY not found in environment variables')
      throw errors.configuration('what3words API key not configured')
    }

    logger.info('Converting what3words address', { words })

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
      logger.error('what3words API error', {
        words,
        status: response.status,
        errorCode: errorData.error?.code,
        errorMessage: errorData.error?.message
      })

      throw errors.externalApi('what3words', {
        message: errorData.error?.message || 'Failed to convert what3words address',
        statusCode: response.status
      })
    }

    const data: W3WResponse = await response.json()

    logger.info('what3words conversion successful', {
      words,
      coordinates: data.coordinates,
      language: data.language
    })

    return NextResponse.json({
      coordinates: data.coordinates,
      words: data.words,
      language: data.language,
      map: data.map
    })

  } catch (error) {
    return handleApiError(error, 'api/w3w/convert')
  }
}
