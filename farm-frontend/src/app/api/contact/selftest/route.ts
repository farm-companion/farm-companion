import { NextResponse } from 'next/server'

export async function GET() {
  const report: Record<string, any> = { ok: true, checks: [] }

  // Redis/Upstash
  try {
    const { Redis } = await import('@upstash/redis')
    const redis = Redis.fromEnv()
    await redis.ping()
    report.checks.push({ name: 'redis', ok: true })
  } catch (e: any) {
    report.ok = false
    report.checks.push({ name: 'redis', ok: false, err: String(e) })
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

  return NextResponse.json(report, { status: report.ok ? 200 : 500 })
}
