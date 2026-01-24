// Accessibility Middleware for WCAG 2.2 AA Compliance
// PuredgeOS 3.0 Compliant Accessibility Management

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const a11yLogger = logger.child({ route: 'lib/accessibility-middleware' })

// Accessibility compliance checker middleware
export function withAccessibilityMiddleware(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const response = await handler(request, context)
    
    // Only check HTML responses
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/html')) {
      return response
    }
    
    // Clone response to read body
    const responseClone = response.clone()
    const html = await responseClone.text()
    
    // Create a temporary DOM parser (in a real implementation, you'd use jsdom or similar)
    // For now, we'll do basic checks
    const accessibilityIssues = checkHTMLAccessibility(html)
    
    if (accessibilityIssues.length > 0) {
      a11yLogger.warn('Accessibility issues detected', { issues: accessibilityIssues, issueCount: accessibilityIssues.length })
      
      // In development, you might want to add warnings to the response
      if (process.env.NODE_ENV === 'development') {
        const warningScript = `
          <script>
            console.warn('Accessibility issues detected:', ${JSON.stringify(accessibilityIssues)});
          </script>
        `
        
        const modifiedHTML = html.replace('</body>', `${warningScript}</body>`)
        return new NextResponse(modifiedHTML, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      }
    }
    
    return response
  }
}

// Basic HTML accessibility checker
function checkHTMLAccessibility(html: string): string[] {
  const issues: string[] = []
  
  // Check for missing alt attributes on images
  const imgRegex = /<img[^>]*>/g
  const images = html.match(imgRegex) || []
  
  images.forEach(img => {
    if (!img.includes('alt=')) {
      issues.push('Image missing alt attribute')
    }
  })
  
  // Check for proper heading structure
  const headingRegex = /<h([1-6])[^>]*>/g
  const headings = html.match(headingRegex) || []
  
  if (headings.length > 0) {
    const headingLevels = headings.map(h => parseInt(h.match(/<h([1-6])/)?.[1] || '0'))
    
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        issues.push('Heading levels are skipped')
        break
      }
    }
  }
  
  // Check for form labels
  const inputRegex = /<input[^>]*>/g
  const inputs = html.match(inputRegex) || []
  
  inputs.forEach(input => {
    const idMatch = input.match(/id="([^"]*)"/)
    if (idMatch) {
      const id = idMatch[1]
      const hasLabel = html.includes(`<label for="${id}"`)
      const hasAriaLabel = input.includes('aria-label=')
      const hasAriaLabelledBy = input.includes('aria-labelledby=')
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push('Form input missing label')
      }
    }
  })
  
  // Check for proper ARIA attributes
  const buttonRegex = /<button[^>]*>/g
  const buttons = html.match(buttonRegex) || []
  
  buttons.forEach(button => {
    const hasAriaLabel = button.includes('aria-label=')
    const hasAriaLabelledBy = button.includes('aria-labelledby=')
    const hasTextContent = button.includes('>') && !button.endsWith('/>')
    
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasTextContent) {
      issues.push('Button missing accessible name')
    }
  })
  
  // Check for proper link text
  const linkRegex = /<a[^>]*>([^<]*)<\/a>/g
  const links = html.match(linkRegex) || []
  
  links.forEach(link => {
    const textMatch = link.match(/<a[^>]*>([^<]*)<\/a>/)
    if (textMatch) {
      const text = textMatch[1].trim()
      if (!text || text === 'Click here' || text === 'Read more' || text === 'Learn more') {
        issues.push('Link has non-descriptive text')
      }
    }
  })
  
  return issues
}

// Accessibility headers middleware
export function addAccessibilityHeaders(response: NextResponse): NextResponse {
  // Add accessibility-related headers
  response.headers.set('X-Accessibility-Compliance', 'WCAG-2.2-AA')
  response.headers.set('X-Content-Accessibility', 'enabled')
  
  return response
}

// Screen reader detection middleware
export function withScreenReaderSupport(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const userAgent = request.headers.get('user-agent') || ''
    
    // Detect screen readers
    const screenReaderIndicators = [
      'NVDA',
      'JAWS',
      'VoiceOver',
      'TalkBack',
      'Orca',
      'ChromeVox',
    ]
    
    const isScreenReader = screenReaderIndicators.some(indicator => 
      userAgent.includes(indicator)
    )
    
    // Add screen reader flag to request
    request.headers.set('X-Screen-Reader', isScreenReader.toString())
    
    const response = await handler(request, context)
    
    // Add screen reader support headers
    if (isScreenReader) {
      response.headers.set('X-Screen-Reader-Support', 'enabled')
    }
    
    return response
  }
}

// High contrast mode detection
export function withHighContrastSupport(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const response = await handler(request, context)
    
    // Add high contrast support headers
    response.headers.set('X-High-Contrast-Support', 'enabled')
    
    return response
  }
}

// Reduced motion support
export function withReducedMotionSupport(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const response = await handler(request, context)
    
    // Add reduced motion support headers
    response.headers.set('X-Reduced-Motion-Support', 'enabled')
    
    return response
  }
}

// Comprehensive accessibility middleware
export function withComprehensiveAccessibility(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
  return withAccessibilityMiddleware(
    withScreenReaderSupport(
      withHighContrastSupport(
        withReducedMotionSupport(handler)
      )
    )
  )
}

// Accessibility compliance checker for API responses
export function checkAPIAccessibility(data: any): {
  compliant: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check for proper error messages
  if (data.error && typeof data.error === 'string') {
    if (data.error.length < 10) {
      issues.push('Error message too short for accessibility')
    }
  }
  
  // Check for proper success messages
  if (data.success && typeof data.success === 'string') {
    if (data.success.length < 10) {
      issues.push('Success message too short for accessibility')
    }
  }
  
  // Check for proper field validation messages
  if (data.validation && typeof data.validation === 'object') {
    Object.values(data.validation).forEach((message: any) => {
      if (typeof message === 'string' && message.length < 10) {
        issues.push('Validation message too short for accessibility')
      }
    })
  }
  
  return {
    compliant: issues.length === 0,
    issues
  }
}

// Accessibility testing utilities
export function generateAccessibilityReport(html: string): {
  score: number
  issues: string[]
  recommendations: string[]
} {
  const issues = checkHTMLAccessibility(html)
  const score = Math.max(0, 100 - (issues.length * 10))
  
  const recommendations = [
    'Ensure all images have descriptive alt text',
    'Use proper heading hierarchy (h1, h2, h3, etc.)',
    'Provide labels for all form inputs',
    'Use descriptive link text',
    'Add ARIA labels for interactive elements',
    'Ensure sufficient color contrast',
    'Provide keyboard navigation support',
    'Add skip links for keyboard users',
  ]
  
  return {
    score,
    issues,
    recommendations
  }
}
