// src/lib/redis.ts
import { createClient } from 'redis';

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL,
});

// Connect to Redis
redis.connect().catch(console.error);

// Handle connection events
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Redis Client Connected');
});

export default redis;
