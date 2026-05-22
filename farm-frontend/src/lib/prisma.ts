/**
 * Prisma Client Singleton with Connection Pooling
 *
 * Ensures only one Prisma Client instance exists in development
 * Prevents multiple instances from being created during hot reloads
 *
 * Connection Pooling Configuration:
 * - Uses managed Postgres connection pooler (PgBouncer) for serverless workloads
 * - connection_limit: Max connections per instance (10 for serverless)
 * - pool_timeout: Time to wait for available connection (20s)
 * - connect_timeout: Time to establish new connection (10s)
 *
 * Environment Variables:
 * - DATABASE_URL: Direct database connection (migrations, admin)
 * - DATABASE_POOLER_URL: Pooled connection (application queries)
 *
 * PgBouncer Pool Modes:
 * - Transaction mode: Best for serverless (Vercel, AWS Lambda)
 * - Session mode: Better for long-running processes
 *
 * Production stack (May 2026): Coolify-managed Postgres on Hetzner, host
 * `farm-companion-db` on `37.27.194.158`. App on Vercel calls into the
 * pooler endpoint via `DATABASE_POOLER_URL` (transaction mode). See the
 * Production Infrastructure block at the top of the execution ledger.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prismaLogger = logger.child({ route: 'lib/prisma' })

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Append connection_limit to the datasource URL to prevent pool exhaustion
// during Next.js static builds where multiple pages prerender concurrently.
function getDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!base) return undefined
  const separator = base.includes('?') ? '&' : '?'
  // Limit each Prisma instance to 2 connections to stay within DB limits
  if (!base.includes('connection_limit')) {
    return `${base}${separator}connection_limit=2`
  }
  return base
}

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  datasourceUrl: getDatasourceUrl(),

  // Logging configuration
  log: (process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']) as Array<'query' | 'error' | 'warn' | 'info'>,
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(CONNECTION_POOL_CONFIG)

// Cache singleton in ALL environments including production builds
globalForPrisma.prisma = prisma

// Graceful shutdown for serverless environments
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

/**
 * Utility function to disconnect Prisma Client
 * Useful in serverless environments
 */
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

/**
 * Health check for database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    prismaLogger.error('Database connection failed', {}, error as Error)
    return false
  }
}
