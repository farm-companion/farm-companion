// Comprehensive Input Validation System
// PuredgeOS 3.0 Compliant Input Sanitization

import { z } from 'zod'
// Dynamic import for DOMPurify to avoid ESM/CommonJS issues during build
let DOMPurify: any = null
async function getDOMPurify() {
  if (!DOMPurify) {
    DOMPurify = (await import('isomorphic-dompurify')).default
  }
  return DOMPurify
}

// Base validation schemas
export const BaseValidation = {
  // Common field validations
  email: z.string().email('Invalid email format').max(254, 'Email too long'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20, 'Phone too long').optional(),
  url: z.string().url('Invalid URL format').max(500, 'URL too long').optional(),
  postcode: z.string().regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, 'Invalid UK postcode format'),
  
  // Anti-spam fields
  honeypot: z.string().max(0, 'Honeypot field must be empty').optional().or(z.literal('')),
  timestamp: z.number().int().positive('Timestamp must be positive'),
  timeToFill: z.number().int().min(1000, 'Form filled too quickly').optional(),
  
  // Security fields
  csrfToken: z.string().min(32, 'Invalid CSRF token').optional(),
  turnstileToken: z.string().min(32, 'Invalid Turnstile token').optional(),
  recaptchaToken: z.string().min(32, 'Invalid reCAPTCHA token').optional(),
  
  // Content validation
  text: z.string().min(1, 'Text cannot be empty').max(2000, 'Text too long'),
  longText: z.string().min(1, 'Text cannot be empty').max(5000, 'Text too long'),
  shortText: z.string().min(1, 'Text cannot be empty').max(500, 'Text too long'),
  
  // Geographic validation
  latitude: z.number().min(49, 'Latitude must be within UK bounds').max(61, 'Latitude must be within UK bounds'),
  longitude: z.number().min(-8, 'Longitude must be within UK bounds').max(2, 'Longitude must be within UK bounds'),
  
  // File validation
  fileSize: z.number().min(1024, 'File too small (min 1KB)').max(5242880, 'File too large (max 5MB)'),
  contentType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']),
  fileName: z.string().min(1, 'Filename required').max(255, 'Filename too long'),
  
  // ID validation
  uuid: z.string().uuid('Invalid UUID format'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').min(3, 'Slug too short').max(50, 'Slug too long'),
  
  // Status validation
  photoStatus: z.enum(['pending', 'approved', 'rejected', 'removed']),
  farmStatus: z.enum(['pending', 'approved', 'rejected', 'live']),
  claimType: z.enum(['ownership', 'management', 'correction', 'removal']),
  verificationMethod: z.enum(['email', 'phone', 'document']),
  
  // Consent validation
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
  
  // Rate limiting
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address').optional(),
}

// Farm submission validation
export const FarmSubmissionSchema = z.object({
  name: BaseValidation.name,
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address too long'),
  city: z.string().min(2, 'City must be at least 2 characters').max(80, 'City too long').optional(),
  county: z.string().min(2, 'County must be at least 2 characters').max(80, 'County too long'),
  postcode: BaseValidation.postcode,
  contactEmail: BaseValidation.email.optional().or(z.literal('')),
  website: BaseValidation.url.optional().or(z.literal('')),
  phone: BaseValidation.phone,
  lat: z.string().optional(),
  lng: z.string().optional(),
  offerings: z.string().max(1000, 'Offerings description too long').optional(),
  story: z.string().max(2000, 'Story too long').optional(),
  hours: z.array(z.object({
    day: z.string().min(1, 'Day required'),
    open: z.string().optional(),
    close: z.string().optional()
  })).max(7, 'Too many hours entries').optional(),
  _hp: BaseValidation.honeypot,
  ttf: BaseValidation.timeToFill,
})

// Photo upload validation
export const PhotoUploadSchema = z.object({
  farmSlug: BaseValidation.slug,
  fileName: BaseValidation.fileName,
  contentType: BaseValidation.contentType,
  fileSize: BaseValidation.fileSize,
  mode: z.enum(['upload', 'replace']).default('upload'),
  replacePhotoId: BaseValidation.uuid.optional(),
  caption: z.string().max(500, 'Caption too long').optional(),
  authorName: BaseValidation.name.optional(),
  authorEmail: BaseValidation.email.optional(),
  _hp: BaseValidation.honeypot,
  ttf: BaseValidation.timeToFill,
})

// Photo finalization validation
export const PhotoFinalizationSchema = z.object({
  leaseId: BaseValidation.uuid,
  objectKey: z.string().min(1, 'Object key required').max(500, 'Object key too long'),
  caption: z.string().max(500, 'Caption too long').optional(),
  authorName: BaseValidation.name.optional(),
  authorEmail: BaseValidation.email.optional(),
})

// Contact form validation
export const ContactFormSchema = z.object({
  name: BaseValidation.name,
  email: BaseValidation.email,
  topic: z.enum(['general', 'bug', 'data-correction', 'partnership']),
  message: BaseValidation.longText,
  consent: BaseValidation.consent,
  _hp: BaseValidation.honeypot,
  ttf: BaseValidation.timeToFill,
})

// Feedback form validation
export const FeedbackFormSchema = z.object({
  name: BaseValidation.name,
  email: BaseValidation.email,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject too long'),
  message: BaseValidation.longText,
  hp: BaseValidation.honeypot,
  t: BaseValidation.timestamp,
})

// Newsletter subscription validation
export const NewsletterSubscriptionSchema = z.object({
  email: BaseValidation.email,
  name: BaseValidation.name,
  recaptchaToken: BaseValidation.recaptchaToken.optional(),
  hp: BaseValidation.honeypot,
  source: z.string().max(100, 'Source too long').optional(),
  consent: BaseValidation.consent,
  t: BaseValidation.timestamp,
})

