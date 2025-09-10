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
   */
  async checkIdempotency(maxPosts = 2) {
    try {
      const os = await import('os');
      const fs = await import('fs');
      const path = await import('path');
      
      const today = new Date().toISOString().split('T')[0];
      const lockDir = path.join(os.tmpdir(), 'farm-companion-locks');
      const countFile = path.join(lockDir, `bluesky:count:${today}.json`);
      
      // Ensure lock directory exists
      if (!fs.existsSync(lockDir)) {
        fs.mkdirSync(lockDir, { recursive: true });
      }
      
      let currentCount = 0;
      if (fs.existsSync(countFile)) {
        try {
          const data = fs.readFileSync(countFile, 'utf8');
          const parsed = JSON.parse(data);
          currentCount = parsed.count || 0;
        } catch (parseError) {
          console.warn('⚠️  Could not parse Bluesky count file, resetting');
          currentCount = 0;
        }
      }
      
      if (currentCount >= maxPosts) {
        return { alreadyPosted: true, count: currentCount, maxPosts, countFile };
      }
      
      return { alreadyPosted: false, count: currentCount, maxPosts, countFile };
    } catch (error) {
      console.warn('⚠️  Could not check Bluesky idempotency:', error.message);
      return { alreadyPosted: false, count: 0, maxPosts };
    }
  }

  /**
   * Increment idempotency count file
   */
  async incrementIdempotencyCount(countFile) {
    try {
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');
      
      const lockDir = path.join(os.tmpdir(), 'farm-companion-locks');
      if (!fs.existsSync(lockDir)) {
        fs.mkdirSync(lockDir, { recursive: true });
      }
      
      let currentCount = 0;
      if (fs.existsSync(countFile)) {
        try {
          const data = fs.readFileSync(countFile, 'utf8');
          const parsed = JSON.parse(data);
          currentCount = parsed.count || 0;
        } catch (parseError) {
          currentCount = 0;
        }
      }
      
      const newCount = currentCount + 1;
      fs.writeFileSync(countFile, JSON.stringify({ 
        count: newCount,
        timestamp: new Date().toISOString(),
        platform: 'bluesky'
      }));
      
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
      if (idempotency.countFile) {
        await this.incrementIdempotencyCount(idempotency.countFile);
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
