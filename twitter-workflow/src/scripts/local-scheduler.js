#!/usr/bin/env node

/**
 * Local Scheduler for Dual Farm Spotlight
 * 
 * This script runs locally and executes dual posting at optimal times:
 * - 10:00 AM GMT (morning post)
 * - 7:00 PM GMT (evening post)
 * 
 * Usage:
 *   node src/scripts/local-scheduler.js
 *   node src/scripts/local-scheduler.js --dry-run
 *   node src/scripts/local-scheduler.js --test
 */

import { workflowOrchestrator } from '../lib/workflow-orchestrator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isTest = args.includes('--test');

console.log('⏰ Farm Companion Local Scheduler');
console.log('==================================\n');

if (isTest) {
  console.log('🧪 TEST MODE: Will execute immediately regardless of time\n');
  await executeDualPosting('test');
  process.exit(0);
}

console.log('📅 Schedule: 10:00 AM and 7:00 PM GMT daily');
console.log('🌐 Platforms: Twitter/X, Bluesky, Telegram');
console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

// Check current time and determine if we should post
const now = new Date();
const currentHour = now.getUTCHours();
const currentMinute = now.getUTCMinutes();

console.log(`⏰ Current time: ${now.toISOString()}`);
console.log(`🌍 GMT: ${now.toUTCString()}`);

const isMorningTime = currentHour === 10 && currentMinute === 0;
const isEveningTime = currentHour === 19 && currentMinute === 0;

if (isMorningTime || isEveningTime) {
  const postType = isMorningTime ? 'morning' : 'evening';
  console.log(`\n🎯 It's ${postType} posting time! Executing dual workflow...\n`);
  
  await executeDualPosting(postType);
} else {
  console.log(`\n📊 Next posting times:`);
  console.log(`   🌅 Morning: 10:00 AM GMT (${getNextPostingTime(10, 0)})`);
  console.log(`   🌆 Evening: 7:00 PM GMT (${getNextPostingTime(19, 0)})`);
  console.log(`\n💡 To test immediately, use: node src/scripts/local-scheduler.js --test`);
  console.log(`💡 To run in dry-run mode, use: node src/scripts/local-scheduler.js --dry-run`);
}

/**
 * Execute dual posting workflow
 */
async function executeDualPosting(postType) {
  try {
    const result = await workflowOrchestrator.executeDualDailySpotlight({
      dryRun: isDryRun,
      postType: postType,
      scheduled: true
    });
    
    if (result.success) {
      console.log(`\n🎉 ${postType} dual workflow completed successfully!`);
      console.log(`📊 Posts: ${result.posts?.length || 0}`);
      console.log(`✅ Successful: ${result.posts?.filter(p => p.success && !p.skipped).length || 0}`);
    } else {
      console.log(`\n💥 ${postType} dual workflow failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error in ${postType} workflow:`, error.message);
    process.exit(1);
  }
}

/**
 * Get next posting time in a readable format
 */
function getNextPostingTime(hour, minute) {
  const now = new Date();
  const nextTime = new Date();
  nextTime.setUTCHours(hour, minute, 0, 0);
  
  if (nextTime <= now) {
    nextTime.setUTCDate(nextTime.getUTCDate() + 1);
  }
  
  return nextTime.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
