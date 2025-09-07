import { BskyAgent } from '@atproto/api';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

dotenv.config();

/**
 * Bluesky Client for Farm Companion
 * 
 * Handles posting to Bluesky with proper embeds and formatting
 */
export class BlueskyClient {
  constructor() {
    this.agent = new BskyAgent({
      service: 'https://bsky.social'
    });
    this.initialized = false;
    this.rateLimitInfo = {
      remaining: 0,
      resetTime: null
    };
  }

  /**
   * Initialize the Bluesky client with credentials
   */
  async initialize() {
    try {
      if (this.initialized) {
        return;
      }

      const identifier = process.env.BLUESKY_IDENTIFIER;
      const password = process.env.BLUESKY_PASSWORD;

      if (!identifier || !password) {
        throw new Error('Bluesky credentials not configured. Set BLUESKY_IDENTIFIER and BLUESKY_PASSWORD');
      }

      await this.agent.login({
        identifier,
        password
      });

      this.initialized = true;
      console.log('✅ Bluesky client initialized successfully');
      
      // Get current user info
      const profile = await this.agent.getProfile({ actor: identifier });
      console.log(`✅ Bluesky API verified for user: @${profile.data.handle}`);

    } catch (error) {
      console.error('❌ Failed to initialize Bluesky client:', error.message);
      throw error;
    }
  }

  /**
   * Upload an image blob to Bluesky
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} mimeType - MIME type of the image
   * @param {string} altText - Alt text for accessibility
   * @returns {Promise<Object>} Blob reference
   */
  async uploadImage(imageBuffer, mimeType = 'image/jpeg', altText = '') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Check image size (1MB limit for Bluesky)
      if (imageBuffer.length > 1000000) {
        throw new Error(`Image too large: ${imageBuffer.length} bytes (max 1MB)`);
      }

      const { data } = await this.agent.uploadBlob(imageBuffer, {
        encoding: mimeType
      });

      return {
        success: true,
        blob: data.blob,
        altText: altText
      };

    } catch (error) {
      console.error('❌ Failed to upload image to Bluesky:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a website card embed for a farm URL
   * @param {string} farmUrl - Farm URL to embed
   * @param {string} farmName - Farm name for title
   * @param {string} description - Farm description
   * @returns {Promise<Object>} External embed object
   */
  async createWebsiteCard(farmUrl, farmName, description) {
    try {
      // For now, create a simple external embed without fetching metadata
      // In production, you'd want to fetch og:title, og:description, og:image
      return {
        $type: 'app.bsky.embed.external',
        external: {
          uri: farmUrl,
          title: farmName,
          description: description || 'Visit this farm shop on Farm Companion'
        }
      };
    } catch (error) {
      console.error('❌ Failed to create website card:', error.message);
      return null;
    }
  }

  /**
   * Check if we've already posted today (idempotency)
   */
  async checkIdempotency() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const lockKey = `bluesky:posted:${today}`;
      
      const lockDir = path.join(os.tmpdir(), 'farm-companion-locks');
      await fs.mkdir(lockDir, { recursive: true });
      
      const lockFile = path.join(lockDir, `${lockKey}.lock`);
      
      try {
        await fs.access(lockFile);
        return { alreadyPosted: true, lockKey };
      } catch (error) {
        return { alreadyPosted: false, lockKey, lockFile };
      }
    } catch (error) {
      console.warn('⚠️  Idempotency check failed:', error.message);
      return { alreadyPosted: false, lockKey: null, lockFile: null };
    }
  }

  /**
   * Create idempotency lock
   */
  async createIdempotencyLock(lockFile) {
    try {
      const fd = await fs.open(lockFile, 'wx');
      await fd.write(Date.now().toString());
      await fd.close();
      console.log(`🔒 Created Bluesky idempotency lock`);
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(`⏭️  Bluesky already posted today`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Post to Bluesky with image and/or website card
   * @param {string} text - Post text
   * @param {Buffer} imageBuffer - Optional image buffer
   * @param {Object} farm - Farm data for website card
   * @param {boolean} dryRun - Whether this is a dry run
   * @returns {Promise<Object>} Post result
   */
  async post(text, imageBuffer = null, farm = null, dryRun = false) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Idempotency check (only for live posts)
      if (!dryRun) {
        const idempotency = await this.checkIdempotency();
        if (idempotency.alreadyPosted) {
          console.log('⏭️  Already posted to Bluesky today, skipping');
          return {
            success: true,
            skipped: true,
            reason: 'already_posted_today',
            text,
            hasImage: !!imageBuffer,
            hasWebsiteCard: !!farm
          };
        }
      }

      if (dryRun) {
        console.log('🔍 DRY RUN - Would post to Bluesky:');
        console.log(`📝 Text: "${text}"`);
        if (imageBuffer) console.log('🖼️  Image: Yes');
        if (farm) console.log(`🔗 Website card: ${farm.name}`);
        return {
          success: true,
          dryRun: true,
          text,
          hasImage: !!imageBuffer,
          hasWebsiteCard: !!farm
        };
      }

      // Prepare post data
      const postData = {
        text: text,
        createdAt: new Date().toISOString()
      };

      // Add image embed if provided
      if (imageBuffer) {
        const imageUpload = await this.uploadImage(imageBuffer, 'image/jpeg', `Farm shop image for ${farm?.name || 'farm'}`);
        
        if (imageUpload.success) {
          postData.embed = {
            $type: 'app.bsky.embed.images',
            images: [{
              alt: imageUpload.altText,
              image: imageUpload.blob
            }]
          };
        }
      }

      // Add website card if farm provided
      if (farm) {
        const farmUrl = `https://www.farmcompanion.co.uk/shop/${farm.slug}`;
        const websiteCard = await this.createWebsiteCard(farmUrl, farm.name, farm.description);
        
        if (websiteCard) {
          // If we already have an image embed, we need to combine them
          if (postData.embed) {
            // For now, prioritize image over website card
            // In future, we could implement combined embeds
            console.log('🔄 Image embed takes priority over website card');
          } else {
            postData.embed = websiteCard;
          }
        }
      }

      // Post to Bluesky
      const response = await this.agent.post(postData);
      
      console.log(`✅ Bluesky post successful: ${response.uri}`);
      console.log(`📝 Content: "${text}"`);
      
      // Create idempotency lock after successful post
      const idempotency = await this.checkIdempotency();
      if (idempotency.lockFile) {
        await this.createIdempotencyLock(idempotency.lockFile);
      }
      
      return {
        success: true,
        dryRun: false,
        uri: response.uri,
        cid: response.cid,
        text,
        hasImage: !!imageBuffer,
        hasWebsiteCard: !!farm,
        url: `https://bsky.app/profile/${this.agent.session?.handle}/post/${response.uri.split('/').pop()}`
      };

    } catch (error) {
      console.error('❌ Failed to post to Bluesky:', error.message);
      
      // Handle rate limiting
      if (error.status === 429) {
        this.rateLimitInfo.remaining = 0;
        this.rateLimitInfo.resetTime = new Date(Date.now() + 60000); // 1 minute
        throw new Error(`Bluesky rate limit exceeded. Try again later.`);
      }
      
      throw error;
    }
  }

  /**
   * Test Bluesky connection
   */
  async testConnection() {
    try {
      await this.initialize();
      const profile = await this.agent.getProfile({ actor: this.agent.session.handle });
      return {
        success: true,
        handle: profile.data.handle,
        displayName: profile.data.displayName
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const blueskyClient = new BlueskyClient();
