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
   * Check if we've already posted today (idempotency)
   */
  async checkIdempotency() {
    try {
      const os = await import('os');
      const fs = await import('fs');
      const path = await import('path');
      
      const today = new Date().toISOString().split('T')[0];
      const lockDir = path.join(os.tmpdir(), 'farm-companion-locks');
      const lockFile = path.join(lockDir, `bluesky:posted:${today}.lock`);
      
      // Ensure lock directory exists
      if (!fs.existsSync(lockDir)) {
        fs.mkdirSync(lockDir, { recursive: true });
      }
      
      if (fs.existsSync(lockFile)) {
        return { alreadyPosted: true, lockFile };
      }
      
      return { alreadyPosted: false, lockFile };
    } catch (error) {
      console.warn('⚠️  Could not check Bluesky idempotency:', error.message);
      return { alreadyPosted: false };
    }
  }

  /**
   * Create idempotency lock file
   */
  async createIdempotencyLock(lockFile) {
    try {
      const fs = await import('fs');
      fs.writeFileSync(lockFile, new Date().toISOString());
      return true;
    } catch (error) {
      console.warn('⚠️  Could not create Bluesky idempotency lock:', error.message);
      return false;
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

      // Check idempotency
      const idempotency = await this.checkIdempotency();
      if (idempotency.alreadyPosted) {
        console.log('⏭️  Already posted to Bluesky today, skipping');
        return { success: true, skipped: true, reason: 'already_posted_today' };
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

      // Create idempotency lock
      if (idempotency.lockFile) {
        await this.createIdempotencyLock(idempotency.lockFile);
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
