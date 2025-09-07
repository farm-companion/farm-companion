#!/usr/bin/env node

import { workflowOrchestrator } from './src/lib/workflow-orchestrator.js';
import { contentGenerator } from './src/lib/content-generator.js';
import { twitterClient } from './src/lib/twitter-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function sendTweet() {
  try {
    console.log('🐦 Starting Twitter workflow with image generation...');
    
    // Initialize Twitter client
    await twitterClient.initialize();
    
    // Verify credentials
    const user = await twitterClient.client.v2.me();
    console.log(`✅ Twitter API verified for user: @${user.data.username}`);

    // Use the proper workflow orchestrator to ensure farm URL is included
    console.log('🎯 Using proper workflow to ensure farm URL is included...');
    
    const result = await workflowOrchestrator.executeDailySpotlight({
      dryRun: false,
      includeImage: true
    });
    
    if (result.success) {
      console.log('✅ Tweet posted successfully!');
      console.log('🐦 Tweet ID:', result.tweetId);
      console.log('🔗 Tweet URL:', result.url);
      if (mediaIds.length > 0) {
        console.log('🖼️  Tweet includes AI-generated image');
      }
    } else {
      throw new Error('Failed to post tweet');
    }

  } catch (error) {
    console.error('❌ Error in Twitter workflow:', error.message);
    if (error.code) {
      console.error('📊 Error code:', error.code);
    }
    if (error.data) {
      console.error('📊 Error details:', JSON.stringify(error.data, null, 2));
    }
    if (error.rateLimit) {
      console.error('⏰ Rate limit info:', error.rateLimit);
    }
    console.error('🔍 Full error:', error);
    process.exit(1);
  }
}

sendTweet();
