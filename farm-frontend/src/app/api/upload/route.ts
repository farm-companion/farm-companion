export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import crypto from 'crypto'

// Conditional Sharp import for image processing
let sharp: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp')
} catch {
  console.warn('Sharp not available for image processing')
}
import { validateHoneypot, validateSubmissionTime, verifyTurnstile, trackIPReputation, isIPBlocked } from '@/lib/security'
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

    // Comprehensive file validation
    if (!data.file) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (data.file.size > MAX_FILE_SIZE) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Check minimum file size (prevent empty files)
    const MIN_FILE_SIZE = 1024 // 1KB
    if (data.file.size < MIN_FILE_SIZE) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'File too small (min 1KB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.file.type)) {
      await trackIPReputation(ip, 'failure')
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }, { status: 400 })
    }

    // Convert file to buffer
    const buf = Buffer.from(await data.file.arrayBuffer())

    // Validate file content with magic bytes
    const magicBytes = buf.slice(0, 12)
    const validMagicBytes = [
      Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG
      Buffer.from([0x52, 0x49, 0x46, 0x46]), // WebP (RIFF header)
    ]

    const isValidMagicBytes = validMagicBytes.some(magic => {
      return magicBytes.subarray(0, magic.length).equals(magic)
    })

    if (!isValidMagicBytes) {
      console.log('🔒 SECURITY: Invalid magic bytes detected:', magicBytes.toString('hex'))
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 })
    }

    // Additional security checks
    const fileName = data.file.name.toLowerCase()
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar', '.php', '.asp', '.aspx']
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => fileName.includes(ext))
    
    if (hasSuspiciousExtension) {
      console.log('🔒 SECURITY: Suspicious file extension detected:', fileName)
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Check for null bytes or other suspicious patterns
    if (buf.includes(0x00) || buf.includes(0xFF, 0xFE) || buf.includes(0xFE, 0xFF)) {
      console.log('🔒 SECURITY: Suspicious byte patterns detected in file')
      await trackIPReputation(ip, 'spam')
      return NextResponse.json({ error: 'Invalid file content' }, { status: 400 })
    }

    let processedImage: Buffer
    let contentType = 'image/webp'
    let filename: string

    if (sharp) {
      // Use Sharp for image processing if available
      try {
        console.log('🔒 SECURITY: Processing image with Sharp for:', ip)
        
        const img = sharp(buf, { 
          failOn: 'warning',
          limitInputPixels: 268402689 // 16384x16384 limit
        })
        const meta = await img.metadata()
        
        if (!meta.format) {
          console.log('🔒 SECURITY: No format detected in image')
          await trackIPReputation(ip, 'failure')
          return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
        }

        // Enhanced dimension validation
        const MAX_DIMENSION = 4000
        const MIN_DIMENSION = 50
        
        if (meta.width && (meta.width > MAX_DIMENSION || meta.width < MIN_DIMENSION)) {
          console.log('🔒 SECURITY: Invalid image width:', meta.width)
          await trackIPReputation(ip, 'failure')
          return NextResponse.json({ error: `Image width must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels` }, { status: 400 })
        }
        
        if (meta.height && (meta.height > MAX_DIMENSION || meta.height < MIN_DIMENSION)) {
          console.log('🔒 SECURITY: Invalid image height:', meta.height)
          await trackIPReputation(ip, 'failure')
          return NextResponse.json({ error: `Image height must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels` }, { status: 400 })
        }

        // Check aspect ratio to prevent extremely wide/tall images
        if (meta.width && meta.height) {
          const aspectRatio = meta.width / meta.height
          if (aspectRatio > 10 || aspectRatio < 0.1) {
            console.log('🔒 SECURITY: Extreme aspect ratio detected:', aspectRatio)
            await trackIPReputation(ip, 'failure')
            return NextResponse.json({ error: 'Image aspect ratio too extreme' }, { status: 400 })
          }
        }

        // Process image: resize, convert to WebP, strip EXIF and metadata
        processedImage = await img
          .rotate() // Auto-rotate based on EXIF
          .resize(1800, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ 
            quality: 82,
            effort: 4
          })
          .withMetadata(false) // Strip all metadata
          .toBuffer()
        
        // Validate processed image size
        if (processedImage.length > MAX_FILE_SIZE) {
          console.log('🔒 SECURITY: Processed image too large:', processedImage.length)
          await trackIPReputation(ip, 'failure')
          return NextResponse.json({ error: 'Processed image too large' }, { status: 400 })
        }
        
        filename = `uploads/${crypto.randomUUID()}.webp`
        console.log('🔒 SECURITY: Image processed successfully, size:', processedImage.length)
        
      } catch (error) {
        console.error('🔒 SECURITY: Image processing failed:', error)
        await trackIPReputation(ip, 'failure')
        return NextResponse.json({ error: 'Image processing failed' }, { status: 400 })
      }
    } else {
      // Fallback: use original file without processing
      console.log('🔒 SECURITY: Sharp not available, using original file')
      processedImage = buf
      contentType = data.file.type
      filename = `uploads/${crypto.randomUUID()}.${data.file.type.split('/')[1]}`
    }

    // Upload to Vercel Blob with enhanced security
    try {
      console.log('🔒 SECURITY: Uploading image to blob storage, size:', processedImage.length)
      
      const blob = await put(filename, processedImage, {
        access: 'public',
        contentType: contentType,
        addRandomSuffix: false,
      })

      console.log('🔒 SECURITY: Image uploaded successfully to:', blob.url)

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
            processedSize: processedImage.length,
            contentType: contentType,
          }
          
          await fetch(`${process.env.VERCEL_KV_REST_API_URL}/lpush/moderation:images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.VERCEL_KV_REST_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(moderationData),
          })
          
          console.log('🔒 SECURITY: Image queued for moderation')
        } catch (error) {
          console.error('🔒 SECURITY: Failed to queue image for moderation:', error)
          // Don't fail the upload if moderation queue fails
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
      console.error('🔒 SECURITY: Blob upload failed:', error)
      await trackIPReputation(ip, 'failure')
      return NextResponse.json(
        { error: 'Upload to storage failed. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Image upload error:', error)
    await trackIPReputation(ip, 'failure')
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
