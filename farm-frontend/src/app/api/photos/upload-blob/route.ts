import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pathname = searchParams.get('pathname')
    const contentType = searchParams.get('contentType')

    if (!pathname || !contentType) {
      return NextResponse.json({ error: 'missing-parameters' }, { status: 400 })
    }

    // Get the file from the request body
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'no-file' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false
    })

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      pathname: blob.pathname
    })
  } catch (error) {
    console.error('Error uploading to blob:', error)
    return NextResponse.json({ 
      error: 'upload-failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
