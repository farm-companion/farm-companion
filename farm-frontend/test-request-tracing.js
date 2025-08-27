#!/usr/bin/env node

/**
 * Test Request Tracing
 * 
 * This script tests the request tracing functionality by:
 * 1. Making requests with and without x-request-id headers
 * 2. Verifying that request IDs are properly propagated
 * 3. Testing error scenarios to ensure request IDs are included
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = process.env.PHOTOS_API_BASE || 'http://localhost:3000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

// Create a test image if it doesn't exist
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('Creating test image...');
    // Create a simple 1x1 pixel JPEG
    const jpegData = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
      0x07, 0xFF, 0xD9
    ]);
    fs.writeFileSync(TEST_IMAGE_PATH, jpegData);
  }
}

// Test 1: Request without x-request-id header
async function testWithoutRequestId() {
  console.log('\n🧪 Test 1: Request without x-request-id header');
  
  try {
    const form = new FormData();
    form.append('farmSlug', 'test-farm');
    form.append('farmName', 'Test Farm');
    form.append('submitterName', 'Test User');
    form.append('submitterEmail', 'test@example.com');
    form.append('description', 'Test photo submission');
    form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form
    });
    
    const requestId = response.headers.get('x-request-id');
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Request ID generated: ${requestId ? 'Yes' : 'No'}`);
    console.log(`✅ Request ID value: ${requestId || 'None'}`);
    
    if (requestId) {
      console.log('✅ Test 1 PASSED: Request ID was generated automatically');
    } else {
      console.log('❌ Test 1 FAILED: No request ID in response');
    }
    
    return requestId;
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    return null;
  }
}

// Test 2: Request with custom x-request-id header
async function testWithCustomRequestId() {
  console.log('\n🧪 Test 2: Request with custom x-request-id header');
  
  try {
    const customRequestId = 'test-request-' + Date.now();
    const form = new FormData();
    form.append('farmSlug', 'test-farm');
    form.append('farmName', 'Test Farm');
    form.append('submitterName', 'Test User');
    form.append('submitterEmail', 'test@example.com');
    form.append('description', 'Test photo submission');
    form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form,
      headers: {
        'x-request-id': customRequestId
      }
    });
    
    const requestId = response.headers.get('x-request-id');
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Custom Request ID sent: ${customRequestId}`);
    console.log(`✅ Request ID returned: ${requestId || 'None'}`);
    
    if (requestId === customRequestId) {
      console.log('✅ Test 2 PASSED: Custom request ID was preserved');
    } else {
      console.log('❌ Test 2 FAILED: Custom request ID was not preserved');
    }
    
    return requestId;
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    return null;
  }
}

// Test 3: Error scenario to test request ID in error responses
async function testErrorScenario() {
  console.log('\n🧪 Test 3: Error scenario (missing required fields)');
  
  try {
    const customRequestId = 'error-test-' + Date.now();
    const form = new FormData();
    // Intentionally missing required fields to trigger validation error
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form,
      headers: {
        'x-request-id': customRequestId
      }
    });
    
    const requestId = response.headers.get('x-request-id');
    const responseText = await response.text();
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Request ID in error response: ${requestId || 'None'}`);
    console.log(`✅ Error response includes request ID: ${responseText.includes(requestId) ? 'Yes' : 'No'}`);
    
    if (requestId === customRequestId) {
      console.log('✅ Test 3 PASSED: Request ID preserved in error response');
    } else {
      console.log('❌ Test 3 FAILED: Request ID not preserved in error response');
    }
    
    return requestId;
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    return null;
  }
}

// Test 4: GET request to test request ID propagation
async function testGetRequest() {
  console.log('\n🧪 Test 4: GET request with request ID');
  
  try {
    const customRequestId = 'get-test-' + Date.now();
    
    const response = await fetch(`${API_BASE}/api/photos?farmSlug=test-farm`, {
      method: 'GET',
      headers: {
        'x-request-id': customRequestId
      }
    });
    
    const requestId = response.headers.get('x-request-id');
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Request ID in GET response: ${requestId || 'None'}`);
    
    if (requestId === customRequestId) {
      console.log('✅ Test 4 PASSED: Request ID preserved in GET response');
    } else {
      console.log('❌ Test 4 FAILED: Request ID not preserved in GET response');
    }
    
    return requestId;
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Request Tracing Tests');
  console.log(`📍 API Base: ${API_BASE}`);
  
  // Create test image
  createTestImage();
  
  // Run tests
  const results = [];
  results.push(await testWithoutRequestId());
  results.push(await testWithCustomRequestId());
  results.push(await testErrorScenario());
  results.push(await testGetRequest());
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passedTests = results.filter(r => r !== null).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Request tracing is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testWithoutRequestId,
  testWithCustomRequestId,
  testErrorScenario,
  testGetRequest,
  runTests
};
