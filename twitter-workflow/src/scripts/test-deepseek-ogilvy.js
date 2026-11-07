import { contentGenerator } from '../lib/content-generator.js';
import { ProfileGenerator } from '../lib/profile-generator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test script for DeepSeek AI with Ogilvy prompts
 * Run this with your DeepSeek API key to test AI-generated content
 */
async function testDeepSeekOgilvy() {
  console.log('🤖 Testing DeepSeek AI with Ogilvy Prompts');
  console.log('==========================================\n');

  // Check if DeepSeek API key is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log('❌ DeepSeek API key not found in environment variables');
    console.log('💡 Set DEEPSEEK_API_KEY in your .env file or environment');
    console.log('💡 Example: DEEPSEEK_API_KEY=sk-your-key-here');
    return;
  }

  console.log('✅ DeepSeek API key found');
  console.log(`🔑 Key: ${process.env.DEEPSEEK_API_KEY.substring(0, 10)}...`);

  const profileGenerator = new ProfileGenerator();

  // Test farm data
  const testFarm = {
    name: 'Willow Brook Farm',
    town: 'Towcester',
    county: 'Northamptonshire',
    produce: 'grass-fed beef, small-batch dairy',
    signature: 'Family-run farm shop with pasture-raised meat',
    slug: 'willow-brook-farm'
  };

  console.log('\n📊 Test Farm Data:');
  console.log(`  Name: ${testFarm.name}`);
  console.log(`  Location: ${testFarm.town}, ${testFarm.county}`);
  console.log(`  Produce: ${testFarm.produce}`);
  console.log(`  Signature: ${testFarm.signature}\n`);

  // Test 1: Daily Farm Spotlight with AI
  console.log('🎯 Test 1: AI-Generated Daily Farm Spotlight');
  console.log('---------------------------------------------');
  try {
    const result = await contentGenerator.generateFarmSpotlight(testFarm);
    
    if (result.success) {
      console.log('✅ AI Generation Success!');
      console.log(`📝 Content: "${result.content}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🏷️  Hashtags: ${result.hashtagCount}`);
      console.log(`📝 Notes: ${result.notes}`);
      if (result.alt_text) {
        console.log(`🖼️  Alt text: "${result.alt_text}"`);
      }
      console.log(`🔧 Method: ${result.method}`);
      
      // Validate Ogilvy principles
      console.log('\n🔍 Ogilvy Validation:');
      const hasLocation = result.content.includes('Towcester') || result.content.includes('Northamptonshire');
      const hasBenefit = result.content.includes('beef') || result.content.includes('dairy') || result.content.includes('produce');
      const hasRequiredHashtags = result.content.includes('#FarmShop') && result.content.includes('#FarmCompanion');
      const noEmojis = !/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}]/u.test(result.content);
      const noExclamations = !result.content.includes('!');
      
      console.log(`  ✅ Location mentioned: ${hasLocation ? 'Yes' : 'No'}`);
      console.log(`  ✅ Concrete benefit: ${hasBenefit ? 'Yes' : 'No'}`);
      console.log(`  ✅ Required hashtags: ${hasRequiredHashtags ? 'Yes' : 'No'}`);
      console.log(`  ✅ No emojis: ${noEmojis ? 'Yes' : 'No'}`);
      console.log(`  ✅ No exclamations: ${noExclamations ? 'Yes' : 'No'}`);
      
    } else {
      console.log('❌ AI Generation Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Profile Bio with AI
  console.log('\n👤 Test 2: AI-Generated Profile Bio');
  console.log('------------------------------------');
  try {
    const result = await profileGenerator.generateProfileBio();
    
    if (result.success) {
      console.log('✅ AI Generation Success!');
      console.log(`📝 Bio: "${result.bio}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🔧 Method: ${result.method}`);
      
      // Validate requirements
      const hasUKFarmShops = result.bio.includes('UK farm shops');
      const hasDailySpotlight = result.bio.includes('daily spotlight');
      const under160 = result.length <= 160;
      
      console.log('\n🔍 Bio Validation:');
      console.log(`  ✅ Contains "UK farm shops": ${hasUKFarmShops ? 'Yes' : 'No'}`);
      console.log(`  ✅ Contains "daily spotlight": ${hasDailySpotlight ? 'Yes' : 'No'}`);
      console.log(`  ✅ Under 160 chars: ${under160 ? 'Yes' : 'No'}`);
      
    } else {
      console.log('❌ AI Generation Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Pinned Tweet with AI
  console.log('\n📌 Test 3: AI-Generated Pinned Tweet');
  console.log('-------------------------------------');
  try {
    const result = await profileGenerator.generatePinnedTweet();
    
    if (result.success) {
      console.log('✅ AI Generation Success!');
      console.log(`📝 Tweet: "${result.tweet}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🔧 Method: ${result.method}`);
      
      // Validate requirements
      const hasRequiredHashtags = result.tweet.includes('#FarmShop') && result.tweet.includes('#FarmCompanion');
      const under240 = result.length <= 240;
      const hasFreshLocal = result.tweet.includes('fresh') || result.tweet.includes('local') || result.tweet.includes('traceable');
      
      console.log('\n🔍 Tweet Validation:');
      console.log(`  ✅ Required hashtags: ${hasRequiredHashtags ? 'Yes' : 'No'}`);
      console.log(`  ✅ Under 240 chars: ${under240 ? 'Yes' : 'No'}`);
      console.log(`  ✅ Contains key concepts: ${hasFreshLocal ? 'Yes' : 'No'}`);
      
    } else {
      console.log('❌ AI Generation Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n🎉 DeepSeek AI + Ogilvy testing completed!');
  console.log('\n💡 If you see AI-generated content above, your DeepSeek integration is working!');
  console.log('💡 The deployed Vercel function will use the same API key to generate content daily.');
}

// Run the test
testDeepSeekOgilvy().catch(console.error);
