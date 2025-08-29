import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const pathname = formData.get('pathname') as string
    const contentType = formData.get('contentType') as string

    if (!file || !pathname || !contentType) {
      return NextResponse.json({
        error: 'missing-required-fields',
        message: 'Missing required fields: file, pathname, contentType'
      }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false
    })

    return NextResponse.json({
      ok: true,
      url: blob.url
    })

  } catch (error) {
    console.error('Error in upload-blob route:', error)
    return NextResponse.json({
      error: 'internal-server-error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
