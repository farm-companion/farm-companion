#!/usr/bin/env node

/**
 * Test Orphan Blob Cleanup
 * 
 * This script tests the orphan blob cleanup functionality
 * by calling the admin cleanup endpoint.
 */

// Configuration
const API_BASE = process.env.PHOTOS_API_BASE || 'http://localhost:3000';

// Test 1: Dry run cleanup (should not delete anything)
async function testDryRunCleanup() {
  console.log('\n🧪 Test 1: Dry run cleanup (should not delete anything)');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/cleanup?dry-run=true&older-than-hours=2`);
    const result = await response.json();
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body:`, JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success && result.dryRun) {
      console.log('✅ Test 1 PASSED: Dry run cleanup completed successfully');
      return true;
    } else {
      console.log('❌ Test 1 FAILED: Dry run cleanup failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    return false;
  }
}

// Test 2: Dry run with custom older-than-hours
async function testDryRunCustomHours() {
  console.log('\n🧪 Test 2: Dry run with custom older-than-hours (24 hours)');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/cleanup?dry-run=true&older-than-hours=24`);
    const result = await response.json();
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body:`, JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success && result.dryRun && result.olderThanHours === 24) {
      console.log('✅ Test 2 PASSED: Dry run with custom hours completed successfully');
      return true;
    } else {
      console.log('❌ Test 2 FAILED: Dry run with custom hours failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    return false;
  }
}

// Test 3: POST method dry run
async function testPostDryRun() {
  console.log('\n🧪 Test 3: POST method dry run');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dryRun: true,
        olderThanHours: 2
      })
    });
    
    const result = await response.json();
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body:`, JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success && result.dryRun) {
      console.log('✅ Test 3 PASSED: POST method dry run completed successfully');
      return true;
    } else {
      console.log('❌ Test 3 FAILED: POST method dry run failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    return false;
  }
}

// Test 4: Live cleanup (if there are orphan blobs)
async function testLiveCleanup() {
  console.log('\n🧪 Test 4: Live cleanup (if there are orphan blobs)');
  
  try {
    // First, do a dry run to see what would be cleaned up
    const dryRunResponse = await fetch(`${API_BASE}/api/admin/cleanup?dry-run=true&older-than-hours=2`);
    const dryRunResult = await dryRunResponse.json();
    
    if (dryRunResult.orphanBlobs > 0) {
      console.log(`⚠️  Found ${dryRunResult.orphanBlobs} orphan blobs. Running live cleanup...`);
      
      const response = await fetch(`${API_BASE}/api/admin/cleanup?older-than-hours=2`);
      const result = await response.json();
      
      console.log(`✅ Response status: ${response.status}`);
      console.log(`✅ Response body:`, JSON.stringify(result, null, 2));
      
      if (response.status === 200 && result.success && !result.dryRun) {
        console.log('✅ Test 4 PASSED: Live cleanup completed successfully');
        return true;
      } else {
        console.log('❌ Test 4 FAILED: Live cleanup failed');
        return false;
      }
    } else {
      console.log('✅ Test 4 PASSED: No orphan blobs found, no cleanup needed');
      return true;
    }
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    return false;
  }
}

// Test 5: Error handling (invalid parameters)
async function testErrorHandling() {
  console.log('\n🧪 Test 5: Error handling (invalid parameters)');
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/cleanup?older-than-hours=invalid`);
    const result = await response.json();
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body:`, JSON.stringify(result, null, 2));
    
    // Should handle invalid parameters gracefully
    if (response.status === 200 || response.status === 400) {
      console.log('✅ Test 5 PASSED: Error handling works correctly');
      return true;
    } else {
      console.log('❌ Test 5 FAILED: Error handling failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Orphan Blob Cleanup Tests');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log('🎯 Testing orphan blob cleanup functionality');
  
  // Run tests
  const results = [];
  results.push(await testDryRunCleanup());
  results.push(await testDryRunCustomHours());
  results.push(await testPostDryRun());
  results.push(await testLiveCleanup());
  results.push(await testErrorHandling());
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passedTests = results.filter(r => r === true).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Orphan blob cleanup is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the implementation.');
  }
  
  // Usage instructions
  console.log('\n📋 Usage Instructions:');
  console.log('1. Dry run (safe): GET /api/admin/cleanup?dry-run=true');
  console.log('2. Live cleanup: GET /api/admin/cleanup');
  console.log('3. Custom hours: GET /api/admin/cleanup?older-than-hours=24');
  console.log('4. POST method: POST /api/admin/cleanup with JSON body');
  
  // Manual verification
  console.log('\n📋 Manual Verification:');
  console.log('1. Check blob storage for any remaining orphan files');
  console.log('2. Verify that only live blobs remain in storage');
  console.log('3. Confirm cleanup logs in server output');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testDryRunCleanup,
  testDryRunCustomHours,
  testPostDryRun,
  testLiveCleanup,
  testErrorHandling,
  runTests
};
