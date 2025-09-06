#!/usr/bin/env node

/**
 * Test script for Slack notifications
 * Tests both success and error notification scenarios
 */

import { monitoringSystem } from '../lib/monitoring.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🔔 Testing Slack Notifications');
  console.log('==============================\n');
  
  // Check if webhook is configured
  if (!process.env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL === 'your_slack_webhook_url_here') {
    console.log('❌ SLACK_WEBHOOK_URL not configured');
    console.log('📝 Please add your Slack webhook URL to environment variables');
    console.log('💡 Get it from: https://api.slack.com/apps -> Your App -> Incoming Webhooks');
    return;
  }
  
  console.log('✅ Slack webhook URL configured');
  console.log(`🔗 Webhook: ${process.env.SLACK_WEBHOOK_URL.substring(0, 50)}...\n`);
  
  // Test 1: Success Notification
  console.log('🧪 Test 1: Success Notification');
  console.log('-------------------------------');
  
  try {
    const successData = {
      workflowId: 'test-success-123',
      farm: { 
        name: 'Test Farm Shop', 
        location: { county: 'Test County' },
        slug: 'test-farm-shop'
      },
      content: 'Test farm shop sells fresh local produce. #FarmShop #TestCounty #FarmCompanion',
      tweetId: 'test-tweet-123',
      metrics: {
        duration: 5000,
        farmIndex: 1,
        totalFarms: 875,
        contentLength: 85,
        executionTime: 5
      }
    };
    
    const successResult = await monitoringSystem.sendSuccessNotification(successData);
    
    if (successResult.success) {
      console.log('✅ Success notification sent successfully!');
    } else {
      console.log(`❌ Success notification failed: ${successResult.error}`);
    }
  } catch (error) {
    console.log(`💥 Success notification error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Error Notification
  console.log('🧪 Test 2: Error Notification');
  console.log('-----------------------------');
  
  try {
    const errorData = {
      workflowId: 'test-error-456',
      error: 'Test error: Twitter API rate limit exceeded',
      duration: 3000,
      source: 'test',
      steps: {
        farmSelection: 'success',
        contentGeneration: 'success',
        twitterPost: 'failed'
      }
    };
    
    const errorResult = await monitoringSystem.sendErrorNotification(errorData);
    
    if (errorResult.success) {
      console.log('✅ Error notification sent successfully!');
    } else {
      console.log(`❌ Error notification failed: ${errorResult.error}`);
    }
  } catch (error) {
    console.log(`💥 Error notification error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Health Check
  console.log('🧪 Test 3: Health Check Notification');
  console.log('------------------------------------');
  
  try {
    const healthData = {
      status: {
        overall: 'healthy'
      },
      farmStats: {
        totalFarms: 875,
        lastUpdated: new Date().toISOString()
      },
      twitterStatus: {
        rateLimit: { remaining: 300, limit: 300 }
      },
      contentStatus: {
        aiGeneration: true,
        fallbackMode: false
      }
    };
    
    const healthResult = await monitoringSystem.sendHealthCheckNotification(healthData);
    
    if (healthResult.success) {
      console.log('✅ Health check notification sent successfully!');
    } else {
      console.log(`❌ Health check notification failed: ${healthResult.error}`);
    }
  } catch (error) {
    console.log(`💥 Health check notification error: ${error.message}`);
  }
  
  console.log('\n🎉 Slack notification tests completed!');
  console.log('📱 Check your Slack channel for the test messages');
}

main().catch(console.error);
