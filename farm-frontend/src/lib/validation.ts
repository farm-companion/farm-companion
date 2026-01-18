import { z } from 'zod'

// =============================================================================
// OPENING HOURS SCHEMAS
// =============================================================================
// Two formats exist in the codebase:
// 1. Array format: [{ day: "Monday", open: "09:00", close: "17:00" }, ...]
// 2. Object format: { "0": { open: "09:00", close: "17:00" }, ... } (0=Sunday)
// Both are validated and can be converted between.

/**
 * Time string in HH:MM format (24-hour) or special values
 * Examples: "09:00", "17:30", "Closed", "24 hours"
 */
export const TimeStringSchema = z.string().refine(
  (val) => {
    const lower = val.toLowerCase()
    if (lower === 'closed' || lower === '24 hours') return true
    return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(val)
  },
  { message: 'Time must be HH:MM format, "Closed", or "24 hours"' }
)

/**
 * Day name string (case-insensitive)
 */
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
export const DayNameSchema = z.string().refine(
  (val) => DAY_NAMES.includes(val.toLowerCase() as typeof DAY_NAMES[number]),
  { message: 'Day must be a valid day name (Monday-Sunday)' }
)

// -----------------------------------------------------------------------------
// ARRAY FORMAT: [{ day, open, close }]
// -----------------------------------------------------------------------------

/**
 * Single entry in array format opening hours
 */
export const OpeningHoursArrayEntrySchema = z.object({
  day: DayNameSchema,
  open: TimeStringSchema,
  close: TimeStringSchema,
})

/**
 * Array format opening hours (used in FarmShop type)
 */
export const OpeningHoursArraySchema = z.array(OpeningHoursArrayEntrySchema).refine(
  (arr) => arr.length <= 7,
  { message: 'Maximum 7 days allowed' }
)

export type OpeningHoursArray = z.infer<typeof OpeningHoursArraySchema>

// -----------------------------------------------------------------------------
// OBJECT FORMAT: { [dayNumber]: { open, close, closed? } }
// -----------------------------------------------------------------------------

/**
 * Single day entry in object format
 */
export const OpeningHoursObjectEntrySchema = z.object({
  open: TimeStringSchema,
  close: TimeStringSchema,
  closed: z.boolean().optional(),
})

/**
 * Object format opening hours (used in farm-status.ts)
 * Keys are day numbers as strings: "0" = Sunday, "6" = Saturday
 */
export const OpeningHoursObjectSchema = z.record(
  z.string().regex(/^[0-6]$/, 'Day key must be 0-6'),
  OpeningHoursObjectEntrySchema
).refine(
  (data) => Object.keys(data).length <= 7,
  { message: 'Maximum 7 days allowed' }
)

export type OpeningHoursObject = z.infer<typeof OpeningHoursObjectSchema>

// -----------------------------------------------------------------------------
// PARSING AND CONVERSION UTILITIES
// -----------------------------------------------------------------------------

/**
 * Parse opening hours from unknown data, accepting either format
 * Returns the validated data in its original format, or null if invalid
 */
export function parseOpeningHours(data: unknown): OpeningHoursArray | OpeningHoursObject | null {
  if (data === null || data === undefined) return null

  // Try array format first
  const arrayResult = OpeningHoursArraySchema.safeParse(data)
  if (arrayResult.success) return arrayResult.data

  // Try object format
  const objectResult = OpeningHoursObjectSchema.safeParse(data)
  if (objectResult.success) return objectResult.data

  return null
}

/**
 * Convert array format to object format
 */
export function arrayToObjectHours(hours: OpeningHoursArray): OpeningHoursObject {
  const dayToIndex: Record<string, string> = {
    sunday: '0', monday: '1', tuesday: '2', wednesday: '3',
    thursday: '4', friday: '5', saturday: '6',
  }

  const result: OpeningHoursObject = {}
  for (const entry of hours) {
    const dayIndex = dayToIndex[entry.day.toLowerCase()]
    if (dayIndex) {
      const isClosed = entry.open.toLowerCase() === 'closed' || entry.close.toLowerCase() === 'closed'
      result[dayIndex] = {
        open: isClosed ? '00:00' : entry.open,
        close: isClosed ? '00:00' : entry.close,
        closed: isClosed,
      }
    }
  }
  return result
}

/**
 * Convert object format to array format
 */
export function objectToArrayHours(hours: OpeningHoursObject): OpeningHoursArray {
  const indexToDay: Record<string, string> = {
    '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
    '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
  }

  const result: OpeningHoursArray = []
  for (const [key, value] of Object.entries(hours)) {
    const dayName = indexToDay[key]
    if (dayName) {
      result.push({
        day: dayName,
        open: value.closed ? 'Closed' : value.open,
        close: value.closed ? 'Closed' : value.close,
      })
    }
  }
  return result
}

/**
 * Normalize opening hours to object format for consistent processing
 * Returns null if data is invalid
 */
export function normalizeToObjectHours(data: unknown): OpeningHoursObject | null {
  if (data === null || data === undefined) return null

  // Already object format?
  const objectResult = OpeningHoursObjectSchema.safeParse(data)
  if (objectResult.success) return objectResult.data

  // Array format that needs conversion?
  const arrayResult = OpeningHoursArraySchema.safeParse(data)
  if (arrayResult.success) return arrayToObjectHours(arrayResult.data)

  return null
}

/**
 * Validate opening hours and return detailed errors
 */
export function validateOpeningHours(data: unknown): { valid: boolean; format: 'array' | 'object' | null; errors: string[] } {
  if (data === null || data === undefined) {
    return { valid: false, format: null, errors: ['Opening hours data is required'] }
  }

  const arrayResult = OpeningHoursArraySchema.safeParse(data)
  if (arrayResult.success) {
    return { valid: true, format: 'array', errors: [] }
  }

  const objectResult = OpeningHoursObjectSchema.safeParse(data)
  if (objectResult.success) {
    return { valid: true, format: 'object', errors: [] }
  }

  // Combine errors from both attempts
  const errors = [
    ...arrayResult.error.issues.map((i) => `Array format: ${i.path.join('.')}: ${i.message}`),
    ...objectResult.error.issues.map((i) => `Object format: ${i.path.join('.')}: ${i.message}`),
  ]
  return { valid: false, format: null, errors: errors.slice(0, 5) } // Limit error count
}

// =============================================================================
// BASE SCHEMAS FOR COMMON FIELDS
// =============================================================================

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
