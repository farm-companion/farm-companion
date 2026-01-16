import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Telegram Client for posting to Telegram
 */
export class TelegramClient {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.isInitialized = false;
  }

  /**
   * Initialize the Telegram client
   */
  async initialize() {
    try {
      if (!this.botToken || !this.channelId) {
        throw new Error('Telegram credentials not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID)');
      }

      // Test the bot token by getting bot info
      const response = await axios.get(`${this.baseUrl}/getMe`);
      
      if (response.data.ok) {
        this.isInitialized = true;
        console.log(`✅ Telegram client initialized successfully for @${response.data.result.username}`);
        return { success: true, botInfo: response.data.result };
      } else {
        throw new Error('Invalid bot token or channel ID');
      }
    } catch (error) {
      console.error('❌ Telegram initialization failed:', error.message);
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
      const redisKey = `fc:telegram:posted:${today}`;

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
      console.warn('⚠️  Could not check Telegram idempotency:', error.message);
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

      console.log(`✅ Incremented Telegram post count to ${newCount}`);
      return { success: true, count: newCount };
    } catch (error) {
      console.warn('⚠️  Could not increment Telegram count:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format message for Telegram with farm details
   */
  formatMessage(text, farm) {
    const farmUrl = `https://www.farmcompanion.co.uk/shop/${farm.slug}`;
    
    // Escape Markdown special characters
    const escapeMarkdown = (str) => {
      return str.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    };
    
    const farmName = escapeMarkdown(farm.name);
    const county = farm.location?.county ? escapeMarkdown(farm.location.county) : '';
    const description = farm.description ? escapeMarkdown(farm.description) : '';
    
    const message = `${text}\n\n📍 *${farmName}*\n${county ? `🏘️ ${county}` : ''}\n${description ? `\n${description}` : ''}\n\n🔗 [Visit Farm Shop](${farmUrl})\n\n#FarmShop #FarmCompanion #LocalFood`;
    
    return this.truncateMessage(message);
  }

  /**
   * Truncate message to fit Telegram limits
   */
  truncateMessage(message) {
    const maxLength = 1000; // Telegram caption limit
    if (message.length <= maxLength) {
      return message;
    }
    
    // Truncate and add ellipsis
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Send photo with caption to Telegram
   */
  async sendPhoto(caption, imageBuffer, dryRun = false) {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (dryRun) {
        console.log('🧪 DRY RUN: Would send photo to Telegram:', caption);
        return { success: true, dryRun: true };
      }

      const formData = new FormData();
      formData.append('chat_id', this.channelId);
      formData.append('photo', imageBuffer, {
        filename: 'farm-shop.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');

      const response = await axios.post(`${this.baseUrl}/sendPhoto`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data.ok) {
        console.log('✅ Photo sent to Telegram successfully');
        return {
          success: true,
          messageId: response.data.result.message_id,
          chatId: response.data.result.chat.id
        };
      } else {
        throw new Error(response.data.description || 'Unknown Telegram API error');
      }

    } catch (error) {
      console.error('❌ Telegram photo send failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send text message to Telegram
   */
  async sendMessage(text, dryRun = false) {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      if (dryRun) {
        console.log('🧪 DRY RUN: Would send message to Telegram:', text);
        return { success: true, dryRun: true };
      }

      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.channelId,
        text: this.truncateMessage(text),
        parse_mode: 'Markdown'
      });

      if (response.data.ok) {
        console.log('✅ Message sent to Telegram successfully');
        return {
          success: true,
          messageId: response.data.result.message_id,
          chatId: response.data.result.chat.id
        };
      } else {
        throw new Error(response.data.description || 'Unknown Telegram API error');
      }

    } catch (error) {
      console.error('❌ Telegram message send failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post to Telegram with optional image
   */
  async post(content, imageBuffer = null, farm = null, dryRun = false) {
    try {
      // Check idempotency (allow up to 2 posts per day)
      const idempotency = await this.checkIdempotency(2);
      if (idempotency.alreadyPosted) {
        console.log(`⏭️  Already posted ${idempotency.count}/${idempotency.maxPosts} times to Telegram today, skipping`);
        return { success: true, skipped: true, reason: 'daily_limit_reached', count: idempotency.count, maxPosts: idempotency.maxPosts };
      }

      let message = content;
      
      // Format message with farm details if available
      if (farm) {
        message = this.formatMessage(content, farm);
      }

      let result;
      
      if (imageBuffer) {
        // Send photo with caption
        result = await this.sendPhoto(message, imageBuffer, dryRun);
      } else {
        // Send text message
        result = await this.sendMessage(message, dryRun);
      }

      // Increment idempotency count if successful
      if (result.success && !dryRun && idempotency.redisKey) {
        await this.incrementIdempotencyCount(idempotency.redisKey);
      }

      return result;

    } catch (error) {
      console.error('❌ Telegram posting failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Telegram connection
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
export const telegramClient = new TelegramClient();
