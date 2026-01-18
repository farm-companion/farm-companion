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

// Check if database is available
const DATABASE_URL = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  // Use pooler URL if available (recommended for production)
  datasourceUrl: DATABASE_URL,

  // Logging configuration
  log: (process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']) as Array<'query' | 'error' | 'warn' | 'info'>,
}

// Only create PrismaClient if DATABASE_URL is available
// This prevents build-time errors when no database is configured
function createPrismaClient(): PrismaClient | null {
  if (!DATABASE_URL) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('DATABASE_URL not set - Prisma client not initialized')
    }
    return null
  }
  return new PrismaClient(CONNECTION_POOL_CONFIG)
}

const prismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prismaClient) {
  globalForPrisma.prisma = prismaClient
}

// Export prisma - may be null if DATABASE_URL not set
// Consumers should check for null or use the safe wrapper functions below
export const prisma = prismaClient as PrismaClient

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return prismaClient !== null
}

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
