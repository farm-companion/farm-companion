import { NextRequest, NextResponse } from 'next/server'
import { headBlob } from '@/lib/blob'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({
        error: 'missing-url',
        message: 'URL parameter is required'
      }, { status: 400 })
    }

    // Extract the object key from the URL
    const blobUrl = 'https://blob.vercel-storage.com/'
    if (!url.startsWith(blobUrl)) {
      return NextResponse.json({
        error: 'invalid-url',
        message: 'URL must be a Vercel Blob URL'
      }, { status: 400 })
    }

    const objectKey = url.replace(blobUrl, '')
    
    console.log('Checking photo URL:', { url, objectKey })
    
    // Check if the blob exists
    const exists = await headBlob(objectKey)
    
    // Try different extensions if the original doesn't exist
    const extensions = ['webp', 'jpg', 'png', 'jpeg']
    const results: Record<string, boolean> = {}
    
    if (!exists && objectKey.includes('/main') && !objectKey.includes('.')) {
      for (const ext of extensions) {
        const testKey = objectKey.replace('/main', `/main.${ext}`)
        results[ext] = await headBlob(testKey)
      }
    }
    
    return NextResponse.json({
      url,
      objectKey,
      exists,
      extensionTests: results,
      suggestions: exists ? [] : Object.entries(results)
        .filter(([_, exists]) => exists)
        .map(([ext]) => `${blobUrl}${objectKey.replace('/main', `/main.${ext}`)}`)
    })

  } catch (error) {
    console.error('Error checking photo URL:', error)
    return NextResponse.json({
      error: 'internal-server-error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
