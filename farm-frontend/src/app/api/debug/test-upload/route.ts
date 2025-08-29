import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

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

    // Create a test pathname
    const pathname = `test-upload/${Date.now()}-${file.name}`

    console.log('Test upload:', {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      pathname
    })

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false
    })

    console.log('Upload successful:', blob.url)

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname
    })

  } catch (error) {
    console.error('Test upload error:', error)
    return NextResponse.json({
      error: 'upload-failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
