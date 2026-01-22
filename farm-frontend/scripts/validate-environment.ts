#!/usr/bin/env tsx
/**
 * Environment Validation Script
 *
 * Validates that all required environment variables are properly configured
 * for local development or production deployment.
 *
 * Usage:
 *   pnpm tsx scripts/validate-environment.ts
 *   pnpm tsx scripts/validate-environment.ts --strict  # Fail on warnings
 *
 * Exit Codes:
 *   0 - All required variables present
 *   1 - Critical variables missing
 *   2 - Warning: Optional variables missing (with --strict flag)
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

interface EnvVar {
  name: string
  required: boolean
  category: string
  description: string
  example?: string
  checkConnection?: boolean
}

const ENV_VARS: EnvVar[] = [
  // CRITICAL - Required for Core Functionality
  {
    name: 'DATABASE_URL',
    required: true,
    category: 'Database',
    description: 'PostgreSQL connection string (direct)',
    example: 'postgresql://user:password@host:5432/database',
  },
  {
    name: 'DATABASE_POOLER_URL',
    required: false,
    category: 'Database',
    description: 'PostgreSQL pooler connection (recommended for production)',
    example: 'postgresql://user:password@pooler-host:6543/database',
  },
  {
    name: 'KV_REST_API_URL',
    required: true,
    category: 'Redis/KV',
    description: 'Vercel KV (Redis) REST API URL',
    example: 'https://your-kv.upstash.io',
  },
  {
    name: 'KV_REST_API_TOKEN',
    required: true,
    category: 'Redis/KV',
    description: 'Vercel KV (Redis) REST API token',
  },
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    required: true,
    category: 'Storage',
    description: 'Vercel Blob Storage token for image uploads',
  },

  // MAP & SEARCH
  {
    name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    required: true,
    category: 'Maps',
    description: 'Google Maps API key (client-side)',
  },
  {
    name: 'MEILISEARCH_HOST',
    required: false,
    category: 'Search',
    description: 'Meilisearch instance URL',
    example: 'https://your-instance.meilisearch.io',
  },
  {
    name: 'MEILISEARCH_API_KEY',
    required: false,
    category: 'Search',
    description: 'Meilisearch API key',
  },

  // EMAIL & NOTIFICATIONS
  {
    name: 'RESEND_API_KEY',
    required: true,
    category: 'Email',
    description: 'Resend email service API key',
  },
  {
    name: 'RESEND_FROM',
    required: false,
    category: 'Email',
    description: 'Default sender email address',
    example: 'hello@farmcompanion.co.uk',
  },

  // ADMIN & SECURITY
  {
    name: 'ADMIN_EMAIL',
    required: true,
    category: 'Admin',
    description: 'Admin user email for authentication',
  },
  {
    name: 'ADMIN_PASSWORD',
    required: true,
    category: 'Admin',
    description: 'Admin user password (should be strong)',
  },
  {
    name: 'RECAPTCHA_SECRET_KEY',
    required: false,
    category: 'Security',
    description: 'Google reCAPTCHA secret key (choose one captcha provider)',
  },
  {
    name: 'HCAPTCHA_SECRET',
    required: false,
    category: 'Security',
    description: 'hCaptcha secret key (alternative to reCAPTCHA)',
  },
  {
    name: 'TURNSTILE_SECRET_KEY',
    required: false,
    category: 'Security',
    description: 'Cloudflare Turnstile secret key (alternative to reCAPTCHA)',
  },

  // SEO & INDEXING
  {
    name: 'SITE_URL',
    required: false,
    category: 'SEO',
    description: 'Production site URL',
    example: 'https://www.farmcompanion.co.uk',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: false,
    category: 'SEO',
    description: 'Public site URL (client-side)',
    example: 'https://www.farmcompanion.co.uk',
  },

  // OPTIONAL SERVICES
  {
    name: 'DEEPSEEK_API_KEY',
    required: false,
    category: 'AI',
    description: 'DeepSeek API for content generation',
  },
  {
    name: 'FAL_KEY',
    required: false,
    category: 'AI',
    description: 'fal.ai API for image generation',
  },
  {
    name: 'NEXT_PUBLIC_GA_ID',
    required: false,
    category: 'Analytics',
    description: 'Google Analytics measurement ID',
  },
]

interface ValidationResult {
  category: string
  passed: number
  failed: number
  warnings: number
  details: {
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
  }[]
}

function validateEnvironment(strictMode = false): {
  results: ValidationResult[]
  totalCriticalFailures: number
  totalWarnings: number
} {
  const resultsByCategory = new Map<string, ValidationResult>()
  let totalCriticalFailures = 0
  let totalWarnings = 0

  for (const envVar of ENV_VARS) {
    const category = envVar.category
    if (!resultsByCategory.has(category)) {
      resultsByCategory.set(category, {
        category,
        passed: 0,
        failed: 0,
        warnings: 0,
        details: [],
      })
    }

    const categoryResult = resultsByCategory.get(category)!
    const value = process.env[envVar.name]
    const isSet = value !== undefined && value !== ''

    if (envVar.required && !isSet) {
      // Critical failure
      categoryResult.failed++
      categoryResult.details.push({
        name: envVar.name,
        status: 'fail',
        message: `MISSING (required): ${envVar.description}`,
      })
      totalCriticalFailures++
    } else if (!envVar.required && !isSet) {
      // Warning
      categoryResult.warnings++
      categoryResult.details.push({
        name: envVar.name,
        status: 'warning',
        message: `Not set (optional): ${envVar.description}`,
      })
      totalWarnings++
    } else {
      // Pass
      categoryResult.passed++
      const maskedValue = value!.length > 20 ? `${value!.substring(0, 20)}...` : value!
      categoryResult.details.push({
        name: envVar.name,
        status: 'pass',
        message: `Set: ${maskedValue.replace(/./g, '*')}`,
      })
    }
  }

  return {
    results: Array.from(resultsByCategory.values()),
    totalCriticalFailures,
    totalWarnings,
  }
}

function printResults(
  results: ValidationResult[],
  totalCriticalFailures: number,
  totalWarnings: number,
  strictMode: boolean
) {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.cyan}║           FARM COMPANION - ENVIRONMENT VALIDATION              ║${colors.reset}`)
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`)

  // Print results by category
  for (const result of results) {
    const categoryColor =
      result.failed > 0 ? colors.red : result.warnings > 0 ? colors.yellow : colors.green

    console.log(`${categoryColor}▶ ${result.category}${colors.reset}`)
    console.log(
      `${colors.gray}  Passed: ${result.passed} | Failed: ${result.failed} | Warnings: ${result.warnings}${colors.reset}\n`
    )

    for (const detail of result.details) {
      const statusSymbol = detail.status === 'pass' ? '✓' : detail.status === 'fail' ? '✗' : '⚠'
      const statusColor =
        detail.status === 'pass' ? colors.green : detail.status === 'fail' ? colors.red : colors.yellow

      console.log(`  ${statusColor}${statusSymbol} ${detail.name}${colors.reset}`)
      console.log(`    ${colors.gray}${detail.message}${colors.reset}\n`)
    }
  }

  // Print summary
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.cyan}║                         SUMMARY                                ║${colors.reset}`)
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`)

  if (totalCriticalFailures > 0) {
    console.log(`${colors.red}✗ Critical Failures: ${totalCriticalFailures}${colors.reset}`)
    console.log(`${colors.gray}  Application will not function without these variables.${colors.reset}\n`)
  } else {
    console.log(`${colors.green}✓ All required environment variables are set!${colors.reset}\n`)
  }

  if (totalWarnings > 0) {
    console.log(`${colors.yellow}⚠ Warnings: ${totalWarnings}${colors.reset}`)
    console.log(
      `${colors.gray}  Optional features may not work without these variables.${colors.reset}\n`
    )
  }

  // Print recommendations
  if (totalCriticalFailures > 0 || totalWarnings > 0) {
    console.log(`${colors.blue}RECOMMENDATIONS:${colors.reset}\n`)

    if (totalCriticalFailures > 0) {
      console.log(`${colors.gray}1. Copy .env.example to .env.local:${colors.reset}`)
      console.log(`   ${colors.cyan}cp .env.example .env.local${colors.reset}\n`)

      console.log(`${colors.gray}2. Fill in the missing required variables in .env.local${colors.reset}`)
      console.log(`   ${colors.gray}See VERCEL_DEPLOYMENT.md for detailed setup instructions${colors.reset}\n`)

      console.log(`${colors.gray}3. Restart your development server after configuring${colors.reset}\n`)
    }

    if (totalWarnings > 0 && strictMode) {
      console.log(`${colors.yellow}Optional variables are missing.${colors.reset}`)
      console.log(
        `${colors.gray}Consider configuring them for full functionality.${colors.reset}\n`
      )
    }
  }

  // Print footer
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`)
}

// Main execution
function main() {
  const args = process.argv.slice(2)
  const strictMode = args.includes('--strict')

  const { results, totalCriticalFailures, totalWarnings } = validateEnvironment(strictMode)

  printResults(results, totalCriticalFailures, totalWarnings, strictMode)

  // Exit with appropriate code
  if (totalCriticalFailures > 0) {
    process.exit(1)
  } else if (strictMode && totalWarnings > 0) {
    process.exit(2)
  } else {
    process.exit(0)
  }
}

main()
