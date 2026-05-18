// KV adapter: thin shim over @upstash/redis to replace @vercel/kv.
//
// Vercel KV is built on Upstash Redis, so the method surface (get, set,
// setex, del, incr, expire, keys, hset, lpush, lrange, sadd, smembers)
// maps 1:1. This shim lets callers keep `import { kv } from '@/lib/kv'`
// while we host on Coolify/Hetzner without depending on @vercel/kv.
//
// Resilience: every call is bounded by a configurable per-operation
// timeout (default 200ms via KV_OPERATION_TIMEOUT_MS). When the upstream
// REST endpoint is dead, unreachable, or env vars are stale/empty, the
// @upstash/redis client's fetch() has no default timeout (Node 20+) and
// will hang on TLS/HTTP-keepalive for ~8-9s before the OS gives up. The
// Proxy below intercepts every method call and races it against a
// setTimeout, throwing KvTimeoutError so cache-manager's existing
// try/catch surfaces a fast cache miss instead of blocking the route.

import { Redis } from '@upstash/redis'

const DEFAULT_TIMEOUT_MS = 200

function parseTimeoutMs(): number {
  const raw = process.env.KV_OPERATION_TIMEOUT_MS
  if (!raw) return DEFAULT_TIMEOUT_MS
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

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

export class KvTimeoutError extends Error {
  constructor(public readonly operation: string, public readonly timeoutMs: number) {
    super(`KV operation '${operation}' exceeded ${timeoutMs}ms timeout`)
    this.name = 'KvTimeoutError'
  }
}

export function withKvTimeout<T>(
  promise: Promise<T>,
  operation: string,
  timeoutMs: number = parseTimeoutMs(),
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new KvTimeoutError(operation, timeoutMs))
    }, timeoutMs)
  })
  return Promise.race([
    promise.finally(() => {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
    }),
    timeoutPromise,
  ])
}

const rawKv = new Redis({ url, token })

export const kv = new Proxy(rawKv, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver)
    if (typeof value !== 'function') return value
    return function (this: unknown, ...args: unknown[]) {
      const result = (value as (...a: unknown[]) => unknown).apply(target, args)
      if (result && typeof (result as { then?: unknown }).then === 'function') {
        return withKvTimeout(result as Promise<unknown>, String(prop))
      }
      return result
    }
  },
})

export type KVClient = typeof kv
