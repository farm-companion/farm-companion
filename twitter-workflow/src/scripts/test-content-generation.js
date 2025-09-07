#!/usr/bin/env node

/**
 * Content Generation Test Script
 * 
 * This script tests the DeepSeek AI content generation system
 * with various farm examples and content styles.
 */

import { contentGenerator } from '../lib/content-generator.js';
import { farmSelector } from '../lib/farm-selector.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test farm data
const testFarms = [
  {
    name: 'Green Valley Farm Shop',
    location: { county: 'Devon', postcode: 'EX1 1AA' },
    offerings: ['Fresh vegetables', 'Organic eggs', 'Artisan bread', 'Local honey'],
    story: 'A family-run farm with three generations of experience in sustainable agriculture. We pride ourselves on growing the finest organic produce and supporting our local community.',
    verified: true,
    rating: 4.8,
    slug: 'green-valley-farm-shop',
    images: ['https://example.com/farm1.jpg']
  },
  {
    name: 'Meadowbrook Farm',
    location: { county: 'Cornwall', postcode: 'TR1 1AA' },
    offerings: ['Free-range poultry', 'Seasonal vegetables', 'Homemade preserves'],
    story: 'Nestled in the heart of Cornwall, Meadowbrook Farm has been serving the community for over 50 years. Our commitment to traditional farming methods ensures the highest quality produce.',
    verified: true,
    rating: 4.6,
    slug: 'meadowbrook-farm',
    images: []
  },
  {
    name: 'Sunrise Organic Farm',
    location: { county: 'Somerset', postcode: 'BA1 1AA' },
    offerings: ['Organic vegetables', 'Grass-fed beef', 'Raw milk', 'Farm tours'],
    story: 'At Sunrise Organic Farm, we believe in the power of nature. Our certified organic produce is grown with love and care, without harmful chemicals or pesticides.',
    verified: true,
    rating: 4.9,
    slug: 'sunrise-organic-farm',
    images: ['https://example.com/farm3.jpg', 'https://example.com/farm3-2.jpg']
  }
];

const contentStyles = [
  { style: 'apple-ogilvy', tone: 'inspiring', name: 'Apple/Ogilvy Inspiring' },
  { style: 'apple-ogilvy', tone: 'premium', name: 'Apple/Ogilvy Premium' },
  { style: 'storytelling', tone: 'warm', name: 'Storytelling Warm' },
  { style: 'conversational', tone: 'friendly', name: 'Conversational Friendly' }
];

async function main() {
  console.log('🧪 Content Generation Test');
  console.log('===========================\n');
  
  // Test DeepSeek API connection
  console.log('🔍 Testing DeepSeek API connection...');
  const apiTest = await contentGenerator.testContentGeneration();
  
  if (!apiTest.success) {
    console.log('❌ DeepSeek API test failed:', apiTest.error);
    console.log('⚠️  Will test with fallback content generation only\n');
  } else {
    console.log('✅ DeepSeek API connection successful\n');
  }
  
  // Test content generation for each farm and style combination
  for (const farm of testFarms) {
    console.log(`\n🏪 Testing with: ${farm.name}`);
    console.log('='.repeat(50));
    
    for (const styleConfig of contentStyles) {
      console.log(`\n📝 Style: ${styleConfig.name}`);
      console.log('-'.repeat(30));
      
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
          
          if (result.originalContent && result.originalContent !== result.content) {
            console.log(`\n🤖 Original AI content:`);
            console.log(`"${result.originalContent}"`);
          }
        } else {
          console.log(`❌ Failed: ${result.error}`);
          if (result.fallbackContent) {
            console.log(`📝 Fallback content:`);
            console.log(`"${result.fallbackContent}"`);
          }
        }
      } catch (error) {
        console.log(`💥 Error: ${error.message}`);
      }
    }
  }
  
  // Test with real farm data if available
  console.log('\n\n🌐 Testing with real farm data...');
  console.log('='.repeat(50));
  
  try {
    const realFarmResult = await farmSelector.getTodaysFarm();
    
    if (realFarmResult.success) {
      const realFarm = realFarmResult.farm;
      console.log(`\n🏪 Real farm: ${realFarm.name} (${realFarm.location?.county})`);
      
      const contentResult = await contentGenerator.generateFarmSpotlight(realFarm, {
        style: 'apple-ogilvy',
        tone: 'inspiring'
      });
      
      if (contentResult.success) {
        console.log(`✅ Generated content (${contentResult.length} chars):`);
        console.log(`"${contentResult.content}"`);
      } else {
        console.log(`❌ Failed: ${contentResult.error}`);
      }
    } else {
      console.log(`❌ Failed to get real farm data: ${realFarmResult.error}`);
    }
  } catch (error) {
    console.log(`💥 Error testing with real data: ${error.message}`);
  }
  
  console.log('\n\n📊 Test Summary');
  console.log('===============');
  console.log('✅ Content generation test completed');
  console.log('📝 Check the output above for generated content examples');
  console.log('🔧 Adjust prompts and styles based on the results');
}

// Run the test
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
