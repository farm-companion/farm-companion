#!/usr/bin/env node

/**
 * Twitter Workflow Main Entry Point
 * 
 * This is the main entry point for the Twitter workflow system.
 * Can be run as a standalone script or imported as a module.
 */

import { workflowOrchestrator } from './lib/workflow-orchestrator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'spotlight';

  console.log('🐦 Farm Companion Twitter Workflow');
  console.log('=====================================\n');

  try {
    switch (command) {
      case 'spotlight':
        await executeSpotlight(args);
        break;
      case 'test':
        await executeTest();
        break;
      case 'status':
        await executeStatus();
        break;
      case 'schedule':
        await executeSchedule(args);
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

/**
 * Execute daily spotlight workflow
 */
async function executeSpotlight(args) {
  const options = parseSpotlightOptions(args);
  
  console.log('🚀 Executing daily farm spotlight workflow...\n');
  
  const result = await workflowOrchestrator.executeDailySpotlight(options);
  
  if (result.success) {
    console.log('\n🎉 Workflow completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Workflow failed!');
    process.exit(1);
  }
}

/**
 * Execute workflow tests
 */
async function executeTest() {
  console.log('🧪 Running workflow tests...\n');
  
  const result = await workflowOrchestrator.testWorkflow();
  
  if (result.success) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

/**
 * Get workflow status
 */
async function executeStatus() {
  console.log('📊 Getting workflow status...\n');
  
  const result = await workflowOrchestrator.getStatus();
  
  if (result.success) {
    const status = result.status;
    
    console.log('🔧 Configuration:');
    console.log(`  Dry Run Mode: ${status.dryRunMode ? '✅' : '❌'}`);
    console.log(`  Posting Enabled: ${status.postingEnabled ? '✅' : '❌'}`);
    console.log(`  Content Generation: ${status.contentGenerationEnabled ? '✅' : '❌'}`);
    console.log(`  Notifications: ${status.notificationsConfigured ? '✅' : '❌'}`);
    
    if (status.farmStats) {
      console.log('\n🏪 Farm Statistics:');
      console.log(`  Total Farms: ${status.farmStats.totalFarms}`);
      console.log(`  Farms with Images: ${status.farmStats.farmsWithImages}`);
      console.log(`  Verified Farms: ${status.farmStats.verifiedFarms}`);
      console.log(`  Average Rating: ${status.farmStats.averageRating || 'N/A'}`);
    }
    
    if (status.twitterStatus) {
      console.log('\n🐦 Twitter Status:');
      console.log(`  Initialized: ${status.twitterStatus.isInitialized ? '✅' : '❌'}`);
      console.log(`  Rate Limit Remaining: ${status.twitterStatus.remaining}`);
    }
    
    process.exit(0);
  } else {
    console.log('❌ Failed to get status:', result.error);
    process.exit(1);
  }
}

/**
 * Show farm schedule
 */
async function executeSchedule(args) {
  const days = parseInt(args[1]) || 7;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + days);
  
  console.log(`📅 Showing farm schedule for next ${days} days...\n`);
  
  const { farmSelector } = await import('./lib/farm-selector.js');
  const result = await farmSelector.getFarmSchedule(startDate, endDate);
  
  if (result.success) {
    console.log('📋 Farm Schedule:');
    result.schedule.forEach((item, index) => {
      console.log(`${index + 1}. ${item.date}: ${item.farm.name} (${item.farm.location?.county})`);
    });
    
    console.log(`\n📊 Total farms in rotation: ${result.totalFarms}`);
    process.exit(0);
  } else {
    console.log('❌ Failed to get schedule:', result.error);
    process.exit(1);
  }
}

/**
 * Parse command line options for spotlight command
 */
function parseSpotlightOptions(args) {
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--date') {
      options.date = new Date(args[++i]);
    } else if (arg === '--style') {
      options.style = args[++i];
    } else if (arg === '--tone') {
      options.tone = args[++i];
    }
  }
  
  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Usage: node src/index.js <command> [options]

Commands:
  spotlight [options]    Execute daily farm spotlight workflow (default)
  test                   Run workflow tests
  status                 Show workflow status and configuration
  schedule [days]        Show farm schedule for next N days (default: 7)
  help                   Show this help message

Spotlight Options:
  --dry-run              Run in dry-run mode (don't actually post)
  --date <date>          Use specific date (YYYY-MM-DD format)
  --style <style>        Content style (apple-ogilvy, storytelling, conversational)
  --tone <tone>          Content tone (inspiring, warm, premium, urgent, educational)

Examples:
  node src/index.js spotlight
  node src/index.js spotlight --dry-run
  node src/index.js spotlight --date 2024-01-15 --style apple-ogilvy
  node src/index.js test
  node src/index.js status
  node src/index.js schedule 14

Environment Variables:
  See env.example for required configuration variables.
  `);
  
  process.exit(0);
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { workflowOrchestrator };
