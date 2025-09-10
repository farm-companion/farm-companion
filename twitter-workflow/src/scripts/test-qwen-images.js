#!/usr/bin/env node

/**
 * Test script for fal.ai FLUX integration
 * Run this to verify the new image generation works correctly
 */

import { imageGenerator } from '../lib/image-generator.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testFalAIImages() {
  console.log('🧪 Testing fal.ai FLUX integration...\n');

  // Test farm data
  const testFarm = {
    name: 'Test Farm Shop',
    location: {
      county: 'Devon'
    }
  };

  try {
    console.log('🎨 Generating test image...');
    const imageBuffer = await imageGenerator.generateFarmImage(testFarm, {
      width: 1024,
      height: 1024,
      styleHint: 'test'
    });

    if (imageBuffer) {
      console.log(`✅ Image generated successfully!`);
      console.log(`📊 Image size: ${imageBuffer.length} bytes`);
      console.log(`📏 Dimensions: 1024x1024`);
      console.log(`🎯 Provider: fal.ai FLUX (primary) or Pollinations (fallback)`);
      
      // Optional: Save test image
      const fs = await import('fs');
      const testImagePath = './test-falai-image.jpg';
      fs.writeFileSync(testImagePath, imageBuffer);
      console.log(`💾 Test image saved to: ${testImagePath}`);
    } else {
      console.log('❌ Image generation failed');
      console.log('🔍 Check your FAL_KEY environment variable');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFalAIImages();
