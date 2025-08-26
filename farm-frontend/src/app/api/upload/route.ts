export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import { checkCsrf, validateHoneypot, validateSubmissionTime, verifyTurnstile, trackIPReputation, isIPBlocked } from '@/lib/security'
import { ImageUploadSchema } from '@/lib/validation'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  
  try {
    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Apply rate limiting
    const rateLimit = await rateLimiters.upload.consume(ip)
    if (!rateLimit) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Too many uploads' }, { status: 429 })
    }

    // CSRF protection (relaxed for file uploads)
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    const allowed = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk').origin
    
    if (origin && origin !== allowed && referer && !referer.startsWith(allowed)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    const form = await req.formData()
    const body = Object.fromEntries(form.entries())
    
    // Validate input with Zod
    const parse = ImageUploadSchema.safeParse(body)
    if (!parse.success) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
    }
    
    const data = parse.data

    // Spam checks
    if (!validateHoneypot(data.hp)) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ ok: true }) // Silent discard
    }

    if (!validateSubmissionTime(data.t)) {
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ ok: true }) // Silent discard
    }

    // Optional: verify Cloudflare Turnstile
    if (data.token) {
      const turnstileValid = await verifyTurnstile(data.token, ip)
      if (!turnstileValid) {
        await trackIPReputation(ip, 'spam')
        return NextResponse.json({ error: 'Bot check failed' }, { status: 400 })
      }
    }

    // File validation
    if (!data.file) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 5MB)
    if (data.file.size > 5 * 1024 * 1024) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(data.file.type)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Convert file to buffer
    const buf = Buffer.from(await data.file.arrayBuffer())

    // Verify it's an image and get metadata
    let img: sharp.Sharp
    try {
      img = sharp(buf, { failOn: 'warning' })
      const meta = await img.metadata()
      
      if (!meta.format) {
        await trackIPReputation(ip, 'failure')
        return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
      }

      // Check dimensions (max 4000x4000)
      if (meta.width && meta.width > 4000) {
        await trackIPReputation(ip, 'failure')
        return NextResponse.json({ error: 'Image too wide (max 4000px)' }, { status: 400 })
      }
      
      if (meta.height && meta.height > 4000) {
        await trackIPReputation(ip, 'failure')
        return NextResponse.json({ error: 'Image too tall (max 4000px)' }, { status: 400 })
      }
    } catch (error) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
    }

    // Process image: resize, convert to WebP, strip EXIF
    const processedImage = await img
      .rotate() // Auto-rotate based on EXIF
      .resize(1800, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ 
        quality: 82,
        effort: 4
      })
      .toBuffer()

    // Generate unique filename
    const filename = `uploads/${crypto.randomUUID()}.webp`

    // Upload to Vercel Blob
    const blob = await put(filename, processedImage, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    })

    // Queue for moderation (if KV is configured)
    if (process.env.VERCEL_KV_REST_API_URL) {
      try {
        const moderationData = {
          url: blob.url,
          ip,
          timestamp: Date.now(),
          description: data.description,
          originalName: data.file.name,
          size: processedImage.length,
        }
        
        await fetch(`${process.env.VERCEL_KV_REST_API_URL}/lpush/moderation:images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VERCEL_KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(moderationData),
        })
      } catch (error) {
        console.error('Failed to queue image for moderation:', error)
      }
    }

    // Track successful upload
    await trackIPReputation(ip, 'success')

    return NextResponse.json({ 
      ok: true,
      url: blob.url,
      message: 'Image uploaded successfully and queued for moderation'
    })

  } catch (error) {
    console.error('Image upload error:', error)
    await trackIPReputation(ip, 'failure')
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
