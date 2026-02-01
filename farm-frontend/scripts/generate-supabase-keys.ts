#!/usr/bin/env npx tsx
/**
 * Generate correct JWT tokens for self-hosted Supabase
 *
 * Usage: npx tsx scripts/generate-supabase-keys.ts <JWT_SECRET>
 */

import * as crypto from 'crypto'

function base64url(input: Buffer | string): string {
  const str = typeof input === 'string' ? input : input.toString('base64')
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function createJWT(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }

  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)))
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)))

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')

  const encodedSignature = base64url(signature)

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

const jwtSecret = process.argv[2] || 'LVvyVYG4bNFaj9HscIo5P6Kgbop0zuJR'

// Standard Supabase token expiry (100 years from now)
const now = Math.floor(Date.now() / 1000)
const exp = now + (100 * 365 * 24 * 60 * 60) // 100 years

// Generate anon key (public, limited access)
const anonPayload = {
  iss: 'supabase',
  ref: 'local',
  role: 'anon',
  iat: now,
  exp: exp
}

// Generate service_role key (full admin access)
const serviceRolePayload = {
  iss: 'supabase',
  ref: 'local',
  role: 'service_role',
  iat: now,
  exp: exp
}

const anonKey = createJWT(anonPayload, jwtSecret)
const serviceRoleKey = createJWT(serviceRolePayload, jwtSecret)

console.log('\n=== Supabase JWT Keys ===\n')
console.log('JWT Secret used:', jwtSecret)
console.log('\n--- Add these to your .env.local ---\n')
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`)
console.log(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`)
console.log('\n--- Verification ---')
console.log('\nAnon key payload:', JSON.stringify(anonPayload, null, 2))
console.log('\nService role key payload:', JSON.stringify(serviceRolePayload, null, 2))
