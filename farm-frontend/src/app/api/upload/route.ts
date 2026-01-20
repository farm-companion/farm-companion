export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { rateLimiters, getClientIP } from '@/lib/rate-limit'
import crypto from 'crypto'
import { createRouteLogger } from '@/lib/logger'
import { errors, handleApiError } from '@/lib/errors'
import { validateHoneypot, validateSubmissionTime, verifyTurnstile, trackIPReputation, isIPBlocked } from '@/lib/security'
import { ImageUploadSchema } from '@/lib/validation'

// Conditional Sharp import for image processing
interface Sharp {
  (input: Buffer, options?: any): Sharp
  metadata(): Promise<any>
  rotate(): Sharp
  resize(width?: number, height?: number, options?: any): Sharp
  webp(options?: any): Sharp
  withMetadata(keepMetadata: boolean): Sharp
  toBuffer(): Promise<Buffer>
}

let sharp: Sharp | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sharp = require('sharp')
} catch {
  // Sharp is optional - will use unprocessed images as fallback
}

export async function POST(req: Request) {
  const logger = createRouteLogger('api/upload', req)
  const ip = getClientIP(req)

  try {
    // Check if IP is blocked
    if (await isIPBlocked(ip)) {
      await trackIPReputation(ip, 'failure')
      throw errors.authorization('Access denied')
    }

    // Apply rate limiting
    const rateLimit = await rateLimiters.upload.consume(ip)
    if (!rateLimit) {
      await trackIPReputation(ip, 'failure')
      throw errors.rateLimit('Too many uploads')
    }

    // CSRF protection (relaxed for file uploads)
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    const allowed = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.farmcompanion.co.uk').origin

    if (origin && origin !== allowed && referer && !referer.startsWith(allowed)) {
      await trackIPReputation(ip, 'failure')
      throw errors.authorization('Invalid request origin')
    }

    const form = await req.formData()
    const body = Object.fromEntries(form.entries())

    // Validate input with Zod
    const parse = ImageUploadSchema.safeParse(body)
    if (!parse.success) {
      await trackIPReputation(ip, 'failure')
      throw errors.validation('Invalid data provided', {
        errors: parse.error.errors,
      })
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
        throw errors.validation('Bot check failed')
      }
    }

    // Comprehensive file validation
    if (!data.file) {
      await trackIPReputation(ip, 'failure')
      throw errors.validation('No file provided')
    }

    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (data.file.size > MAX_FILE_SIZE) {
      await trackIPReputation(ip, 'failure')
      throw errors.validation('File too large (max 5MB)')
    }

    // Check minimum file size (prevent empty files)
    const MIN_FILE_SIZE = 1024 // 1KB
    if (data.file.size < MIN_FILE_SIZE) {
      await trackIPReputation(ip, 'failure')
      throw errors.validation('File too small (min 1KB)')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(data.file.type)) {
      await trackIPReputation(ip, 'failure')
      throw errors.validation('Invalid file type. Allowed: JPEG, PNG, WebP')
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
      logger.warn('Invalid magic bytes detected', {
        ip,
        magicBytesHex: magicBytes.toString('hex'),
      })
      await trackIPReputation(ip, 'spam')
      throw errors.validation('Invalid file format')
    }

    // Additional security checks
    const fileName = data.file.name.toLowerCase()
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar', '.php', '.asp', '.aspx']
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => fileName.includes(ext))

    if (hasSuspiciousExtension) {
      logger.warn('Suspicious file extension detected', { ip, fileName })
      await trackIPReputation(ip, 'spam')
      throw errors.validation('Invalid file type')
    }

    // Check for null bytes or other suspicious patterns
    if (buf.includes(0x00) || buf.includes(0xFF, 0xFE) || buf.includes(0xFE, 0xFF)) {
      logger.warn('Suspicious byte patterns detected in file', { ip })
      await trackIPReputation(ip, 'spam')
      throw errors.validation('Invalid file content')
    }

    let processedImage: Buffer
    let contentType = 'image/webp'
    let filename: string

    if (sharp) {
      // Use Sharp for image processing if available
      try {
        logger.info('Processing image with Sharp', { ip })

        const img = sharp(buf, {
          failOn: 'warning',
          limitInputPixels: 268402689 // 16384x16384 limit
        })
        const meta = await img.metadata()

        if (!meta.format) {
          logger.warn('No format detected in image', { ip })
          await trackIPReputation(ip, 'failure')
          throw errors.validation('Invalid image file')
        }

        // Enhanced dimension validation
        const MAX_DIMENSION = 4000
        const MIN_DIMENSION = 50

        if (meta.width && (meta.width > MAX_DIMENSION || meta.width < MIN_DIMENSION)) {
          logger.warn('Invalid image width', { ip, width: meta.width })
          await trackIPReputation(ip, 'failure')
          throw errors.validation(`Image width must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels`)
        }

        if (meta.height && (meta.height > MAX_DIMENSION || meta.height < MIN_DIMENSION)) {
          logger.warn('Invalid image height', { ip, height: meta.height })
          await trackIPReputation(ip, 'failure')
          throw errors.validation(`Image height must be between ${MIN_DIMENSION} and ${MAX_DIMENSION} pixels`)
        }

        // Check aspect ratio to prevent extremely wide/tall images
        if (meta.width && meta.height) {
          const aspectRatio = meta.width / meta.height
          if (aspectRatio > 10 || aspectRatio < 0.1) {
            logger.warn('Extreme aspect ratio detected', { ip, aspectRatio })
            await trackIPReputation(ip, 'failure')
            throw errors.validation('Image aspect ratio too extreme')
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
          logger.warn('Processed image too large', {
            ip,
            processedSize: processedImage.length
          })
          await trackIPReputation(ip, 'failure')
          throw errors.validation('Processed image too large')
        }

        filename = `uploads/${crypto.randomUUID()}.webp`
        logger.info('Image processed successfully', {
          ip,
          processedSize: processedImage.length
        })

      } catch (error) {
        if (error instanceof Error && error.name === 'AppError') {
          throw error // Re-throw AppError instances
        }
        logger.error('Image processing failed', { ip }, error as Error)
        await trackIPReputation(ip, 'failure')
        throw errors.internal('Image processing failed')
      }
    } else {
      // Fallback: use original file without processing
      logger.info('Sharp not available, using original file', { ip })
      processedImage = buf
      contentType = data.file.type
      filename = `uploads/${crypto.randomUUID()}.${data.file.type.split('/')[1]}`
    }

    // Upload to Vercel Blob with enhanced security
    try {
      logger.info('Uploading image to blob storage', {
        ip,
        size: processedImage.length
      })

      const blob = await put(filename, processedImage, {
        access: 'public',
        contentType: contentType,
        addRandomSuffix: false,
      })

      logger.info('Image uploaded successfully', { ip, url: blob.url })

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

          logger.info('Image queued for moderation', { ip })
        } catch (error) {
          logger.error('Failed to queue image for moderation', { ip }, error as Error)
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
      logger.error('Blob upload failed', { ip }, error as Error)
      await trackIPReputation(ip, 'failure')
      throw errors.externalApi('Vercel Blob', {
        message: 'Upload to storage failed'
      })
    }

  } catch (error) {
    await trackIPReputation(ip, 'failure')
    return handleApiError(error, 'api/upload', { ip })
  }
}
