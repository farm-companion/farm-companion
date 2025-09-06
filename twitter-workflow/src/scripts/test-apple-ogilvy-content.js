#!/usr/bin/env node

/**
 * Apple/Ogilvy Content Generation Test Script
 * 
 * This script tests the enhanced Apple/Ogilvy-style content generation
 * with real farm data and various content styles.
 */

import { contentGenerator } from '../lib/content-generator.js';
import { farmSelector } from '../lib/farm-selector.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enhanced test farm data with rich content
const testFarms = [
  {
    name: 'Green Valley Farm Shop',
    location: { county: 'Devon', postcode: 'EX1 1AA' },
    offerings: ['Fresh vegetables', 'Organic eggs', 'Artisan bread', 'Local honey', 'Seasonal produce'],
    story: 'A family-run farm with three generations of experience in sustainable agriculture. We pride ourselves on growing the finest organic produce and supporting our local community. Our commitment to traditional farming methods ensures the highest quality vegetables, free-range eggs, and artisan bread made with locally sourced grains.',
    verified: true,
    rating: 4.8,
    slug: 'green-valley-farm-shop',
    images: ['https://example.com/farm1.jpg'],
    contact: { website: 'https://greenvalleyfarm.co.uk', phone: '+44 1234 567890' },
    hours: [{ day: 'Mon', open: '09:00', close: '17:00' }]
  },
  {
    name: 'Meadowbrook Farm',
    location: { county: 'Cornwall', postcode: 'TR1 1AA' },
    offerings: ['Free-range poultry', 'Seasonal vegetables', 'Homemade preserves', 'Fresh herbs'],
    story: 'Nestled in the heart of Cornwall, Meadowbrook Farm has been serving the community for over 50 years. Our commitment to traditional farming methods ensures the highest quality produce. We raise free-range chickens and grow seasonal vegetables using sustainable practices.',
    verified: true,
    rating: 4.6,
    slug: 'meadowbrook-farm',
    images: [],
    contact: { website: 'https://meadowbrookfarm.co.uk' },
    hours: [{ day: 'Tue', open: '08:00', close: '18:00' }]
  },
  {
    name: 'Sunrise Organic Farm',
    location: { county: 'Somerset', postcode: 'BA1 1AA' },
    offerings: ['Organic vegetables', 'Grass-fed beef', 'Raw milk', 'Farm tours', 'Educational workshops'],
    story: 'At Sunrise Organic Farm, we believe in the power of nature. Our certified organic produce is grown with love and care, without harmful chemicals or pesticides. We offer grass-fed beef, raw milk, and educational farm tours to connect people with where their food comes from.',
    verified: true,
    rating: 4.9,
    slug: 'sunrise-organic-farm',
    images: ['https://example.com/farm3.jpg', 'https://example.com/farm3-2.jpg'],
    contact: { website: 'https://sunriseorganic.co.uk', phone: '+44 9876 543210' },
    hours: [{ day: 'Wed', open: '07:00', close: '19:00' }]
  }
];

const contentStyles = [
  { style: 'apple-ogilvy', tone: 'inspiring', name: 'Apple/Ogilvy Inspiring' },
  { style: 'apple-ogilvy', tone: 'premium', name: 'Apple/Ogilvy Premium' },
  { style: 'apple-ogilvy', tone: 'warm', name: 'Apple/Ogilvy Warm' },
  { style: 'storytelling', tone: 'inspiring', name: 'Storytelling Inspiring' },
  { style: 'conversational', tone: 'warm', name: 'Conversational Warm' }
];

