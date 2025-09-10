#!/usr/bin/env node

/**
 * PM2 Scheduler for Dual Farm Spotlight
 * 
 * This script runs continuously and executes dual posting at optimal times
 * Perfect for VPS, dedicated servers, or always-on machines
 * 
 * Setup:
 * 1. npm install -g pm2
 * 2. pm2 start pm2-scheduler.js --name "farm-scheduler"
 * 3. pm2 save
 * 4. pm2 startup
 */

import { workflowOrchestrator } from './src/lib/workflow-orchestrator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('⏰ Farm Companion PM2 Scheduler Started');
console.log('=====================================\n');

// Check every minute if it's time to post
setInterval(async () => {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  
  // Only check at minute 0 to avoid multiple executions
  if (currentMinute !== 0) return;
  
  const isMorningTime = currentHour === 10;
  const isEveningTime = currentHour === 19;
  
  if (isMorningTime || isEveningTime) {
    const postType = isMorningTime ? 'morning' : 'evening';
    console.log(`\n🎯 ${postType} posting time detected! Executing dual workflow...`);
    
    try {
      const result = await workflowOrchestrator.executeDualDailySpotlight({
        dryRun: false,
        postType: postType,
        scheduled: true
      });
      
      if (result.success) {
        console.log(`✅ ${postType} dual workflow completed successfully!`);
        console.log(`📊 Posts: ${result.posts?.length || 0}`);
        console.log(`✅ Successful: ${result.posts?.filter(p => p.success && !p.skipped).length || 0}`);
      } else {
        console.error(`❌ ${postType} dual workflow failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Fatal error in ${postType} workflow:`, error.message);
    }
  } else {
    // Log every hour to show the scheduler is alive
    if (currentMinute === 0) {
      console.log(`⏰ ${now.toISOString()} - Scheduler running, next posts at 10:00 and 19:00 UTC`);
    }
  }
}, 60000); // Check every minute

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Farm Companion PM2 Scheduler shutting down...');
  process.exit(0);
});

console.log('📅 Schedule: 10:00 AM and 7:00 PM UTC daily');
console.log('🌐 Platforms: Twitter/X, Bluesky, Telegram');
console.log('🔄 Checking every minute for posting times...\n');
