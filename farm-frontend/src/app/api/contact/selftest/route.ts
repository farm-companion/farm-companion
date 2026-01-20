import { NextRequest, NextResponse } from 'next/server'
import { createRouteLogger } from '@/lib/logger'

interface HealthCheck {
  name: string
  ok: boolean
  err?: string
}

interface HealthReport {
  ok: boolean
  checks: HealthCheck[]
}

export async function GET(request: NextRequest) {
  const logger = createRouteLogger('api/contact/selftest', request)

  logger.info('Processing contact form health check')

  const report: HealthReport = { ok: true, checks: [] }

  // Redis/Upstash
  try {
    const { Redis } = await import('@upstash/redis')
    const redis = Redis.fromEnv()
    await redis.ping()
    report.checks.push({ name: 'redis', ok: true })
  } catch (e: unknown) {
    report.ok = false
    const errorMessage = e instanceof Error ? e.message : String(e)
    report.checks.push({ name: 'redis', ok: false, err: errorMessage })
    logger.warn('Redis health check failed', { error: errorMessage })
  }

  // Resend env presence only (no send)
  report.checks.push({ name: 'resend_env', ok: !!process.env.RESEND_API_KEY })
  report.checks.push({ name: 'to_email', ok: !!process.env.CONTACT_TO_EMAIL })
  report.checks.push({ name: 'from_email', ok: !!process.env.CONTACT_FROM_EMAIL })

  // Optional CAPTCHA presence
  report.checks.push({ name: 'captcha_env', ok: !!(process.env.TURNSTILE_SECRET_KEY) })

  // Contact form enabled flag
  report.checks.push({
    name: 'contact_form_enabled',
    ok: process.env.CONTACT_FORM_ENABLED === 'true'
  })

  logger.info('Contact form health check completed', {
    overallStatus: report.ok,
    checksCount: report.checks.length
  })

  return NextResponse.json(report, { status: report.ok ? 200 : 500 })
}
