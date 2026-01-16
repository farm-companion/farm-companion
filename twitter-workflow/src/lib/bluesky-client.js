import { BskyAgent } from '@atproto/api';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Bluesky Client for posting to Bluesky
 */
export class BlueskyClient {
  constructor() {
    this.agent = new BskyAgent({ service: 'https://bsky.social' });
    this.isInitialized = false;
    this.identifier = process.env.BLUESKY_IDENTIFIER;
    this.password = process.env.BLUESKY_PASSWORD;
  }

  /**
   * Initialize the Bluesky client
   */
  async initialize() {
    try {
      if (!this.identifier || !this.password) {
        throw new Error('Bluesky credentials not configured (BLUESKY_IDENTIFIER / BLUESKY_PASSWORD)');
      }

      await this.agent.login({
        identifier: this.identifier,
        password: this.password
      });

      this.isInitialized = true;
      console.log('✅ Bluesky client initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Bluesky initialization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if we've already posted the maximum times today (idempotency)
   * Uses Redis for serverless-compatible distributed locking
   */
  async checkIdempotency(maxPosts = 2) {
    try {
      const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
      const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

      // Fallback if Redis not configured
      if (!KV_URL || !KV_TOKEN) {
        console.warn('⚠️  Redis not configured, idempotency check disabled');
        return { alreadyPosted: false, count: 0, maxPosts, redisConfigured: false };
      }

      const today = new Date().toISOString().split('T')[0];
      const redisKey = `fc:bluesky:posted:${today}`;

      // Get current count from Redis
      const countResp = await fetch(`${KV_URL}/get/${encodeURIComponent(redisKey)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const countData = await countResp.json();
      const currentCount = countData.result ? parseInt(countData.result) : 0;

      if (currentCount >= maxPosts) {
        return { alreadyPosted: true, count: currentCount, maxPosts, redisKey };
      }

      return { alreadyPosted: false, count: currentCount, maxPosts, redisKey };
    } catch (error) {
      console.warn('⚠️  Could not check Bluesky idempotency:', error.message);
      return { alreadyPosted: false, count: 0, maxPosts };
    }
  }

  /**
   * Increment idempotency count in Redis
   */
  async incrementIdempotencyCount(redisKey) {
    try {
      const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
      const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!KV_URL || !KV_TOKEN) {
        console.warn('⚠️  Redis not configured, skipping count increment');
        return { success: false, error: 'Redis not configured' };
      }

      // Increment counter in Redis
      const incrResp = await fetch(`${KV_URL}/incr/${encodeURIComponent(redisKey)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const incrData = await incrResp.json();
      const newCount = incrData.result || 1;

      // Set expiration to end of day (24 hours)
      await fetch(`${KV_URL}/expire/${encodeURIComponent(redisKey)}/86400`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });

      console.log(`✅ Incremented Bluesky post count to ${newCount}`);
      return { success: true, count: newCount };
    } catch (error) {
      console.warn('⚠️  Could not increment Bluesky count:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload image to Bluesky
   */
  async uploadImage(imageBuffer) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const response = await this.agent.uploadBlob(imageBuffer, {
        encoding: 'image/jpeg'
      });

      return {
        success: true,
        blob: response.data.blob
      };
    } catch (error) {
      console.error('❌ Bluesky image upload failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post to Bluesky with optional image
   */
  async post(content, imageBuffer = null, farm = null, dryRun = false) {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      // Check idempotency (allow up to 2 posts per day)
      const idempotency = await this.checkIdempotency(2);
      if (idempotency.alreadyPosted) {
        console.log(`⏭️  Already posted ${idempotency.count}/${idempotency.maxPosts} times to Bluesky today, skipping`);
        return { success: true, skipped: true, reason: 'daily_limit_reached', count: idempotency.count, maxPosts: idempotency.maxPosts };
      }

      if (dryRun) {
        console.log('🧪 DRY RUN: Would post to Bluesky:', content);
        return { success: true, dryRun: true };
      }

      let embed = null;
      
      // Add farm URL as website card if available
      if (farm) {
        const farmUrl = `https://www.farmcompanion.co.uk/shop/${farm.slug}`;
        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: farmUrl,
            title: farm.name,
            description: farm.description || 'Visit this farm shop on Farm Companion'
          }
        };
      }

      // Upload image if provided
      if (imageBuffer) {
        const imageUpload = await this.uploadImage(imageBuffer);
        if (imageUpload.success) {
          embed = {
            $type: 'app.bsky.embed.images',
            images: [{
              image: imageUpload.blob,
              alt: `Farm shop: ${farm?.name || 'UK farm shop'}`
            }]
          };
        }
      }

      const postData = {
        text: content,
        createdAt: new Date().toISOString()
      };

      if (embed) {
        postData.embed = embed;
      }

      const response = await this.agent.post(postData);

      // Increment idempotency count
      if (idempotency.redisKey) {
        await this.incrementIdempotencyCount(idempotency.redisKey);
      }

      console.log('✅ Posted to Bluesky successfully');
      return {
        success: true,
        postId: response.uri,
        url: `https://bsky.app/profile/${this.identifier}/post/${response.uri.split('/').pop()}`
      };

    } catch (error) {
      console.error('❌ Bluesky posting failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Bluesky connection
   */
  async testConnection() {
    try {
      const result = await this.initialize();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const blueskyClient = new BlueskyClient();
