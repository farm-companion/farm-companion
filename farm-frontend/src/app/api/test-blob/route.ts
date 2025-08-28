import { NextRequest, NextResponse } from 'next/server'
import { createUploadUrl } from '@/lib/blob'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Vercel Blob...')
    
    // Test creating an upload URL
    const { uploadUrl } = await createUploadUrl({
      pathname: 'test/test-image.jpg',
      contentType: 'image/jpeg',
      contentLength: 1000
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Vercel Blob is working',
      uploadUrl: uploadUrl ? 'URL generated' : 'No URL'
    })
  } catch (error) {
    console.error('Vercel Blob test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
