/**
 * Prisma Client Singleton with Connection Pooling
 *
 * Ensures only one Prisma Client instance exists in development
 * Prevents multiple instances from being created during hot reloads
 *
 * Connection Pooling Configuration:
 * - Uses Supabase Pooler for optimal connection management
 * - connection_limit: Max connections per instance (10 for serverless)
 * - pool_timeout: Time to wait for available connection (20s)
 * - connect_timeout: Time to establish new connection (10s)
 *
 * Environment Variables:
 * - DATABASE_URL: Direct database connection (migrations, admin)
 * - DATABASE_POOLER_URL: Pooled connection (application queries)
 *
 * Supabase Pooler Modes:
 * - Transaction mode: Best for serverless (Vercel, AWS Lambda)
 * - Session mode: Better for long-running processes
 *
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy-initialized Prisma client
// Defers creation until first use, preventing build-time errors when DATABASE_URL unavailable
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL not configured')
  }

  const client = new PrismaClient({
    datasourceUrl: url,
    log: (process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error']) as Array<'query' | 'error' | 'warn' | 'info'>,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

// Getter for lazy initialization
export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  const client = createPrismaClient()
  globalForPrisma.prisma = client
  return client
}

// Backward-compatible export using Proxy for lazy access
// This allows existing code using `prisma.farm.findMany()` to work without changes
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrisma()[prop as keyof PrismaClient]
  }
})

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
    console.error('Database connection failed:', error)
    return false
  }
}
