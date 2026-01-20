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
  const logger = createRouteLogger('api/add/selftest', request)

  logger.info('Processing add form health check')

  const report: HealthReport = { ok: true, checks: [] }

  // KV ping (optional)
  try {
    const { kv } = await import('@vercel/kv')
    await kv.ping?.()
    report.checks.push({ name: 'kv', ok: true })
  } catch (e: unknown) {
    report.ok = false
    const errorMessage = e instanceof Error ? e.message : String(e)
    report.checks.push({ name: 'kv', ok: false, err: errorMessage })
    logger.warn('KV health check failed', { error: errorMessage })
  }

  // Resend env presence (no send)
  const resendKey = !!process.env.RESEND_API_KEY
  report.checks.push({ name: 'resend_env', ok: resendKey })

  // Turnstile/hCaptcha env presence (if you use one)
  report.checks.push({
    name: 'captcha_env',
    ok: !!(process.env.TURNSTILE_SECRET_KEY || process.env.HCAPTCHA_SECRET)
  })

  // Add form enabled flag
  report.checks.push({
    name: 'add_form_enabled',
    ok: process.env.ADD_FORM_ENABLED === 'true'
  })

  logger.info('Add form health check completed', {
    overallStatus: report.ok,
    checksCount: report.checks.length
  })

  return NextResponse.json(report, { status: report.ok ? 200 : 500 })
}
