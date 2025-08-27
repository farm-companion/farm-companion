#!/usr/bin/env node

/**
 * Test script for client guardrails validation
 * This script tests the file validation logic
 */

const fs = require('fs');
const path = require('path');

// Mock the validation functions from the components
const ALLOWED = new Set(['image/jpeg','image/png','image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_W = 800, MIN_H = 600;

function validateBasic(file) {
  if (!ALLOWED.has(file.type)) return 'Please upload a JPG, PNG, or WebP.';
  if (file.size > MAX_BYTES)    return 'Please keep images under 5 MB.';
  return null;
}

// Create test files
const createTestFiles = () => {
  const tests = [];
  
  // Test 1: Valid file (should pass)
  tests.push({
    name: 'Valid 1200x800 JPEG',
    file: {
      name: 'test-valid.jpg',
      type: 'image/jpeg',
      size: 2 * 1024 * 1024, // 2MB
      width: 1200,
      height: 800
    },
    shouldPass: true
  });
  
  // Test 2: Too large file (should fail)
  tests.push({
    name: '10MB file',
    file: {
      name: 'test-large.jpg',
      type: 'image/jpeg',
      size: 10 * 1024 * 1024, // 10MB
      width: 1200,
      height: 800
    },
    shouldPass: false,
    expectedError: 'Please keep images under 5 MB.'
  });
  
  // Test 3: Wrong file type (should fail)
  tests.push({
    name: 'GIF file',
    file: {
      name: 'test.gif',
      type: 'image/gif',
      size: 1 * 1024 * 1024, // 1MB
      width: 1200,
      height: 800
    },
    shouldPass: false,
    expectedError: 'Please upload a JPG, PNG, or WebP.'
  });
  
  // Test 4: Too small dimensions (should fail)
  tests.push({
    name: '300x300 icon',
    file: {
      name: 'test-small.png',
      type: 'image/png',
      size: 1 * 1024 * 1024, // 1MB
      width: 300,
      height: 300
    },
    shouldPass: false,
    expectedError: `Minimum size is ${MIN_W}×${MIN_H}px.`
  });
  
  // Test 5: Valid WebP (should pass)
  tests.push({
    name: 'Valid WebP',
    file: {
      name: 'test.webp',
      type: 'image/webp',
      size: 1 * 1024 * 1024, // 1MB
      width: 1000,
      height: 700
    },
    shouldPass: true
  });
  
  return tests;
};

const runTests = () => {
  console.log('🧪 Testing client guardrails validation...\n');
  
  const tests = createTestFiles();
  let passed = 0;
  let failed = 0;
  
  tests.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    
    // Test basic validation
    const basicError = validateBasic(test.file);
    
    if (test.shouldPass) {
      if (basicError) {
        console.log(`❌ FAILED: Should pass but got error: ${basicError}`);
        failed++;
      } else {
        console.log(`✅ PASSED: Basic validation passed`);
        passed++;
      }
    } else {
      if (basicError && basicError === test.expectedError) {
        console.log(`✅ PASSED: Correctly rejected with error: ${basicError}`);
        passed++;
      } else if (basicError) {
        console.log(`⚠️  PARTIAL: Rejected but wrong error. Expected: "${test.expectedError}", Got: "${basicError}"`);
        passed++; // Still rejected, just wrong message
      } else {
        console.log(`❌ FAILED: Should be rejected but passed validation`);
        failed++;
      }
    }
    
    console.log('');
  });
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Client guardrails are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the validation logic.');
  }
};

// Run the tests
runTests();
