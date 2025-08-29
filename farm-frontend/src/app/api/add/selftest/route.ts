import { NextResponse } from 'next/server'

export async function GET() {
  const report: Record<string, any> = { ok: true, checks: [] }

  // KV ping (optional)
  try {
    const { kv } = await import('@vercel/kv')
    await kv.ping?.()
    report.checks.push({ name: 'kv', ok: true })
  } catch (e: any) {
    report.ok = false
    report.checks.push({ name: 'kv', ok: false, err: String(e) })
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

  return NextResponse.json(report, { status: report.ok ? 200 : 500 })
}