async function main() {
  console.log('🧪 Apple/Ogilvy Content Generation Test');
  console.log('=======================================\n');
  
  // Test DeepSeek API connection
  console.log('🔍 Testing DeepSeek API connection...');
  const apiTest = await contentGenerator.testGeneration();
  
  if (!apiTest.success) {
    console.log('❌ DeepSeek API test failed:', apiTest.error);
    console.log('⚠️  Will test with fallback content generation only\n');
  } else {
    console.log('✅ DeepSeek API connection successful\n');
  }
  
  // Test content generation for each farm and style combination
  for (const farm of testFarms) {
    console.log(`\n🏪 Testing with: ${farm.name}`);
    console.log('='.repeat(60));
    console.log(`📍 Location: ${farm.location.county}`);
    console.log(`🌟 Rating: ${farm.rating}/5.0`);
    console.log(`📝 Story: ${farm.story.substring(0, 100)}...`);
    console.log(`🛍️  Offerings: ${farm.offerings.join(', ')}`);
    
    for (const styleConfig of contentStyles) {
      console.log(`\n📝 Style: ${styleConfig.name}`);
      console.log('-'.repeat(40));
      
      try {
        const result = await contentGenerator.generateFarmSpotlight(farm, {
          style: styleConfig.style,
          tone: styleConfig.tone,
          maxLength: 280,
          includeHashtags: true,
          includeEmojis: true
        });
        
        if (result.success) {
          console.log(`✅ Generated (${result.length} chars):`);
          console.log(`"${result.content}"`);
          
          // Analyze the content for Apple/Ogilvy characteristics
          analyzeContent(result.content, styleConfig);
          
          if (result.originalContent && result.originalContent !== result.content) {
            console.log(`\n🤖 Original AI content:`);
            console.log(`"${result.originalContent}"`);
          }
        } else {
          console.log(`❌ Failed: ${result.error}`);
          if (result.fallbackContent) {
            console.log(`📝 Fallback content:`);
            console.log(`"${result.fallbackContent}"`);
            analyzeContent(result.fallbackContent, styleConfig);
          }
        }
      } catch (error) {
        console.log(`💥 Error: ${error.message}`);
      }
    }
  }
  
  // Test with real farm data if available
  console.log('\n\n🌐 Testing with real farm data...');
  console.log('='.repeat(60));
  
  try {
    const realFarmResult = await farmSelector.getTodaysFarm();
    
    if (realFarmResult.success) {
      const realFarm = realFarmResult.farm;
      console.log(`\n🏪 Real farm: ${realFarm.name} (${realFarm.location?.county})`);
      console.log(`📊 Farm index: ${realFarmResult.farmIndex + 1}/${realFarmResult.totalFarms}`);
      
      // Test multiple styles with real farm
      const styles = ['apple-ogilvy', 'storytelling', 'conversational'];
      const tones = ['inspiring', 'premium', 'warm'];
      
      for (const style of styles) {
        for (const tone of tones) {
          console.log(`\n📝 ${style} + ${tone}:`);
          console.log('-'.repeat(30));
          
          const contentResult = await contentGenerator.generateFarmSpotlight(realFarm, {
            style,
            tone
          });
          
          if (contentResult.success) {
            console.log(`"${contentResult.content}"`);
            analyzeContent(contentResult.content, { style, tone });
          } else {
            console.log(`❌ Failed: ${contentResult.error}`);
          }
        }
      }
    } else {
      console.log(`❌ Failed to get real farm data: ${realFarmResult.error}`);
    }
  } catch (error) {
    console.log(`💥 Error testing with real data: ${error.message}`);
  }
  
  console.log('\n\n📊 Test Summary');
  console.log('===============');
  console.log('✅ Apple/Ogilvy content generation test completed');
  console.log('📝 Check the output above for generated content examples');
  console.log('🔧 Adjust prompts and styles based on the results');
  console.log('🎯 Focus on content that creates desire and drives action');
}

/**
 * Analyze content for Apple/Ogilvy characteristics
 */
function analyzeContent(content, styleConfig) {
  const analysis = {
    hasHook: false,
    hasSensoryLanguage: false,
    hasPowerWords: false,
    hasCallToAction: false,
    hasEmotionalAppeal: false,
    length: content.length
  };
  
  // Check for hooks (questions, statements that stop scrolling)
  const hooks = ['what if', 'imagine', 'discover', 'experience', 'taste', 'feel', 'breathe'];
  analysis.hasHook = hooks.some(hook => content.toLowerCase().includes(hook));
  
  // Check for sensory language
  const sensoryWords = ['taste', 'smell', 'feel', 'see', 'hear', 'touch', 'savor', 'breathe'];
  analysis.hasSensoryLanguage = sensoryWords.some(word => content.toLowerCase().includes(word));
  
  // Check for power words
  const powerWords = ['discover', 'experience', 'transform', 'awaken', 'unlock', 'reveal', 'unleash'];
  analysis.hasPowerWords = powerWords.some(word => content.toLowerCase().includes(word));
  
  // Check for call to action
  const ctaWords = ['visit', 'discover', 'experience', 'taste', 'feel', 'explore', 'find'];
  analysis.hasCallToAction = ctaWords.some(word => content.toLowerCase().includes(word));
  
  // Check for emotional appeal
  const emotionalWords = ['passion', 'love', 'care', 'authentic', 'genuine', 'heart', 'soul'];
  analysis.hasEmotionalAppeal = emotionalWords.some(word => content.toLowerCase().includes(word));
  
  // Display analysis
  console.log(`📊 Analysis: ${analysis.hasHook ? '✅' : '❌'} Hook | ${analysis.hasSensoryLanguage ? '✅' : '❌'} Sensory | ${analysis.hasPowerWords ? '✅' : '❌'} Power Words | ${analysis.hasCallToAction ? '✅' : '❌'} CTA | ${analysis.hasEmotionalAppeal ? '✅' : '❌'} Emotional`);
}

// Run the test
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
