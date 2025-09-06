import { imageGenerator } from '../lib/image-generator.js';
import { contentGenerator } from '../lib/content-generator.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

async function testImageGeneration() {
  console.log('🎨 Testing AI Image Generation');
  console.log('================================\n');

  // Test farm data
  const testFarm = {
    name: 'Willow Brook Farm Shop',
    slug: 'willow-brook-farm-shop',
    location: {
      county: 'Northamptonshire',
      city: 'Towcester'
    },
    description: 'Family-run farm shop with fresh local produce'
  };

  console.log('📊 Test Farm:', testFarm.name);
  console.log('📍 Location:', testFarm.location.county);
  console.log('');

  try {
    // Test 1: Image Generation Only
    console.log('🎨 Test 1: Image Generation');
    console.log('----------------------------');
    
    const imageBuffer = await imageGenerator.generateFarmImage(testFarm);
    
    if (imageBuffer) {
      console.log(`✅ Image generated successfully (${imageBuffer.length} bytes)`);
      
      // Save test image
      const testImagePath = path.join(process.cwd(), 'test-farm-image.jpg');
      await fs.writeFile(testImagePath, imageBuffer);
      console.log(`💾 Test image saved to: ${testImagePath}`);
    } else {
      console.log('❌ Image generation failed');
    }

    console.log('');

    // Test 2: Content + Image Generation
    console.log('🎨 Test 2: Content + Image Generation');
    console.log('--------------------------------------');
    
    const result = await contentGenerator.generateFarmSpotlightWithImage(testFarm);
    
    if (result.success) {
      console.log(`✅ Content generated: "${result.content}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🖼️  Has image: ${result.hasImage}`);
      
      if (result.hasImage) {
        console.log(`✅ Image generated (${result.image.length} bytes)`);
        
        // Save combined test
        const combinedImagePath = path.join(process.cwd(), 'test-combined-image.jpg');
        await fs.writeFile(combinedImagePath, result.image);
        console.log(`💾 Combined test image saved to: ${combinedImagePath}`);
      } else {
        console.log('⚠️  No image generated');
      }
    } else {
      console.log('❌ Content + image generation failed');
    }

    console.log('');

    // Test 3: Fallback Image Generation
    console.log('🎨 Test 3: Fallback Image Generation');
    console.log('-------------------------------------');
    
    const fallbackImage = await imageGenerator.generateFallbackImage();
    
    if (fallbackImage) {
      console.log(`✅ Fallback image generated (${fallbackImage.length} bytes)`);
      
      const fallbackImagePath = path.join(process.cwd(), 'test-fallback-image.jpg');
      await fs.writeFile(fallbackImagePath, fallbackImage);
      console.log(`💾 Fallback image saved to: ${fallbackImagePath}`);
    } else {
      console.log('❌ Fallback image generation failed');
    }

    console.log('');

    // Test 4: Different Farm Types
    console.log('🎨 Test 4: Different Farm Types');
    console.log('-------------------------------');
    
    const farmTypes = [
      { name: 'Green Valley Butchers', location: { county: 'Yorkshire' } },
      { name: 'Meadow Farm Shop & Cafe', location: { county: 'Devon' } },
      { name: 'Hilltop Farm Shop', location: { county: 'Cumbria' } }
    ];

    for (const farm of farmTypes) {
      console.log(`\n📊 Testing: ${farm.name} (${farm.location.county})`);
      const image = await imageGenerator.generateFarmImage(farm);
      if (image) {
        console.log(`✅ Generated (${image.length} bytes)`);
      } else {
        console.log('❌ Failed');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎨 Image Generation Test Complete');
}

// Run the test
testImageGeneration().catch(console.error);
