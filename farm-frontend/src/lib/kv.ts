// KV adapter: thin shim over @upstash/redis to replace @vercel/kv.
//
// Vercel KV is built on Upstash Redis, so the method surface (get, set,
// setex, del, incr, expire, keys, hset, lpush, lrange, sadd, smembers)
// maps 1:1. This shim lets callers keep `import { kv } from '@/lib/kv'`
// while we host on Coolify/Hetzner without depending on @vercel/kv.

import { Redis } from '@upstash/redis'

// Accept either the Vercel KV env names (KV_REST_API_*) or the upstream
// Upstash names (UPSTASH_REDIS_REST_*). KV_REST_API_* wins when both are
// set so existing Vercel-style envs keep working during migration.
const url =
  process.env.KV_REST_API_URL ??
  process.env.UPSTASH_REDIS_REST_URL ??
  ''

const token =
  process.env.KV_REST_API_TOKEN ??
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  ''

export const kv = new Redis({ url, token })

export type KVClient = typeof kv
