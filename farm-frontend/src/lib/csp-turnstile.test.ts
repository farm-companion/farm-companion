/**
 * The CSP must permit Cloudflare Turnstile.
 *
 * Written after the contact form was found to be completely unusable in
 * production: `script-src` omitted `https://challenges.cloudflare.com`, so the
 * widget's api.js was blocked by the browser, the CAPTCHA never rendered, and
 * every submission was refused with "Please complete the CAPTCHA verification".
 * Nothing failed server-side, so no log or health check showed it.
 *
 * Required directives, per Cloudflare:
 * https://developers.cloudflare.com/turnstile/reference/content-security-policy/
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cspFor } from '../../middleware'
import type { NextRequest } from 'next/server'

const TURNSTILE = 'https://challenges.cloudflare.com'

/** The middleware only reads cookies off the request. */
function reqWithConsent(consent?: Record<string, boolean>): NextRequest {
  // NextRequest.cookies.get() returns an already-decoded value, so the
  // fixture must hand over raw JSON, not a percent-encoded string.
  const value = consent ? JSON.stringify(consent) : undefined
  return {
    cookies: { get: (n: string) => (n === 'fc_consent' && value ? { value } : undefined) },
  } as unknown as NextRequest
}

function directive(csp: string, name: string): string {
  const found = csp.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${name} `))
  assert.ok(found, `no ${name} directive in policy`)
  return found
}

test('script-src allows Turnstile, with no consent cookie at all', () => {
  assert.ok(directive(cspFor(reqWithConsent()), 'script-src').includes(TURNSTILE))
})

test('frame-src allows Turnstile, so the challenge iframe can render', () => {
  assert.ok(directive(cspFor(reqWithConsent()), 'frame-src').includes(TURNSTILE))
})

test('Turnstile survives every consent combination', () => {
  for (const consent of [
    { analytics: false, ads: false },
    { analytics: true, ads: false },
    { analytics: false, ads: true },
    { analytics: true, ads: true },
  ]) {
    const csp = cspFor(reqWithConsent(consent))
    const label = JSON.stringify(consent)
    assert.ok(directive(csp, 'script-src').includes(TURNSTILE), `script-src lost it for ${label}`)
    assert.ok(directive(csp, 'frame-src').includes(TURNSTILE), `frame-src lost it for ${label}`)
  }
})

test("connect-src keeps 'self', which Turnstile pre-clearance needs", () => {
  assert.ok(directive(cspFor(reqWithConsent()), 'connect-src').includes("'self'"))
})
