import { NextResponse } from 'next/server'
import { createUploadUrl } from '@/lib/blob'
import { apiMiddleware } from '@/lib/api-middleware'
import { withRetry } from '@/lib/error-handler'

async function testBlobHandler() {
  // Use retry logic for external service calls
  const result = await withRetry(async () => {
    const { uploadUrl } = await createUploadUrl({
      pathname: 'test/test-image.jpg',
      contentType: 'image/jpeg',
      contentLength: 1000
    })
    return uploadUrl
  }, 3, 1000)
  
  return NextResponse.json({ 
    success: true, 
    message: 'Vercel Blob is working',
    uploadUrl: result ? 'URL generated' : 'No URL',
    timestamp: new Date().toISOString()
  })
}

export const GET = apiMiddleware.basic(testBlobHandler)
