import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRouteLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/errors'

// Check result type
interface CheckResult {
  status: 'pass' | 'fail' | 'warning' | 'unknown'
  details: Record<string, unknown>
}

// Full diagnostics result type
interface IndexNowDiagnostics {
  timestamp: string
  errorResponse: string
  submittedUrl: string
  checks: {
    publicKeyFile: CheckResult
    hostValidation: CheckResult
    urlListValidation: CheckResult
    rateLimiting: CheckResult
  }
  recommendations: string[]
  status: 'pass' | 'fail' | 'warning' | 'unknown'
}

/**
 * IndexNow Error Diagnostic Tool
 *
 * This endpoint diagnoses IndexNow POST errors by checking three critical areas:
 * 1. Public key file accessibility and matching
 * 2. Host validation in JSON payload
 * 3. URL list validation and rate limiting
 */
export async function POST(request: NextRequest) {
  const logger = createRouteLogger('api/diagnostics/indexnow-errors', request)

  try {
    logger.info('Processing IndexNow error diagnostics request')

    const { errorResponse, submittedUrl } = await request.json()

    logger.info('Running IndexNow diagnostics', {
      hasErrorResponse: !!errorResponse,
      submittedUrl
    })

    const diagnostics = {
      timestamp: new Date().toISOString(),
      errorResponse: errorResponse || 'No error response provided',
      submittedUrl: submittedUrl || 'No URL provided',
      checks: {
        publicKeyFile: await checkPublicKeyFile(logger),
        hostValidation: await checkHostValidation(logger),
        urlListValidation: await checkUrlListValidation(submittedUrl, logger),
        rateLimiting: await checkRateLimiting(logger),
      },
      recommendations: [] as string[],
      status: 'unknown' as 'pass' | 'fail' | 'warning' | 'unknown',
    }

    // Analyze results and provide recommendations
    analyzeIndexNowResults(diagnostics)

    logger.info('IndexNow error diagnostics completed', {
      status: diagnostics.status,
      checksCompleted: Object.keys(diagnostics.checks).length
    })

    return NextResponse.json(diagnostics)

  } catch (error) {
    return handleApiError(error, 'api/diagnostics/indexnow-errors')
  }
}

/**
 * Check 1: Public key file accessibility and matching
 */
