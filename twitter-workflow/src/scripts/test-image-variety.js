#!/usr/bin/env node

/**
 * Test script to showcase all image variety categories
 * Demonstrates the 8 different image types: farm shop exterior, produce, fruits, scenic views, seeds, gardens, landscapes, still life
 */

import { imageGenerator } from '../lib/image-generator.js';
import fs from 'fs';
import path from 'path';

// Sample farms to test different image categories
const testFarms = [
  { name: 'Apple Orchard Farm Shop', location: { county: 'Kent' } },
  { name: 'Berry Lane Farm Shop', location: { county: 'Somerset' } },
  { name: 'Grain Valley Farm Shop', location: { county: 'Norfolk' } },
  { name: 'Meadow View Farm Shop', location: { county: 'Devon' } },
  { name: 'Seed & Soil Farm Shop', location: { county: 'Yorkshire' } },
  { name: 'Garden Fresh Farm Shop', location: { county: 'Surrey' } },
  { name: 'Landscape Farm Shop', location: { county: 'Cumbria' } },
  { name: 'Artisan Farm Shop', location: { county: 'Cornwall' } }
];

async function main() {
  console.log('🎨 Testing Image Variety Categories');
  console.log('====================================\n');
  
  const results = [];
  
  for (let i = 0; i < testFarms.length; i++) {
    const farm = testFarms[i];
    console.log(`📊 Testing Farm ${i + 1}/8: ${farm.name}`);
    console.log(`📍 Location: ${farm.location.county}`);
    
    try {
      // Generate the prompt to see what category it selects
      const prompt = imageGenerator.createFarmPrompt(farm);
      console.log(`🎨 Category: ${getCategoryFromPrompt(prompt)}`);
      console.log(`📝 Prompt: "${prompt.substring(0, 100)}..."`);
      
      // Generate the image
      const imageBuffer = await imageGenerator.generateFarmImage(farm);
      
      if (imageBuffer) {
        const filename = `test-variety-${i + 1}-${farm.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        const filepath = path.join(process.cwd(), filename);
        fs.writeFileSync(filepath, imageBuffer);
        
        console.log(`✅ Generated image (${imageBuffer.length} bytes)`);
        console.log(`💾 Saved to: ${filename}`);
        
        results.push({
          farm: farm.name,
          category: getCategoryFromPrompt(prompt),
          size: imageBuffer.length,
          filename
        });
      } else {
        console.log(`❌ Failed to generate image`);
        results.push({
          farm: farm.name,
          category: getCategoryFromPrompt(prompt),
          size: 0,
          filename: null
        });
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      results.push({
        farm: farm.name,
        category: 'error',
        size: 0,
        filename: null,
        error: error.message
      });
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 Image Variety Test Summary');
  console.log('=============================');
  
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = 0;
    }
    categories[result.category]++;
  });
  
  console.log('\n🎯 Categories Generated:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} images`);
  });
  
  console.log('\n📈 Results:');
  results.forEach((result, index) => {
    const status = result.filename ? '✅' : '❌';
    console.log(`  ${status} ${result.farm}: ${result.category} (${result.size} bytes)`);
  });
  
  const successCount = results.filter(r => r.filename).length;
  console.log(`\n🎉 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
  
  if (successCount > 0) {
    console.log('\n💡 Check the generated images to see the variety!');
  }
}

function getCategoryFromPrompt(prompt) {
  if (prompt.includes('farm shop exterior')) return 'Farm Shop Exterior';
  if (prompt.includes('farm produce display')) return 'Farm Produce';
  if (prompt.includes('fruit display')) return 'Fruit Display';
  if (prompt.includes('countryside landscape')) return 'Scenic Views';
  if (prompt.includes('seeds and grains')) return 'Seeds & Grains';
  if (prompt.includes('vegetable garden')) return 'Vegetable Garden';
  if (prompt.includes('farm landscape')) return 'Farm Landscape';
  if (prompt.includes('produce still life')) return 'Produce Still Life';
  return 'Unknown';
}

main().catch(console.error);
