import { contentGenerator } from '../lib/content-generator.js';
import { ProfileGenerator } from '../lib/profile-generator.js';
import { parseOgilvyResponse } from '../lib/ogilvy-prompts.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test script for Ogilvy-style content generation
 */
async function testOgilvyPrompts() {
  console.log('🧪 Testing Ogilvy Content Generation');
  console.log('=====================================\n');

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

  console.log('📊 Test Farm Data:');
  console.log(`  Name: ${testFarm.name}`);
  console.log(`  Location: ${testFarm.town}, ${testFarm.county}`);
  console.log(`  Produce: ${testFarm.produce}`);
  console.log(`  Signature: ${testFarm.signature}\n`);

  // Test 1: Daily Farm Spotlight
  console.log('🎯 Test 1: Daily Farm Spotlight');
  console.log('--------------------------------');
  try {
    const result = await contentGenerator.generateFarmSpotlight(testFarm);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log(`📝 Content: "${result.content}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🏷️  Hashtags: ${result.hashtagCount}`);
      console.log(`📝 Notes: ${result.notes}`);
      if (result.alt_text) {
        console.log(`🖼️  Alt text: "${result.alt_text}"`);
      }
      console.log(`🔧 Method: ${result.method}\n`);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Profile Bio
  console.log('👤 Test 2: Profile Bio');
  console.log('----------------------');
  try {
    const result = await profileGenerator.generateProfileBio();
    
    if (result.success) {
      console.log('✅ Success!');
      console.log(`📝 Bio: "${result.bio}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🔧 Method: ${result.method}\n`);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Pinned Tweet
  console.log('📌 Test 3: Pinned Tweet');
  console.log('------------------------');
  try {
    const result = await profileGenerator.generatePinnedTweet();
    
    if (result.success) {
      console.log('✅ Success!');
      console.log(`📝 Tweet: "${result.tweet}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🔧 Method: ${result.method}\n`);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Alt Text
  console.log('🖼️  Test 4: Image Alt Text');
  console.log('--------------------------');
  try {
    const result = await profileGenerator.generateAltText(testFarm);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log(`📝 Alt text: "${result.alt_text}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🔧 Method: ${result.method}\n`);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: JSON Parsing
  console.log('🔍 Test 5: JSON Response Parsing');
  console.log('---------------------------------');
  
  const sampleJsonResponse = `{
    "body": "Willow Brook Farm in Towcester, Northamptonshire — pasture-raised beef and small-batch dairy you can trust. #FarmShop #FarmCompanion #Beef",
    "alt_text": "Exterior of Willow Brook Farm shop with local beef and dairy on display",
    "notes": "Leads with location + pasture-raised benefit; one product tag to stay under 3 hashtags."
  }`;

  try {
    const parsed = parseOgilvyResponse(sampleJsonResponse);
    
    if (parsed.success) {
      console.log('✅ JSON parsing successful!');
      console.log(`📝 Body: "${parsed.body}"`);
      console.log(`📊 Length: ${parsed.body.length} characters`);
      console.log(`🏷️  Hashtags: ${parsed.hashtagCount}`);
      console.log(`🖼️  Alt text: "${parsed.alt_text}"`);
      console.log(`📝 Notes: ${parsed.notes}\n`);
    } else {
      console.log('❌ JSON parsing failed:', parsed.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('🎉 Ogilvy prompt testing completed!');
}

// Run the test
testOgilvyPrompts().catch(console.error);
