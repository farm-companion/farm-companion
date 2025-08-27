#!/usr/bin/env node

/**
 * Test script for multipart upload functionality
 * This script tests the photo submission API with multipart form data
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Create a test image file (1x1 pixel PNG)
const createTestImage = () => {
  // Minimal PNG file (1x1 pixel, transparent)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, // bit depth
    0x06, // color type (RGBA)
    0x00, // compression
    0x00, // filter
    0x00, // interlace
    0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0xE5, 0x90, 0x27, 0xFE, // IDAT CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  
  return pngBuffer;
};

const testMultipartUpload = async () => {
  console.log('🧪 Testing multipart upload functionality...\n');
  
  try {
    // Create test image
    const testImageBuffer = createTestImage();
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    console.log('✅ Created test image file');
    
    // Create FormData
    const formData = new FormData();
    formData.append('farmSlug', 'test-farm');
    formData.append('farmName', 'Test Farm');
    formData.append('submitterName', 'Test User');
    formData.append('submitterEmail', 'test@example.com');
    formData.append('description', 'Test photo submission');
    formData.append('file', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    console.log('✅ Created FormData with test data');
    console.log('📊 FormData size:', formData.getLengthSync(), 'bytes');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/photos', {
      method: 'POST',
      body: formData
      // ✅ Don't set Content-Type manually - let the browser set it with boundary
    });
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📡 API Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Multipart upload test PASSED!');
      console.log('🎉 The API successfully processed the multipart form data');
    } else {
      console.log('\n❌ Multipart upload test FAILED!');
      console.log('💡 This might be expected if the farm-photos service is not running');
    }
    
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test files');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('💡 Make sure the development server is running on port 3000');
    console.log('💡 Run: npm run dev');
  }
};

// Run the test
testMultipartUpload();
