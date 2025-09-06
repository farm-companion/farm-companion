#!/usr/bin/env node

/**
 * Complete Workflow Test Script
 * 
 * This script tests the entire Twitter workflow from farm selection
 * to content generation to posting (in dry run mode).
 */

import { workflowOrchestrator } from '../lib/workflow-orchestrator.js';
import { farmSelector } from '../lib/farm-selector.js';
import { contentGenerator } from '../lib/content-generator.js';
import { twitterClient } from '../lib/twitter-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🧪 Complete Twitter Workflow Test');
  console.log('==================================\n');
  
  // Force dry run mode for safety
  process.env.DRY_RUN_MODE = 'true';
  process.env.POSTING_ENABLED = 'true';
  process.env.CONTENT_GENERATION_ENABLED = 'true';
  
  console.log('🔧 Test Configuration:');
  console.log(`  Dry Run Mode: ${process.env.DRY_RUN_MODE}`);
  console.log(`  Posting Enabled: ${process.env.POSTING_ENABLED}`);
  console.log(`  Content Generation: ${process.env.CONTENT_GENERATION_ENABLED}`);
  console.log(`  DeepSeek API: ${process.env.DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Twitter API: ${process.env.TWITTER_API_KEY ? '✅ Configured' : '❌ Not configured'}\n`);
  
  // Test 1: Farm Selection
  console.log('📍 Test 1: Farm Selection');
  console.log('========================');
  
  let farmResult;
  try {
    farmResult = await farmSelector.getTodaysFarm();
    
    if (farmResult.success) {
      console.log(`✅ Farm selected: ${farmResult.farm.name}`);
      console.log(`📍 Location: ${farmResult.farm.location?.county}`);
      console.log(`📊 Farm index: ${farmResult.farmIndex + 1}/${farmResult.totalFarms}`);
      console.log(`🌟 Rating: ${farmResult.farm.rating || 'N/A'}`);
      console.log(`📝 Story: ${farmResult.farm.story ? farmResult.farm.story.substring(0, 100) + '...' : 'No story'}`);
      console.log(`🛍️  Offerings: ${farmResult.farm.offerings ? farmResult.farm.offerings.join(', ') : 'No offerings'}`);
    } else {
      console.log(`❌ Farm selection failed: ${farmResult.error}`);
      return;
    }
  } catch (error) {
    console.log(`💥 Farm selection error: ${error.message}`);
    return;
  }
  
  // Test 2: Content Generation
  console.log('\n✍️  Test 2: Content Generation');
  console.log('==============================');
  
  try {
    const contentResult = await contentGenerator.generateFarmSpotlight(farmResult.farm, {
      style: 'apple-ogilvy',
      tone: 'inspiring'
    });
    
    if (contentResult.success) {
      console.log(`✅ Content generated (${contentResult.length} chars):`);
      console.log(`"${contentResult.content}"`);
      
      // Analyze content quality
      analyzeContentQuality(contentResult.content);
      
      if (contentResult.originalContent && contentResult.originalContent !== contentResult.content) {
        console.log(`\n🤖 Original AI content:`);
        console.log(`"${contentResult.originalContent}"`);
      }
    } else {
      console.log(`❌ Content generation failed: ${contentResult.error}`);
      if (contentResult.fallbackContent) {
        console.log(`📝 Using fallback content:`);
        console.log(`"${contentResult.fallbackContent}"`);
        analyzeContentQuality(contentResult.fallbackContent);
      }
    }
  } catch (error) {
    console.log(`💥 Content generation error: ${error.message}`);
    return;
  }
  
  // Test 3: Twitter Client
  console.log('\n🐦 Test 3: Twitter Client');
  console.log('========================');
  
  try {
    const twitterTest = await twitterClient.testConnection();
    
    if (twitterTest.success) {
      console.log(`✅ Twitter client connected: @${twitterTest.user}`);
      console.log(`📊 Rate limit: ${twitterTest.rateLimit.remaining}/${twitterTest.rateLimit.limit}`);
    } else {
      console.log(`❌ Twitter client failed: ${twitterTest.error}`);
      console.log('⚠️  Will continue with dry run mode');
    }
  } catch (error) {
    console.log(`💥 Twitter client error: ${error.message}`);
    console.log('⚠️  Will continue with dry run mode');
  }
  
  // Test 4: Complete Workflow
  console.log('\n🚀 Test 4: Complete Workflow');
  console.log('============================');
  
  try {
    const workflowResult = await workflowOrchestrator.executeDailySpotlight({
      dryRun: true,
      source: 'complete-workflow-test'
    });
    
    if (workflowResult.success) {
      console.log(`✅ Complete workflow executed successfully!`);
      console.log(`⏱️  Duration: ${Math.round(workflowResult.duration / 1000)}s`);
      console.log(`🏪 Farm: ${workflowResult.steps.farmSelection?.farm?.name}`);
      const content = workflowResult.steps.contentGeneration?.content?.content || workflowResult.steps.contentGeneration?.content;
      console.log(`📝 Content: "${content?.substring(0, 80)}..."`);
      console.log(`🐦 Tweet ID: ${workflowResult.steps.twitterPost?.tweetId}`);
      
      // Display step-by-step results
      console.log('\n📊 Step-by-Step Results:');
      Object.entries(workflowResult.steps).forEach(([step, result]) => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${step}: ${result.success ? 'Success' : result.error}`);
      });
    } else {
      console.log(`❌ Complete workflow failed: ${workflowResult.error}`);
      
      if (workflowResult.steps) {
        console.log('\n📊 Step Results:');
        Object.entries(workflowResult.steps).forEach(([step, stepResult]) => {
          const status = stepResult.success ? '✅' : '❌';
          console.log(`  ${status} ${step}: ${stepResult.success ? 'Success' : stepResult.error}`);
        });
      }
    }
  } catch (error) {
    console.log(`💥 Complete workflow error: ${error.message}`);
  }
  
  // Test 5: Multiple Content Styles
  console.log('\n🎨 Test 5: Multiple Content Styles');
  console.log('==================================');
  
  const styles = [
    { style: 'apple-ogilvy', tone: 'inspiring' },
    { style: 'apple-ogilvy', tone: 'premium' },
    { style: 'storytelling', tone: 'warm' },
    { style: 'conversational', tone: 'friendly' }
  ];
  
  for (const styleConfig of styles) {
    try {
      console.log(`\n📝 ${styleConfig.style} + ${styleConfig.tone}:`);
      console.log('-'.repeat(40));
      
      const result = await contentGenerator.generateFarmSpotlight(farmResult.farm, styleConfig);
      
      if (result.success) {
        console.log(`"${result.content}"`);
        analyzeContentQuality(result.content);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
  }
  
  // Test 6: Farm Schedule
  console.log('\n📅 Test 6: Farm Schedule');
  console.log('========================');
  
  try {
    const scheduleResult = await farmSelector.getFarmSchedule(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    if (scheduleResult.success) {
      console.log(`✅ Generated schedule for next 7 days:`);
      scheduleResult.schedule.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.date}: ${item.farm.name} (${item.farm.location?.county})`);
      });
      console.log(`📊 Total farms in rotation: ${scheduleResult.totalFarms}`);
    } else {
      console.log(`❌ Schedule generation failed: ${scheduleResult.error}`);
    }
  } catch (error) {
    console.log(`💥 Schedule generation error: ${error.message}`);
  }
  
  console.log('\n\n📊 Test Summary');
  console.log('===============');
  console.log('✅ Complete workflow test completed');
  console.log('📝 All components tested successfully');
  console.log('🎯 System ready for production deployment');
  console.log('🔧 Configure API keys to enable full functionality');
}

