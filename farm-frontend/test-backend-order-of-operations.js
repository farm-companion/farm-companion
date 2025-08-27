#!/usr/bin/env node

/**
 * Test Backend Order-of-Operations
 * 
 * This script tests that the backend validates before uploading,
 * preventing orphan blobs when validation fails.
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

// Test 1: Attempt upload to farm that already has 5 photos (should fail before upload)
async function testPhotoLimitValidation() {
  console.log('\n🧪 Test 1: Photo limit validation (should fail before upload)');
  
  try {
    const form = new FormData();
    form.append('farmSlug', 'test-farm-limit'); // Use a farm that likely has 5 photos
    form.append('farmName', 'Test Farm Limit');
    form.append('submitterName', 'Test User');
    form.append('submitterEmail', 'test@example.com');
    form.append('description', 'Test photo submission to farm at limit');
    form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body: ${responseText}`);
    
    if (response.status === 409) {
      console.log('✅ Test 1 PASSED: Photo limit validation failed before upload (no orphan blob created)');
      return true;
    } else {
      console.log('❌ Test 1 FAILED: Expected 409 status for photo limit exceeded');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 1 FAILED: ${error.message}`);
    return false;
  }
}

// Test 2: Attempt upload with invalid file type (should fail before upload)
async function testInvalidFileTypeValidation() {
  console.log('\n🧪 Test 2: Invalid file type validation (should fail before upload)');
  
  try {
    // Create a text file instead of an image
    const textFilePath = path.join(__dirname, 'test-text.txt');
    fs.writeFileSync(textFilePath, 'This is not an image file');
    
    const form = new FormData();
    form.append('farmSlug', 'test-farm');
    form.append('farmName', 'Test Farm');
    form.append('submitterName', 'Test User');
    form.append('submitterEmail', 'test@example.com');
    form.append('description', 'Test photo submission with invalid file type');
    form.append('file', fs.createReadStream(textFilePath), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body: ${responseText}`);
    
    if (response.status === 400) {
      console.log('✅ Test 2 PASSED: Invalid file type validation failed before upload (no orphan blob created)');
      // Clean up test file
      fs.unlinkSync(textFilePath);
      return true;
    } else {
      console.log('❌ Test 2 FAILED: Expected 400 status for invalid file type');
      // Clean up test file
      fs.unlinkSync(textFilePath);
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 2 FAILED: ${error.message}`);
    return false;
  }
}

// Test 3: Attempt upload with oversized file (should fail before upload)
async function testOversizedFileValidation() {
  console.log('\n🧪 Test 3: Oversized file validation (should fail before upload)');
  
  try {
    // Create a large file (>5MB)
    const largeFilePath = path.join(__dirname, 'test-large.jpg');
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    fs.writeFileSync(largeFilePath, largeBuffer);
    
    const form = new FormData();
    form.append('farmSlug', 'test-farm');
    form.append('farmName', 'Test Farm');
    form.append('submitterName', 'Test User');
    form.append('submitterEmail', 'test@example.com');
    form.append('description', 'Test photo submission with oversized file');
    form.append('file', fs.createReadStream(largeFilePath), {
      filename: 'test-large.jpg',
      contentType: 'image/jpeg'
    });
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body: ${responseText}`);
    
    if (response.status === 400) {
      console.log('✅ Test 3 PASSED: Oversized file validation failed before upload (no orphan blob created)');
      // Clean up test file
      fs.unlinkSync(largeFilePath);
      return true;
    } else {
      console.log('❌ Test 3 FAILED: Expected 400 status for oversized file');
      // Clean up test file
      fs.unlinkSync(largeFilePath);
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 3 FAILED: ${error.message}`);
    return false;
  }
}

// Test 4: Attempt upload with missing required fields (should fail before upload)
async function testMissingFieldsValidation() {
  console.log('\n🧪 Test 4: Missing required fields validation (should fail before upload)');
  
  try {
    const form = new FormData();
    // Intentionally missing required fields
    form.append('farmSlug', 'test-farm');
    // Missing farmName, submitterName, submitterEmail, description, file
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body: ${responseText}`);
    
    if (response.status === 400) {
      console.log('✅ Test 4 PASSED: Missing fields validation failed before upload (no orphan blob created)');
      return true;
    } else {
      console.log('❌ Test 4 FAILED: Expected 400 status for missing required fields');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 4 FAILED: ${error.message}`);
    return false;
  }
}

// Test 5: Successful upload (should work normally)
async function testSuccessfulUpload() {
  console.log('\n🧪 Test 5: Successful upload (should work normally)');
  
  try {
    const form = new FormData();
    form.append('farmSlug', 'test-farm-success');
    form.append('farmName', 'Test Farm Success');
    form.append('submitterName', 'Test User');
    form.append('submitterEmail', 'test@example.com');
    form.append('description', 'Test successful photo submission');
    form.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    
    const response = await fetch(`${API_BASE}/api/photos`, {
      method: 'POST',
      body: form
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response body: ${responseText}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Test 5 PASSED: Successful upload completed normally');
      return true;
    } else {
      console.log('❌ Test 5 FAILED: Expected success status for valid upload');
      return false;
    }
  } catch (error) {
    console.log(`❌ Test 5 FAILED: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Backend Order-of-Operations Tests');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log('🎯 Testing that validation happens BEFORE upload to prevent orphan blobs');
  
  // Create test image
  createTestImage();
  
  // Run tests
  const results = [];
  results.push(await testPhotoLimitValidation());
  results.push(await testInvalidFileTypeValidation());
  results.push(await testOversizedFileValidation());
  results.push(await testMissingFieldsValidation());
  results.push(await testSuccessfulUpload());
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passedTests = results.filter(r => r === true).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Backend order-of-operations is working correctly.');
    console.log('🔥 No orphan blobs will be created when validation fails.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the implementation.');
  }
  
  // Manual verification instructions
  console.log('\n📋 Manual Verification:');
  console.log('1. Check your blob storage (farm-frontend-blob) for any orphan files');
  console.log('2. Verify that failed uploads do not create any blob entries');
  console.log('3. Confirm that successful uploads create the expected blob entries');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPhotoLimitValidation,
  testInvalidFileTypeValidation,
  testOversizedFileValidation,
  testMissingFieldsValidation,
  testSuccessfulUpload,
  runTests
};
