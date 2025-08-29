import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { buildObjectKey } from '@/lib/blob'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({
        error: 'missing-file',
        message: 'No file provided'
      }, { status: 400 })
    }

    // Test the new buildObjectKey function
    const testFarmSlug = 'test-farm'
    const testPhotoId = 'test-photo-123'
    const objectKey = buildObjectKey(testFarmSlug, testPhotoId, file.type)
    
    console.log('Test upload:', {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      objectKey
    })

    // Upload to Vercel Blob
    const blob = await put(objectKey, file, {
      access: 'public',
      addRandomSuffix: false
    })

    console.log('Upload successful:', blob.url)

    return NextResponse.json({
      ok: true,
      url: blob.url,
      objectKey,
      contentType: file.type
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({
      error: 'upload-failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
