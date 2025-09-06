#!/usr/bin/env node

/**
 * Dry Run Script for Twitter Workflow
 * 
 * This script allows you to test the Twitter workflow without actually posting
 * to Twitter. It will show you what content would be generated and posted.
 */

import { workflowOrchestrator } from '../lib/workflow-orchestrator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🧪 Twitter Workflow Dry Run');
  console.log('============================\n');
  
  // Force dry run mode
  process.env.DRY_RUN_MODE = 'true';
  process.env.POSTING_ENABLED = 'true'; // Enable posting but it will be dry run
  
  try {
    console.log('📊 Configuration:');
    console.log(`  Dry Run Mode: ${process.env.DRY_RUN_MODE}`);
    console.log(`  Posting Enabled: ${process.env.POSTING_ENABLED}`);
    console.log(`  Content Generation: ${process.env.CONTENT_GENERATION_ENABLED}`);
    console.log(`  Farm Data URL: ${process.env.FARM_DATA_URL}`);
    console.log(`  DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`  Twitter API: ${process.env.TWITTER_API_KEY ? '✅ Configured' : '❌ Not configured'}\n`);
    
    // Execute the workflow in dry run mode
    const result = await workflowOrchestrator.executeDailySpotlight({
      dryRun: true,
      source: 'dry-run-script'
    });
    
    if (result.success) {
      console.log('\n🎉 Dry run completed successfully!');
      console.log('\n📋 Summary:');
      console.log(`  Workflow ID: ${result.workflowId}`);
      console.log(`  Duration: ${Math.round(result.duration / 1000)}s`);
      console.log(`  Farm: ${result.steps.farmSelection?.farm?.name}`);
      console.log(`  Location: ${result.steps.farmSelection?.farm?.location?.county}`);
      console.log(`  Content Length: ${result.steps.contentGeneration?.content?.length} characters`);
      console.log(`  Tweet ID: ${result.steps.twitterPost?.tweetId}`);
      
      console.log('\n📝 Generated Content:');
      console.log(`"${result.steps.contentGeneration?.content}"`);
      
      if (result.steps.contentGeneration?.originalContent) {
        console.log('\n🤖 Original AI Content:');
        console.log(`"${result.steps.contentGeneration.originalContent}"`);
      }
      
      console.log('\n✅ This content would be posted to Twitter in live mode.');
    } else {
      console.log('\n❌ Dry run failed!');
      console.log(`Error: ${result.error}`);
      
      if (result.steps) {
        console.log('\n📊 Step Results:');
        Object.entries(result.steps).forEach(([step, stepResult]) => {
          const status = stepResult.success ? '✅' : '❌';
          console.log(`  ${status} ${step}: ${stepResult.success ? 'Success' : stepResult.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error during dry run:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the dry run
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
