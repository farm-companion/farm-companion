import { twitterClient } from './twitter-client.js';
import { blueskyClient } from './bluesky-client.js';
import { telegramClient } from './telegram-client.js';
import { contentGenerator } from './content-generator.js';
import { farmSelector } from './farm-selector.js';
import { monitoringSystem } from './monitoring.js';
import pkg from 'twitter-text';
const { parseTweet } = pkg;
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Upstash Redis configuration for idempotency
const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Set a key with a limit per day (idempotency guard for multiple posts)
 */
async function setWithLimitToday(key, limit = 2) {
  if (!KV_URL || !KV_TOKEN) return { enforced: false }; // soft skip if not configured
  const today = new Date().toISOString().slice(0,10);
  const namespaced = `fc:tweeted:${today}`;
  if (key) namespaced += `:${key}`;

  // Check current count
  const countResp = await fetch(`${KV_URL}/get/${encodeURIComponent(namespaced)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const countData = await countResp.json();
  const currentCount = countData.result ? parseInt(countData.result) : 0;

  if (currentCount >= limit) {
    return { enforced: true, created: false, key: namespaced, count: currentCount, limit };
  }

  // Increment counter
  const incrResp = await fetch(`${KV_URL}/incr/${encodeURIComponent(namespaced)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const incrData = await incrResp.json();
  
  // Set expiration to end of day (24 hours from now)
  const expireResp = await fetch(`${KV_URL}/expire/${encodeURIComponent(namespaced)}/86400`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });

  return { 
    enforced: true, 
    created: true, 
    key: namespaced, 
    count: incrData.result || currentCount + 1,
    limit 
  };
}

/**
 * Compose final tweet with farm URL and proper length trimming
 */
function composeFinalTweet({ baseText, farm }) {
  // Safety check for baseText
  if (!baseText || typeof baseText !== 'string') {
    console.error('❌ Invalid baseText in composeFinalTweet:', baseText);
    baseText = 'Farm shop with local produce. #FarmShop #FarmCompanion';
  }
  
  const url = `https://www.farmcompanion.co.uk/shop/${encodeURIComponent(farm.slug)}?utm_source=twitter&utm_medium=organic&utm_campaign=daily_farm`;
  
  // Twitter counts URLs as 23 characters (t.co shortening), but be very conservative
  // Some URLs might not be shortened, so use actual URL length for safety
  const urlLength = url.length; // Use actual URL length to be safe
  const maxContentLength = 280 - urlLength - 1; // Leave 1 space for separator
  
  // Trim content to fit with URL
  let trimmedContent = baseText.replace(/\s+$/, '').trim();
  if (trimmedContent.length > maxContentLength) {
    trimmedContent = trimmedContent.substring(0, maxContentLength - 3) + '...';
  }
  
  const finalText = trimmedContent + ' ' + url;
  
  // Final validation with twitter-text library
  const parsed = parseTweet(finalText);
  if (!parsed.valid) {
    console.warn(`⚠️  Tweet still invalid after trimming: ${finalText.length} chars`);
    console.warn(`⚠️  Validation errors:`, parsed.errors);
    
    // More aggressive trimming
    const emergencyMaxLength = Math.max(50, 280 - urlLength - 1 - 10); // Leave extra buffer
    let emergencyContent = baseText.replace(/\s+$/, '').trim();
    if (emergencyContent.length > emergencyMaxLength) {
      emergencyContent = emergencyContent.substring(0, emergencyMaxLength - 3) + '...';
    }
    
    const emergencyFinal = emergencyContent + ' ' + url;
    const emergencyParsed = parseTweet(emergencyFinal);
    
    if (!emergencyParsed.valid) {
      // Last resort - use minimal content
      const minimalContent = 'Fresh local produce from UK farm shops. #FarmShop #FarmCompanion';
      return minimalContent + ' ' + url;
    }
    
    return emergencyFinal;
  }
  
  return finalText;
}

/**
 * Twitter Workflow Orchestrator
 * 
 * Coordinates the entire daily farm spotlight workflow:
 * 1. Select farm for today
 * 2. Generate engaging content
 * 3. Post to Twitter
 * 4. Handle errors and monitoring
 */
export class WorkflowOrchestrator {
  constructor() {
    this.dryRunMode = process.env.DRY_RUN_MODE === 'true';
    this.postingEnabled = process.env.POSTING_ENABLED === 'true';
    this.contentGenerationEnabled = process.env.CONTENT_GENERATION_ENABLED === 'true';
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  /**
   * Execute dual daily farm spotlight workflow (2 posts per day)
   * @param {Object} options - Workflow options
   */
  async executeDualDailySpotlight(options = {}) {
    const startTime = new Date();
    const workflowId = `dual-spotlight-${startTime.toISOString().split('T')[0]}`;
    
    // Override dry run mode if specified in options
    const isDryRun = options.dryRun !== undefined ? options.dryRun : this.dryRunMode;
    
    console.log(`🚀 Starting dual daily farm spotlight workflow: ${workflowId}`);
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`📝 Content Generation: ${this.contentGenerationEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🐦 Posting: ${this.postingEnabled ? 'ENABLED' : 'DISABLED'}`);

    const results = {
      workflowId,
      startTime: startTime.toISOString(),
      dryRun: this.dryRunMode,
      posts: [],
      success: false,
      error: null
    };

    try {
      // Step 1: Select 2 farms for today
      console.log('\n🏡 Step 1: Selecting farms for dual spotlight...');
      const farmSelection = await this.selectFarms();
      if (!farmSelection.success) {
        throw new Error(`Farm selection failed: ${farmSelection.error}`);
      }
      
      console.log(`✅ Selected ${farmSelection.farms.length} farms for dual spotlight`);

      // Step 2: Generate content and post for each farm
      for (let i = 0; i < farmSelection.farms.length; i++) {
        const farm = farmSelection.farms[i];
        const postNumber = i + 1;
        
        console.log(`\n🎯 Post ${postNumber}/${farmSelection.farms.length}: ${farm.name}`);
        
        // Check idempotency for this specific post
        if (!isDryRun) {
          const lock = await setWithLimitToday(`post-${postNumber}`, 1);
          if (lock.enforced && !lock.created) {
            console.log(`⏭️  Post ${postNumber} already completed today, skipping`);
            results.posts.push({
              postNumber,
              farm: farm.name,
              success: true,
              skipped: true,
              reason: 'already_posted_today'
            });
            continue;
          }
        }

        // Generate content for this farm
        console.log(`\n📝 Step 2.${postNumber}: Generating content...`);
        const contentGeneration = await this.generateContent(farm, { ...options, dryRun: isDryRun });
        if (!contentGeneration.success) {
          console.error(`❌ Content generation failed for ${farm.name}: ${contentGeneration.error}`);
          results.posts.push({
            postNumber,
            farm: farm.name,
            success: false,
            error: contentGeneration.error
          });
          continue;
        }

        // Compose final tweet
        const finalTweet = composeFinalTweet({ 
          baseText: contentGeneration.content, 
          farm: farm 
        });
        console.log(`📝 Final tweet (${finalTweet.length} chars): "${finalTweet.substring(0, 80)}..."`);

        // Post to all platforms
        console.log(`\n🌐 Step 3.${postNumber}: Posting to all platforms...`);
        
        const postResults = {
          postNumber,
          farm: farm.name,
          platforms: {}
        };

        // Post to X/Twitter
        console.log(`🐦 Posting to X/Twitter...`);
        const twitterPost = await this.postToTwitter(finalTweet, contentGeneration, { ...options, dryRun: isDryRun });
        postResults.platforms.twitter = twitterPost;

        // Post to Bluesky
        console.log(`🦋 Posting to Bluesky...`);
        const blueskyPost = await this.postToBluesky(contentGeneration.content, contentGeneration.image, farm, { ...options, dryRun: isDryRun });
        postResults.platforms.bluesky = blueskyPost;

        // Post to Telegram
        console.log(`📱 Posting to Telegram...`);
        const telegramPost = await this.postToTelegram(contentGeneration.content, contentGeneration.image, farm, { ...options, dryRun: isDryRun });
        postResults.platforms.telegram = telegramPost;

        // Check if at least one platform succeeded
        const platforms = [twitterPost, blueskyPost, telegramPost];
        const successfulPosts = platforms.filter(post => post.success && !post.skipped);
        
        if (successfulPosts.length === 0) {
          postResults.success = false;
          postResults.error = 'All social media posting failed';
        } else {
          postResults.success = true;
          console.log(`✅ Post ${postNumber} successfully posted to ${successfulPosts.length}/3 platforms`);
        }

        results.posts.push(postResults);
      }

      // Check overall success
      const successfulPosts = results.posts.filter(post => post.success && !post.skipped);
      if (successfulPosts.length === 0) {
        throw new Error('All posts failed');
      }

      results.success = true;
      results.endTime = new Date().toISOString();
      results.duration = new Date() - startTime;
      
      console.log(`\n🎉 Dual spotlight workflow completed successfully!`);
      console.log(`📊 Successfully posted ${successfulPosts.length}/${results.posts.length} posts`);
      console.log(`⏱️  Total duration: ${Math.round(results.duration / 1000)}s`);

      return results;
    } catch (error) {
      console.error('❌ Dual spotlight workflow failed:', error.message);
      results.error = error.message;
      results.endTime = new Date().toISOString();
      results.duration = new Date() - startTime;
      return results;
    }
  }

  /**
   * Execute the complete daily farm spotlight workflow
   * @param {Object} options - Workflow options
   */
  async executeDailySpotlight(options = {}) {
    const startTime = new Date();
    const workflowId = `spotlight-${startTime.toISOString().split('T')[0]}`;
    
    // Override dry run mode if specified in options
    const isDryRun = options.dryRun !== undefined ? options.dryRun : this.dryRunMode;
    
    // Idempotency check - allow up to 2 posts per day (only for live runs)
    if (!isDryRun) {
      const lock = await setWithLimitToday('daily', 2);
      if (lock.enforced && !lock.created) {
        console.log(`⏭️  Already posted ${lock.count}/${lock.limit} times today, skipping workflow`);
        return { 
          success: true, 
          skipped: true, 
          reason: 'daily_limit_reached',
          workflowId,
          count: lock.count,
          limit: lock.limit
        };
      }
      console.log(`📊 Post ${lock.count}/${lock.limit} for today`);
    }
    
    console.log(`🚀 Starting daily farm spotlight workflow: ${workflowId}`);
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`📝 Content Generation: ${this.contentGenerationEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🐦 Posting: ${this.postingEnabled ? 'ENABLED' : 'DISABLED'}`);

    const results = {
      workflowId,
      startTime: startTime.toISOString(),
      dryRun: this.dryRunMode,
      steps: {},
      success: false,
      error: null
    };

    try {
      // Step 1: Select farm for today
      console.log('\n📍 Step 1: Selecting farm for today...');
      const farmSelection = await this.selectFarm(options.date);
      results.steps.farmSelection = farmSelection;
      
      if (!farmSelection.success) {
        throw new Error(`Farm selection failed: ${farmSelection.error}`);
      }

      // Step 2: Generate content
      console.log('\n✍️  Step 2: Generating engaging content...');
      const contentGeneration = await this.generateContent(farmSelection.farm, options);
      results.steps.contentGeneration = contentGeneration;
      
      if (!contentGeneration.success) {
        throw new Error(`Content generation failed: ${contentGeneration.error}`);
      }

      // Step 3: Post to all social media platforms
      console.log('\n📱 Step 3: Posting to social media platforms...');
      
      // Compose final tweet with farm URL
      const finalTweet = composeFinalTweet({ 
        baseText: contentGeneration.content, 
        farm: farmSelection.farm 
      });
      console.log(`📝 Final tweet (${finalTweet.length} chars): "${finalTweet.substring(0, 80)}..."`);
      
      // Post to X/Twitter
      console.log('\n🐦 Posting to X/Twitter...');
      const twitterPost = await this.postToTwitter(finalTweet, contentGeneration, { ...options, dryRun: isDryRun });
      results.steps.twitterPost = twitterPost;
      
      // Post to Bluesky
      console.log('\n🦋 Posting to Bluesky...');
      const blueskyPost = await this.postToBluesky(contentGeneration.content, contentGeneration.image, farmSelection.farm, { ...options, dryRun: isDryRun });
      results.steps.blueskyPost = blueskyPost;
      
      // Post to Telegram
      console.log('\n📱 Posting to Telegram...');
      const telegramPost = await this.postToTelegram(contentGeneration.content, contentGeneration.image, farmSelection.farm, { ...options, dryRun: isDryRun });
      results.steps.telegramPost = telegramPost;
      
      // Check if at least one platform succeeded
      const platforms = [twitterPost, blueskyPost, telegramPost];
      const successfulPosts = platforms.filter(post => post.success && !post.skipped);
      
      if (successfulPosts.length === 0) {
        throw new Error('All social media posting failed');
      }
      
      console.log(`✅ Successfully posted to ${successfulPosts.length}/3 platforms`);

      // Step 4: Send success notification
      console.log('\n📢 Step 4: Sending notifications...');
      const notification = await monitoringSystem.sendSuccessNotification({
        workflowId,
        farm: farmSelection.farm,
        content: contentGeneration.content,
        tweetId: twitterPost.tweetId,
        metrics: {
          duration: results.duration,
          farmIndex: farmSelection.farmIndex,
          totalFarms: farmSelection.totalFarms,
          contentLength: contentGeneration.content.length,
          executionTime: Math.round(results.duration / 1000)
        }
      });
      results.steps.notification = notification;

      results.success = true;
      results.endTime = new Date().toISOString();
      results.duration = new Date().getTime() - startTime.getTime();

      // Log performance metrics
      monitoringSystem.logPerformanceMetrics({
        workflowId,
        duration: results.duration,
        farmIndex: farmSelection.farmIndex,
        totalFarms: farmSelection.totalFarms,
        contentLength: contentGeneration.content.length,
        executionTime: Math.round(results.duration / 1000)
      });

      console.log(`\n✅ Daily farm spotlight workflow completed successfully!`);
      console.log(`⏱️  Duration: ${Math.round(results.duration / 1000)}s`);
      console.log(`🏪 Farm: ${farmSelection.farm.name}`);
      const content = contentGeneration.content;
      console.log(`📝 Content: "${content?.substring(0, 100)}..."`);

      return results;

    } catch (error) {
      results.success = false;
      results.error = error.message;
      results.endTime = new Date().toISOString();
      results.duration = new Date().getTime() - startTime.getTime();

      console.error(`\n❌ Daily farm spotlight workflow failed: ${error.message}`);
      
      // Send error notification
      await monitoringSystem.sendErrorNotification({
        workflowId,
        error: error.message,
        steps: results.steps,
        duration: results.duration
      });

      return results;
    }
  }

  /**
   * Select farm for today's spotlight
   */
  async selectFarm(date) {
    try {
      const result = await farmSelector.getTodaysFarm(date);
      
      if (result.success) {
        console.log(`✅ Selected farm: ${result.farm.name} (${result.farm.location?.county})`);
        console.log(`📊 Farm index: ${result.farmIndex + 1}/${result.totalFarms}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Farm selection error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Select 2 farms for today's dual spotlight
   */
  async selectFarms(date) {
    try {
      const result = await farmSelector.getTodaysFarms(date);
      
      if (result.success) {
        console.log(`✅ Selected farms: ${result.farms.map(f => f.name).join(' & ')}`);
        console.log(`📊 Farm indices: ${result.farmIndices.map(i => i + 1).join(', ')}/${result.totalFarms}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Farm selection error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate engaging content for the farm
   */
  async generateContent(farm, options) {
    try {
      if (!this.contentGenerationEnabled) {
        console.log('⚠️  Content generation disabled, using fallback');
        return {
          success: true,
          content: contentGenerator.generateFallbackContent(farm),
          method: 'fallback'
        };
      }

      // Generate both content and image
      const result = await contentGenerator.generateFarmSpotlightWithImage(farm, {
        style: options.style || 'apple-ogilvy',
        tone: options.tone || 'inspiring',
        maxLength: 280,
        includeHashtags: true,
        includeEmojis: false // default off
      });

      if (result.success) {
        console.log(`✅ Generated content (${result.length} chars): "${result.content.substring(0, 80)}..."`);
      } else {
        console.log('⚠️  AI generation failed, using fallback content');
        return {
          success: true,
          content: result.fallbackContent,
          method: 'fallback',
          originalError: result.error
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Content generation error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post content to Twitter with optional image
   */
  async postToTwitter(content, contentGeneration, options) {
    try {
      if (!this.postingEnabled) {
        console.log('⚠️  Posting disabled, skipping Twitter post');
        return {
          success: true,
          skipped: true,
          reason: 'posting_disabled'
        };
      }

      // Initialize Twitter client if not already done
      if (!twitterClient.isInitialized) {
        await twitterClient.initialize();
      }

      let mediaIds = [];
      
      // Upload image if available
      if (contentGeneration && contentGeneration.image) {
        try {
          console.log('🖼️  Uploading image to Twitter...');
          const mediaId = await twitterClient.uploadMedia(contentGeneration.image, 'image/jpeg');
          mediaIds.push(mediaId);
          console.log(`✅ Image uploaded successfully: ${mediaId}`);
        } catch (error) {
          console.warn(`⚠️  Image upload failed: ${error.message}`);
          console.log('📝 Continuing with text-only tweet...');
        }
      }

      // Post the tweet with or without media
      const dryRun = options.dryRun !== undefined ? options.dryRun : this.dryRunMode;
      const result = await twitterClient.postTweet(content, mediaIds, dryRun);
      
      if (result.success) {
        if (result.url) {
          console.log(`🔗 Tweet URL: ${result.url}`);
        }
        if (mediaIds.length > 0) {
          console.log(`🖼️  Tweet includes image`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Twitter posting error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post content to Bluesky with optional image
   */
  async postToBluesky(content, imageBuffer, farm, options) {
    try {
      if (!this.postingEnabled) {
        console.log('⚠️  Posting disabled, skipping Bluesky post');
        return {
          success: true,
          skipped: true,
          reason: 'posting_disabled'
        };
      }

      const dryRun = options.dryRun !== undefined ? options.dryRun : this.dryRunMode;
      const result = await blueskyClient.post(content, imageBuffer, farm, dryRun);
      
      if (result.success && !result.skipped) {
        console.log(`✅ Bluesky post successful`);
        if (result.url) {
          console.log(`🔗 Bluesky URL: ${result.url}`);
        }
        if (imageBuffer) {
          console.log(`🖼️  Bluesky post includes image`);
        }
      } else if (result.skipped) {
        console.log(`⏭️  Bluesky post skipped: ${result.reason}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Bluesky posting error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Post content to Telegram with optional image
   */
  async postToTelegram(content, imageBuffer, farm, options) {
    try {
      if (!this.postingEnabled) {
        console.log('⚠️  Posting disabled, skipping Telegram post');
        return {
          success: true,
          skipped: true,
          reason: 'posting_disabled'
        };
      }

      const dryRun = options.dryRun !== undefined ? options.dryRun : this.dryRunMode;
      const result = await telegramClient.post(content, imageBuffer, farm, dryRun);
      
      if (result.success && !result.skipped) {
        console.log(`✅ Telegram post successful`);
        if (result.messageId) {
          console.log(`📱 Telegram message ID: ${result.messageId}`);
        }
        if (imageBuffer) {
          console.log(`🖼️  Telegram post includes image`);
        }
      } else if (result.skipped) {
        console.log(`⏭️  Telegram post skipped: ${result.reason}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Telegram posting error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }


  /**
   * Test the complete workflow
   */
  async testWorkflow() {
    console.log('🧪 Testing multi-platform workflow components...');
    
    const tests = {
      farmSelection: await farmSelector.testSelection(),
      contentGeneration: await contentGenerator.testGeneration(),
      twitterConnection: await twitterClient.testConnection(),
      blueskyConnection: await blueskyClient.testConnection(),
      telegramConnection: await telegramClient.testConnection()
    };

    const allPassed = Object.values(tests).every(test => test.success);
    
    console.log('\n📊 Test Results:');
    Object.entries(tests).forEach(([testName, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result.success ? 'PASS' : result.error}`);
    });

    return {
      success: allPassed,
      tests,
      summary: allPassed ? 'All tests passed!' : 'Some tests failed'
    };
  }

  /**
   * Get workflow status and statistics
   */
  async getStatus() {
    try {
      const farmStats = await farmSelector.getSelectionStats();
      const twitterStatus = twitterClient.getRateLimitStatus();
      
      return {
        success: true,
        status: {
          dryRunMode: this.dryRunMode,
          postingEnabled: this.postingEnabled,
          contentGenerationEnabled: this.contentGenerationEnabled,
          farmStats: farmStats.success ? farmStats.stats : null,
          twitterStatus,
          notificationsConfigured: !!this.slackWebhookUrl
        }
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
export const workflowOrchestrator = new WorkflowOrchestrator();
