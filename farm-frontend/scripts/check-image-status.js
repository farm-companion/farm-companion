#!/usr/bin/env node

/**
 * Image Status Checker for Farm Companion
 * 
 * This script checks the current status of uploaded images across all produce types and months.
 * Run with: node scripts/check-image-status.js
 */

const API_BASE_URL = 'https://farm-produce-images-e26nfxge7-abdur-rahman-morris-projects.vercel.app';

// Produce types from the system
const PRODUCE_TYPES = [
  { slug: 'sweetcorn', name: 'Sweetcorn', months: [7, 8, 9] },
  { slug: 'tomatoes', name: 'Tomatoes', months: [6, 7, 8, 9, 10] },
  { slug: 'strawberries', name: 'Strawberries', months: [5, 6, 7] },
  { slug: 'blackberries', name: 'Blackberries', months: [7, 8, 9] },
  { slug: 'runner-beans', name: 'Runner Beans', months: [7, 8, 9] },
  { slug: 'plums', name: 'Plums', months: [8, 9] },
  { slug: 'apples', name: 'Apples', months: [8, 9, 10, 11] },
  { slug: 'pumpkins', name: 'Pumpkins', months: [9, 10] }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function checkImagesForProduce(produceSlug, month) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images?produceSlug=${produceSlug}&month=${month}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        count: data.data.images.length,
        images: data.data.images
      };
    } else {
      return { count: 0, images: [], error: data.error };
    }
  } catch (error) {
    return { count: 0, images: [], error: error.message };
  }
}

async function checkAllImages() {
  console.log('🍎 Farm Companion Image Status Check\n');
  console.log('=' .repeat(60));
  
  const currentMonth = new Date().getMonth() + 1;
  console.log(`📅 Current Month: ${MONTH_NAMES[currentMonth - 1]} (${currentMonth})\n`);
  
  let totalImages = 0;
  let totalCoverage = 0;
  let totalPossible = 0;
  
  for (const produce of PRODUCE_TYPES) {
    console.log(`\n${produce.name} (${produce.slug})`);
    console.log('-'.repeat(40));
    
    let produceImages = 0;
    let produceCoverage = 0;
    
    for (const month of produce.months) {
      const status = await checkImagesForProduce(produce.slug, month);
      const monthName = MONTH_NAMES[month - 1];
      const isCurrentMonth = month === currentMonth;
      const indicator = isCurrentMonth ? '🎯' : '  ';
      
      console.log(`${indicator} ${monthName} (${month}): ${status.count} images`);
      
      if (status.count > 0) {
        produceCoverage++;
        totalCoverage++;
      }
      
      produceImages += status.count;
      totalImages += status.count;
      totalPossible++;
      
      // Show some image details for current month
      if (isCurrentMonth && status.count > 0) {
        status.images.slice(0, 2).forEach((img, i) => {
          console.log(`    ${i + 1}. ${img.alt} (${img.format}, ${img.size} bytes)`);
        });
        if (status.count > 2) {
          console.log(`    ... and ${status.count - 2} more images`);
        }
      }
    }
    
    const coveragePercent = ((produceCoverage / produce.months.length) * 100).toFixed(1);
    console.log(`📊 Coverage: ${produceCoverage}/${produce.months.length} months (${coveragePercent}%)`);
    console.log(`📸 Total Images: ${produceImages}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 OVERALL SUMMARY');
  console.log('='.repeat(60));
  
  const overallCoverage = ((totalCoverage / totalPossible) * 100).toFixed(1);
  console.log(`📊 Total Coverage: ${totalCoverage}/${totalPossible} combinations (${overallCoverage}%)`);
  console.log(`📸 Total Images: ${totalImages}`);
  
  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (overallCoverage < 50) {
    console.log('⚠️  Low coverage detected. Focus on:');
    console.log('   1. Current month images (highest priority)');
    console.log('   2. Peak season months (August, September)');
    console.log('   3. Most popular produce types (apples, tomatoes)');
  } else if (overallCoverage < 80) {
    console.log('✅ Good progress! Next steps:');
    console.log('   1. Fill gaps in off-peak months');
    console.log('   2. Add variety to existing months');
    console.log('   3. Improve image quality where needed');
  } else {
    console.log('🎉 Excellent coverage! Consider:');
    console.log('   1. Adding more variety to each month');
    console.log('   2. Improving image quality');
    console.log('   3. Adding off-season educational content');
  }
  
  // Current month priorities
  console.log(`\n🎯 PRIORITIES FOR ${MONTH_NAMES[currentMonth - 1].toUpperCase()}:`);
  console.log('='.repeat(60));
  
  const currentMonthProduce = PRODUCE_TYPES.filter(p => p.months.includes(currentMonth));
  for (const produce of currentMonthProduce) {
    const status = await checkImagesForProduce(produce.slug, currentMonth);
    const priority = status.count === 0 ? '🔴 URGENT' : 
                   status.count < 3 ? '🟡 NEEDS MORE' : '🟢 GOOD';
    console.log(`${priority} ${produce.name}: ${status.count} images`);
  }
}

// Run the check
checkAllImages().catch(console.error);