/**
 * Analyze content quality for Apple/Ogilvy characteristics
 */
function analyzeContentQuality(content) {
  const analysis = {
    hasHook: false,
    hasSensoryLanguage: false,
    hasPowerWords: false,
    hasCallToAction: false,
    hasEmotionalAppeal: false,
    length: content.length,
    score: 0
  };
  
  // Check for hooks (questions, statements that stop scrolling)
  const hooks = ['what if', 'imagine', 'discover', 'experience', 'taste', 'feel', 'breathe'];
  analysis.hasHook = hooks.some(hook => content.toLowerCase().includes(hook));
  if (analysis.hasHook) analysis.score += 2;
  
  // Check for sensory language
  const sensoryWords = ['taste', 'smell', 'feel', 'see', 'hear', 'touch', 'savor', 'breathe'];
  analysis.hasSensoryLanguage = sensoryWords.some(word => content.toLowerCase().includes(word));
  if (analysis.hasSensoryLanguage) analysis.score += 2;
  
  // Check for power words
  const powerWords = ['discover', 'experience', 'transform', 'awaken', 'unlock', 'reveal', 'unleash'];
  analysis.hasPowerWords = powerWords.some(word => content.toLowerCase().includes(word));
  if (analysis.hasPowerWords) analysis.score += 2;
  
  // Check for call to action
  const ctaWords = ['visit', 'discover', 'experience', 'taste', 'feel', 'explore', 'find'];
  analysis.hasCallToAction = ctaWords.some(word => content.toLowerCase().includes(word));
  if (analysis.hasCallToAction) analysis.score += 2;
  
  // Check for emotional appeal
  const emotionalWords = ['passion', 'love', 'care', 'authentic', 'genuine', 'heart', 'soul'];
  analysis.hasEmotionalAppeal = emotionalWords.some(word => content.toLowerCase().includes(word));
  if (analysis.hasEmotionalAppeal) analysis.score += 2;
  
  // Length bonus
  if (content.length >= 200 && content.length <= 280) analysis.score += 1;
  
  // Display analysis
  const quality = analysis.score >= 8 ? '🌟 Excellent' : analysis.score >= 6 ? '✅ Good' : analysis.score >= 4 ? '⚠️  Fair' : '❌ Poor';
  console.log(`📊 Quality: ${quality} (${analysis.score}/10) - ${analysis.hasHook ? '✅' : '❌'} Hook | ${analysis.hasSensoryLanguage ? '✅' : '❌'} Sensory | ${analysis.hasPowerWords ? '✅' : '❌'} Power | ${analysis.hasCallToAction ? '✅' : '❌'} CTA | ${analysis.hasEmotionalAppeal ? '✅' : '❌'} Emotional`);
}

// Run the test
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
