import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Twitter API Client for Farm Companion Daily Spotlights
 * 
 * Handles authentication, posting, and rate limiting for Twitter/X API v2
 * Uses app-only authentication for posting tweets
 */
export class TwitterClient {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.rateLimitInfo = {
      remaining: 300,
      resetTime: null,
      limit: 300
    };
  }

  /**
   * Initialize Twitter API client with authentication
   */
  async initialize() {
    try {
      // Check for OAuth 2.0 credentials first
      if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
        console.log('🔐 Using OAuth 2.0 authentication');
        
        // Initialize Twitter API v2 client with OAuth 2.0
        this.client = new TwitterApi({
          clientId: process.env.TWITTER_CLIENT_ID,
          clientSecret: process.env.TWITTER_CLIENT_SECRET,
        });

        // For OAuth 2.0, we need to get a bearer token
        const bearerToken = await this.getBearerToken();
        this.client = new TwitterApi(bearerToken);
        
      } else {
        // Fallback to OAuth 1.0a
        console.log('🔐 Using OAuth 1.0a authentication');
        
        // Validate required environment variables
        const requiredVars = [
          'TWITTER_API_KEY',
          'TWITTER_API_SECRET',
          'TWITTER_ACCESS_TOKEN',
          'TWITTER_ACCESS_TOKEN_SECRET'
        ];

        for (const varName of requiredVars) {
          if (!process.env[varName]) {
            throw new Error(`Missing required environment variable: ${varName}`);
          }
        }

        // Initialize Twitter API v2 client with OAuth 1.0a
        this.client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });
      }

      // Test the connection
      await this.verifyCredentials();
      
      this.isInitialized = true;
      console.log('✅ Twitter API client initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Twitter API client:', error.message);
      throw error;
    }
  }

  /**
   * Get bearer token for OAuth 2.0
   */
  async getBearerToken() {
    try {
      const response = await fetch('https://api.twitter.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Failed to get bearer token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('❌ Failed to get bearer token:', error.message);
      throw error;
    }
  }

  /**
   * Verify Twitter API credentials
   */
  async verifyCredentials() {
    try {
      const user = await this.client.v2.me();
      console.log(`✅ Twitter API verified for user: @${user.data.username}`);
      return user.data;
    } catch (error) {
      console.error('❌ Twitter API credential verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Post a tweet with optional media
   * @param {string} text - Tweet content
   * @param {Array} mediaIds - Optional array of media IDs to attach
   * @param {boolean} dryRun - If true, don't actually post
   */
  async postTweet(text, mediaIds = [], dryRun = false) {
    if (!this.isInitialized) {
      throw new Error('Twitter client not initialized. Call initialize() first.');
    }

    // Validate tweet content
    if (!text || text.length === 0) {
      throw new Error('Tweet text cannot be empty');
    }

    if (text.length > 280) {
      throw new Error(`Tweet too long: ${text.length} characters (max 280)`);
    }

    // Check rate limits
    await this.checkRateLimit();

    if (dryRun) {
      console.log('🧪 DRY RUN - Would post tweet:');
      console.log(`📝 Content: "${text}"`);
      if (mediaIds.length > 0) {
        console.log(`🖼️  Media IDs: ${mediaIds.join(', ')}`);
      }
      return {
        success: true,
        dryRun: true,
        tweetId: 'dry-run-' + Date.now(),
        text,
        mediaIds
      };
    }

    try {
      const tweetData = {
        text: text
      };

      // Add media if provided
      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds
        };
      }

      const tweet = await this.client.v2.tweet(tweetData);
      
      console.log(`✅ Tweet posted successfully: ${tweet.data.id}`);
      console.log(`📝 Content: "${text}"`);
      
      // Update rate limit info
      this.rateLimitInfo.remaining -= 1;
      
      return {
        success: true,
        dryRun: false,
        tweetId: tweet.data.id,
        text,
        mediaIds,
        url: `https://twitter.com/user/status/${tweet.data.id}`
      };
    } catch (error) {
      console.error('❌ Failed to post tweet:', error.message);
      
      // Handle rate limiting
      if (error.code === 429) {
        const resetTime = error.rateLimit?.reset;
        if (resetTime) {
          this.rateLimitInfo.resetTime = new Date(resetTime * 1000);
          this.rateLimitInfo.remaining = 0;
        }
        throw new Error(`Rate limit exceeded. Reset at: ${this.rateLimitInfo.resetTime}`);
      }
      
      throw error;
    }
  }

  /**
   * Upload media to Twitter
   * @param {Buffer} mediaBuffer - Media file buffer
   * @param {string} mediaType - MIME type of the media
   */
  async uploadMedia(mediaBuffer, mediaType) {
    if (!this.isInitialized) {
      throw new Error('Twitter client not initialized. Call initialize() first.');
    }

    try {
      const mediaId = await this.client.v1.uploadMedia(mediaBuffer, {
        mimeType: mediaType
      });
      
      console.log(`✅ Media uploaded successfully: ${mediaId}`);
      return mediaId;
    } catch (error) {
      console.error('❌ Failed to upload media:', error.message);
      throw error;
    }
  }

  /**
   * Check rate limits and wait if necessary
   */
  async checkRateLimit() {
    if (this.rateLimitInfo.remaining <= 0) {
      if (this.rateLimitInfo.resetTime) {
        const now = new Date();
        const resetTime = new Date(this.rateLimitInfo.resetTime);
        
        if (now < resetTime) {
          const waitTime = resetTime.getTime() - now.getTime();
          console.log(`⏳ Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Reset rate limit info
      this.rateLimitInfo.remaining = this.rateLimitInfo.limit;
      this.rateLimitInfo.resetTime = null;
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    return {
      ...this.rateLimitInfo,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Test the Twitter API connection
   */
  async testConnection() {
    try {
      await this.initialize();
      const user = await this.verifyCredentials();
      return {
        success: true,
        user: user.username,
        rateLimit: this.getRateLimitStatus()
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
export const twitterClient = new TwitterClient();
