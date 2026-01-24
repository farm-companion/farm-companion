// src/lib/redis.ts
import { createClient } from 'redis';
import { logger } from '@/lib/logger'

const redisLogger = logger.child({ route: 'lib/redis' })

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL,
});

// Initialize connection state
let isConnected = false;
let connectionPromise: Promise<any> | null = null;

async function ensureConnection() {
  // If already connected, return the client
  if (isConnected && redis.isOpen) {
    return redis;
  }

  // If there's already a connection attempt in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start a new connection attempt
  connectionPromise = (async () => {
    try {
      // Check if already connected
      if (redis.isOpen) {
        isConnected = true;
        return redis;
      }

      // Connect if not already connected
      await redis.connect();
      isConnected = true;
      redisLogger.info('Redis Client Connected');
      return redis;
    } catch (error) {
      redisLogger.error('Redis connection error', {}, error as Error);
      
      // If already connected, don't throw
      if (error instanceof Error && 
          (error.message.includes('already connected') || 
           error.message.includes('Socket already opened'))) {
        isConnected = true;
        return redis;
      }
      
      // Reset connection promise on error
      connectionPromise = null;
      throw error;
    } finally {
      // Reset connection promise when done
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

// Handle connection events
redis.on('error', (err) => {
  redisLogger.error('Redis Client Error', {}, err as Error);
  isConnected = false;
  connectionPromise = null;
});

redis.on('connect', () => {
  redisLogger.info('Redis Client Connected');
  isConnected = true;
});

redis.on('disconnect', () => {
  redisLogger.info('Redis Client Disconnected');
  isConnected = false;
  connectionPromise = null;
});

// Export both the client and the connection function
export { ensureConnection };
export default redis;