// Claim submission validation
export const ClaimSubmissionSchema = z.object({
  shopId: z.string().min(1, 'Shop ID required'),
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(200, 'Shop name too long'),
  shopSlug: BaseValidation.slug,
  shopUrl: BaseValidation.url,
  shopAddress: z.string().min(5, 'Shop address must be at least 5 characters').max(500, 'Shop address too long'),
  claimantName: BaseValidation.name,
  claimantRole: z.string().min(2, 'Role must be at least 2 characters').max(100, 'Role too long'),
  claimantEmail: BaseValidation.email,
  claimantPhone: BaseValidation.phone,
  claimType: BaseValidation.claimType,
  corrections: BaseValidation.longText,
  additionalInfo: BaseValidation.longText,
  verificationMethod: BaseValidation.verificationMethod,
  verificationDetails: BaseValidation.shortText,
  consent: BaseValidation.consent,
  hp: BaseValidation.honeypot,
  t: BaseValidation.timestamp,
})

// Admin photo approval/rejection validation
export const AdminPhotoActionSchema = z.object({
  photoId: BaseValidation.uuid,
  reason: z.string().max(500, 'Reason too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Database integrity check validation
export const DatabaseIntegritySchema = z.object({
  schema: z.enum(['farms', 'photos', 'submissions']),
  action: z.enum(['check', 'cleanup']),
})

// Input sanitization functions
export async function sanitizeInput(input: string): Promise<string> {
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Remove potential script tags and dangerous content using dynamic import
  try {
    const purify = await getDOMPurify()
    sanitized = purify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
  } catch (error) {
    // Fallback: basic HTML tag removal if DOMPurify fails to load
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  return sanitized
}

export async function sanitizeObject<T extends Record<string, any>>(obj: T): Promise<T> {
  const sanitized = { ...obj } as T
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = await sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as any)[key] = await sanitizeObject(value)
    }
  }
  
  return sanitized
}

// Validation error handling
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class SanitizationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public originalValue?: any
  ) {
    super(message)
    this.name = 'SanitizationError'
  }
}

// Comprehensive validation function
export async function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: {
    sanitize?: boolean
    strict?: boolean
  } = {}
): Promise<T> {
  try {
    // Sanitize input if requested
    let sanitizedData = data
    if (options.sanitize && typeof data === 'object' && data !== null) {
      sanitizedData = await sanitizeObject(data as Record<string, any>)
    }
    
    // Validate with schema
    if (options.strict) {
      return schema.parse(sanitizedData)
    } else {
      const result = schema.safeParse(sanitizedData)
      
      if (!result.success) {
        const firstError = result.error.issues[0]
        throw new ValidationError(
          firstError.message,
          firstError.path.join('.'),
          firstError.path.length > 0 ? (sanitizedData as any)[firstError.path[0]] : undefined,
          'VALIDATION_FAILED'
        )
      }
      
      return result.data
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new ValidationError(
        firstError.message,
        firstError.path.join('.'),
        firstError.path.length > 0 ? (data as any)[firstError.path[0]] : undefined,
        'SCHEMA_VALIDATION_FAILED'
      )
    }
    
    throw new ValidationError(
      'Unknown validation error',
      undefined,
      undefined,
      'UNKNOWN_ERROR'
    )
  }
}

// Rate limiting validation
export function validateRateLimit(
  attempts: number,
  maxAttempts: number,
  windowMs: number,
  lastAttemptTime: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const timeSinceLastAttempt = now - lastAttemptTime
  
  // Reset if window has passed
  if (timeSinceLastAttempt > windowMs) {
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs
    }
  }
  
  // Check if limit exceeded
  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: lastAttemptTime + windowMs
    }
  }
  
  return {
    allowed: true,
    remaining: maxAttempts - attempts - 1,
    resetTime: lastAttemptTime + windowMs
  }
}

// Content validation for user-generated content
export async function validateContent(content: string): Promise<{
  valid: boolean
  issues: string[]
  sanitized?: string
}> {
  const issues: string[] = []
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      issues.push(`Suspicious content pattern detected: ${pattern.source}`)
    }
  }
  
  // Check for excessive repetition
  const words = content.toLowerCase().split(/\s+/)
  const wordCounts = new Map<string, number>()
  
  for (const word of words) {
    if (word.length > 3) { // Only count words longer than 3 characters
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    }
  }
  
  for (const [word, count] of wordCounts) {
    if (count > 10) { // More than 10 repetitions of the same word
      issues.push(`Excessive repetition detected: "${word}" appears ${count} times`)
    }
  }
  
  // Check for excessive capitalization
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (upperCaseRatio > 0.7) {
    issues.push('Excessive capitalization detected')
  }
  
  // Check for excessive punctuation
  const punctuationRatio = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / content.length
  if (punctuationRatio > 0.3) {
    issues.push('Excessive punctuation detected')
  }
  
  const valid = issues.length === 0
  
  return {
    valid,
    issues,
    sanitized: valid ? (await sanitizeInput(content)) : undefined
  }
}

// Export all schemas for easy access
export const ValidationSchemas = {
  farmSubmission: FarmSubmissionSchema,
  photoUpload: PhotoUploadSchema,
  photoFinalization: PhotoFinalizationSchema,
  contactForm: ContactFormSchema,
  feedbackForm: FeedbackFormSchema,
  newsletterSubscription: NewsletterSubscriptionSchema,
  claimSubmission: ClaimSubmissionSchema,
  adminPhotoAction: AdminPhotoActionSchema,
  databaseIntegrity: DatabaseIntegritySchema,
  base: BaseValidation,
}
