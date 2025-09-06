import { twitterClient } from './twitter-client.js';
import { contentGenerator } from './content-generator.js';
import { farmSelector } from './farm-selector.js';
import { monitoringSystem } from './monitoring.js';
import pkg from 'twitter-text';
const { parseTweet } = pkg;
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Upstash Redis configuration for idempotency
const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Set a key once per day (idempotency guard)
 */
async function setOnceToday(key) {
  if (!KV_URL || !KV_TOKEN) return { enforced: false }; // soft skip if not configured
  const today = new Date().toISOString().slice(0,10);
  const namespaced = `fc:tweeted:${today}`;
  if (key) namespaced += `:${key}`;

  // SETNX
  const resp = await fetch(`${KV_URL}/set/${encodeURIComponent(namespaced)}/${Date.now()}?nx=true`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  const data = await resp.json();
  return { enforced: true, created: data.result === 'OK', key: namespaced };
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
  
  // Twitter counts URLs as 23 characters (t.co shortening), but be conservative
  const urlLength = 25; // Conservative estimate
  const maxContentLength = 250; // Conservative limit to ensure we stay under 280
  
  // Trim content to fit with URL
  let trimmedContent = baseText.replace(/\s+$/, '').trim();
  if (trimmedContent.length > maxContentLength) {
    trimmedContent = trimmedContent.substring(0, maxContentLength - 3) + '...';
  }
  
  const finalText = trimmedContent + ' ' + url;
  
  // Final validation
  const parsed = parseTweet(finalText);
  if (!parsed.valid) {
    console.warn(`⚠️  Tweet still invalid after trimming: ${finalText.length} chars`);
    // Emergency fallback - use shorter content
    const emergencyContent = 'Fresh local produce from UK farm shops. #FarmShop #FarmCompanion';
    return emergencyContent + ' ' + url;
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
   * Execute the complete daily farm spotlight workflow
   * @param {Object} options - Workflow options
   */
  async executeDailySpotlight(options = {}) {
    const startTime = new Date();
    const workflowId = `spotlight-${startTime.toISOString().split('T')[0]}`;
    
    // Override dry run mode if specified in options
    const isDryRun = options.dryRun !== undefined ? options.dryRun : this.dryRunMode;
    
    // Idempotency check - prevent double posting (only for live runs)
    if (!isDryRun) {
      const lock = await setOnceToday('daily');
      if (lock.enforced && !lock.created) {
        console.log('⏭️  Already posted today, skipping workflow');
        return { 
          success: true, 
          skipped: true, 
          reason: 'already_posted_today',
          workflowId 
        };
      }
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

      // Step 3: Compose final tweet with farm URL
      console.log('\n🐦 Step 3: Posting to Twitter...');
      const finalTweet = composeFinalTweet({ 
        baseText: contentGeneration.content.content || contentGeneration.content, 
        farm: farmSelection.farm 
      });
      console.log(`📝 Final tweet (${finalTweet.length} chars): "${finalTweet.substring(0, 80)}..."`);
      
      // Post tweet with image if available
      const twitterPost = await this.postToTwitter(finalTweet, contentGeneration, { ...options, dryRun: isDryRun });
      results.steps.twitterPost = twitterPost;
      
      if (!twitterPost.success) {
        throw new Error(`Twitter posting failed: ${twitterPost.error}`);
      }

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
      const content = contentGeneration.content.content || contentGeneration.content;
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
        console.log(`✅ Tweet posted successfully: ${result.tweetId}`);
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
   * Test the complete workflow
   */
  async testWorkflow() {
    console.log('🧪 Testing Twitter workflow components...');
    
    const tests = {
      farmSelection: await farmSelector.testSelection(),
      contentGeneration: await contentGenerator.testGeneration(),
      twitterConnection: await twitterClient.testConnection()
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
