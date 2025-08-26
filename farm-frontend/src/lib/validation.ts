import { z } from 'zod'

// Base schemas for common fields
export const EmailSchema = z.string().email('Invalid email address')
export const NameSchema = z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name too long')
export const MessageSchema = z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long')

// Contact form schema
export const ContactSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: MessageSchema,
  hp: z.string().optional(), // honeypot
  t: z.number(), // submit timestamp
  token: z.string().optional(), // Turnstile token
})

// Farm submission schema
export const FarmSubmissionSchema = z.object({
  name: z.string().min(2, 'Farm name must be at least 2 characters').max(120, 'Farm name too long'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address too long'),
  city: z.string().max(80, 'City name too long').optional(),
  county: z.string().max(80, 'County name too long'),
  postcode: z.string().max(12, 'Postcode too long'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000, 'Notes too long').optional(),
  hp: z.string().optional(), // honeypot
  t: z.number(), // submit timestamp
  token: z.string().optional(), // Turnstile token
})

// Feedback schema
export const FeedbackSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  feedback: MessageSchema,
  page: z.string().max(200, 'Page URL too long').optional(),
  hp: z.string().optional(), // honeypot
  t: z.number(), // submit timestamp
  token: z.string().optional(), // Turnstile token
})

// Newsletter subscription schema
export const NewsletterSchema = z.object({
  email: EmailSchema,
  hp: z.string().optional(), // honeypot
  t: z.number(), // submit timestamp
  token: z.string().optional(), // Turnstile token
})

// Image upload schema
export const ImageUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  description: z.string().max(500, 'Description too long').optional(),
  hp: z.string().optional(), // honeypot
  t: z.number(), // submit timestamp
  token: z.string().optional(), // Turnstile token
})

// Utility function to sanitize text content
export function sanitizeText(text: string): string {
  // Remove any HTML tags and normalize whitespace
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Utility function to validate and sanitize URLs
export function validateAndSanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Only allow HTTPS URLs
    if (parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

// Utility function to check for spam indicators
export function checkSpamIndicators(data: any): boolean {
  // Check for excessive links in text content
  const textFields = ['message', 'notes', 'feedback']
  for (const field of textFields) {
    if (data[field]) {
      const linkCount = (data[field].match(/https?:\/\/[^\s]+/g) || []).length
      if (linkCount > 3) return true // Too many links
    }
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /buy.*viagra/i,
    /casino.*online/i,
    /loan.*quick/i,
    /click.*here/i,
    /free.*money/i,
  ]
  
  const allText = Object.values(data).join(' ').toLowerCase()
  return suspiciousPatterns.some(pattern => pattern.test(allText))
}