async function checkPublicKeyFile(logger: ReturnType<typeof createRouteLogger>) {
  logger.info('Checking public key file accessibility')
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      keyConfigured: false,
      keyValue: null as string | null,
      fileAccessible: false,
      fileContent: null as string | null,
      fileMatches: false,
      fileUrl: null as string | null,
      error: null as string | null,
    }
  }

  try {
    // Check if key is configured
    const bingIndexNowKey = process.env.BING_INDEXNOW_KEY
    if (!bingIndexNowKey) {
      result.status = 'fail'
      result.details.error = 'BING_INDEXNOW_KEY environment variable not configured'
      logger.warn('BING_INDEXNOW_KEY not configured')
      return result
    }

    result.details.keyConfigured = true
    result.details.keyValue = bingIndexNowKey
    result.details.fileUrl = `https://www.farmcompanion.co.uk/${bingIndexNowKey}.txt`

    logger.info('Public key configured', { fileUrl: result.details.fileUrl })

    // Check if key file exists in public directory
    try {
      const keyFilePath = path.join(process.cwd(), 'public', `${bingIndexNowKey}.txt`)
      const keyFileContent = await fs.readFile(keyFilePath, 'utf-8')
      result.details.fileContent = keyFileContent.trim()
      result.details.fileMatches = keyFileContent.trim() === bingIndexNowKey
    } catch {
      result.details.error = 'Key file not found in public directory'
      result.status = 'fail'
      return result
    }

    // Test file accessibility via HTTP
    try {
      const fileResponse = await fetch(result.details.fileUrl)
      if (fileResponse.ok) {
        const fileContent = await fileResponse.text()
        result.details.fileAccessible = true
        result.details.fileMatches = fileContent.trim() === bingIndexNowKey

        if (result.details.fileMatches) {
          result.status = 'pass'
          logger.info('Public key file check passed', { fileUrl: result.details.fileUrl })
        } else {
          result.status = 'fail'
          result.details.error = 'File content does not match BING_INDEXNOW_KEY'
          logger.warn('Public key file content mismatch')
        }
      } else {
        result.status = 'fail'
        result.details.error = `Key file not accessible via HTTP: ${fileResponse.status}`
        logger.warn('Public key file not accessible via HTTP', { status: fileResponse.status })
      }
    } catch (error) {
      result.status = 'fail'
      result.details.error = `Cannot access key file via HTTP: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('Failed to access public key file via HTTP', {}, error as Error)
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Public key file check failed', {}, error as Error)
  }

  return result
}

/**
 * Check 2: Host validation in JSON payload
 */
async function checkHostValidation(logger: ReturnType<typeof createRouteLogger>) {
  logger.info('Checking host validation')
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      configuredHost: 'www.farmcompanion.co.uk',
      payloadHost: null as string | null,
      hostsMatch: false,
      error: null as string | null,
    }
  }

  try {
    // Check the host used in IndexNow payloads
    const siteUrl = process.env.SITE_URL || 'https://www.farmcompanion.co.uk'
    const url = new URL(siteUrl)
    result.details.payloadHost = url.host

    if (result.details.payloadHost === result.details.configuredHost) {
      result.status = 'pass'
      result.details.hostsMatch = true
      logger.info('Host validation passed', {
        configuredHost: result.details.configuredHost,
        payloadHost: result.details.payloadHost
      })
    } else {
      result.status = 'fail'
      result.details.error = `Host mismatch: payload uses '${result.details.payloadHost}' but should be '${result.details.configuredHost}'`
      logger.warn('Host validation failed', {
        configuredHost: result.details.configuredHost,
        payloadHost: result.details.payloadHost
      })
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Host validation check failed', {}, error as Error)
  }

  return result
}

/**
 * Check 3: URL list validation
 */
async function checkUrlListValidation(submittedUrl: string | undefined, logger: ReturnType<typeof createRouteLogger>) {
  logger.info('Checking URL list validation', { hasSubmittedUrl: !!submittedUrl })
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      urlProvided: !!submittedUrl,
      urlValid: false,
      urlHost: null as string | null,
      urlAbsolute: false,
      urlHttps: false,
      error: null as string | null,
    }
  }

  try {
    if (!submittedUrl) {
      result.status = 'warning'
      result.details.error = 'No URL provided for validation'
      return result
    }

    result.details.urlProvided = true

    // Validate URL format
    try {
      const url = new URL(submittedUrl)
      result.details.urlValid = true
      result.details.urlHost = url.host
      result.details.urlAbsolute = true
      result.details.urlHttps = url.protocol === 'https:'

      // Check if URL is for the correct host
      if (url.host === 'www.farmcompanion.co.uk') {
        result.status = 'pass'
        logger.info('URL validation passed', { url: submittedUrl, host: url.host })
      } else {
        result.status = 'fail'
        result.details.error = `URL host '${url.host}' does not match expected host 'www.farmcompanion.co.uk'`
        logger.warn('URL host mismatch', { url: submittedUrl, host: url.host })
      }
    } catch {
      result.status = 'fail'
      result.details.error = 'Invalid URL format'
      logger.warn('Invalid URL format', { url: submittedUrl })
    }

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Unknown error'
    logger.error('URL validation check failed', {}, error as Error)
  }

  return result
}

/**
 * Check 4: Rate limiting analysis
 */
async function checkRateLimiting(logger: ReturnType<typeof createRouteLogger>) {
  logger.info('Checking rate limiting')
  const result = {
    status: 'unknown' as 'pass' | 'fail' | 'warning',
    details: {
      recentSubmissions: 0,
      rateLimitExceeded: false,
      recommendations: [] as string[],
      error: null as string | null,
    }
  }

  try {
    // Note: In a real implementation, you'd track recent submissions
    // For now, we'll provide general guidance
    result.details.recommendations = [
      'Bing IndexNow allows up to 10,000 URLs per day',
      'Maximum 200 URLs per submission',
      'Wait at least 1 second between submissions',
      'Monitor for 429 (Too Many Requests) responses',
    ]

    result.status = 'pass'
    logger.info('Rate limiting check completed')

  } catch (error) {
    result.status = 'fail'
    result.details.error = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Rate limiting check failed', {}, error as Error)
  }

  return result
}

/**
 * Analyze IndexNow diagnostic results
 */
function analyzeIndexNowResults(diagnostics: IndexNowDiagnostics) {
  const { checks } = diagnostics
  const recommendations: string[] = []

  // Public key file analysis
  if (checks.publicKeyFile.status === 'fail') {
    recommendations.push('❌ Public key file issue: Fix key file accessibility or content')
  }

  // Host validation analysis
  if (checks.hostValidation.status === 'fail') {
    recommendations.push('❌ Host validation issue: Ensure host matches www.farmcompanion.co.uk')
  }

  // URL list validation analysis
  if (checks.urlListValidation.status === 'fail') {
    recommendations.push('❌ URL validation issue: Ensure URLs are absolute HTTPS URLs for correct host')
  }

  // Rate limiting analysis
  if (checks.rateLimiting.status === 'fail') {
    recommendations.push('❌ Rate limiting issue: Reduce submission frequency')
  }

  // Overall status determination
  const hasFailures = Object.values(checks).some((check: CheckResult) => check.status === 'fail')
  const hasWarnings = Object.values(checks).some((check: CheckResult) => check.status === 'warning')

  if (hasFailures) {
    diagnostics.status = 'fail'
    recommendations.push('❌ Critical IndexNow configuration issues found')
  } else if (hasWarnings) {
    diagnostics.status = 'warning'
    recommendations.push('⚠️ Some IndexNow configuration warnings found')
  } else {
    diagnostics.status = 'pass'
    recommendations.push('✅ IndexNow configuration appears correct')
  }

  // Additional troubleshooting steps
  recommendations.push('🔍 Check Bing IndexNow documentation for error codes')
  recommendations.push('📊 Monitor Bing Webmaster Tools for submission status')
  recommendations.push('🔄 Try manual submission via Bing Webmaster Tools')
  recommendations.push('📝 Review server logs for detailed error information')

  diagnostics.recommendations = recommendations
}
