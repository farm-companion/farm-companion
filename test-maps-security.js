#!/usr/bin/env node
/**
 * Google Maps API Security Test Script
 * 
 * This script tests the three different API keys to ensure they work correctly
 * with their respective restrictions.
 */

const https = require('https');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function testFrontendKey() {
  log('\n🔍 Testing Frontend Key (HTTP Referrer Restricted)', 'blue');
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    log('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set', 'red');
    return false;
  }
  
  try {
    // Test Maps JavaScript API loading
    const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      log('✅ Frontend key works for Maps JavaScript API', 'green');
      return true;
    } else {
      log(`❌ Frontend key failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend key test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBackendKey() {
  log('\n🔍 Testing Backend Key (IP Restricted)', 'blue');
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    log('❌ GOOGLE_MAPS_API_KEY not set', 'red');
    return false;
  }
  
  try {
    // Test Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${apiKey}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'OK') {
        log('✅ Backend key works for Geocoding API', 'green');
        return true;
      } else {
        log(`❌ Backend key failed: ${data.status}`, 'red');
        return false;
      }
    } else {
      log(`❌ Backend key failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend key test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testPlacesKey() {
  log('\n🔍 Testing Places Key (IP Restricted)', 'blue');
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    log('❌ GOOGLE_PLACES_API_KEY not set', 'red');
    return false;
  }
  
  try {
    // Test Places API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=51.5074,-0.1278&radius=1000&type=restaurant&key=${apiKey}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'OK') {
        log('✅ Places key works for Places API', 'green');
        return true;
      } else {
        log(`❌ Places key failed: ${data.status}`, 'red');
        return false;
      }
    } else {
      log(`❌ Places key failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Places key test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testApiTestingKey() {
  log('\n🔍 Testing API Testing Key (IP Restricted)', 'blue');
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_TESTING;
  if (!apiKey) {
    log('❌ GOOGLE_MAPS_API_KEY_TESTING not set', 'red');
    return false;
  }
  
  try {
    // Test Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Manchester&key=${apiKey}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.status === 'OK') {
        log('✅ API Testing key works for Geocoding API', 'green');
        return true;
      } else {
        log(`❌ API Testing key failed: ${data.status}`, 'red');
        return false;
      }
    } else {
      log(`❌ API Testing key failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ API Testing key test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testLocalServer() {
  log('\n🔍 Testing Local Development Server', 'blue');
  
  try {
    // Check if development server is running
    const response = await makeRequest('http://localhost:3000/api/test-maps');
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.success) {
        log('✅ Local development server API test endpoint works', 'green');
        return true;
      } else {
        log(`❌ Local API test failed: ${data.error}`, 'red');
        return false;
      }
    } else {
      log(`❌ Local server not running or API test failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Local server test failed: ${error.message}`, 'red');
    log('💡 Make sure to run "npm run dev" in the farm-frontend directory', 'yellow');
    return false;
  }
}

async function main() {
  log('🚀 Google Maps API Security Test', 'bold');
  log('================================', 'bold');
  
  // Check environment variables
  log('\n📋 Environment Variables Check:', 'blue');
  const envVars = [
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'GOOGLE_MAPS_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_MAPS_API_KEY_TESTING'
  ];
  
  let allEnvVarsSet = true;
  envVars.forEach(envVar => {
    if (process.env[envVar]) {
      log(`✅ ${envVar} is set`, 'green');
    } else {
      log(`❌ ${envVar} is not set`, 'red');
      allEnvVarsSet = false;
    }
  });
  
  if (!allEnvVarsSet) {
    log('\n⚠️  Some environment variables are missing. Please set them before testing.', 'yellow');
    return;
  }
  
  // Run tests
  const results = await Promise.all([
    testFrontendKey(),
    testBackendKey(),
    testPlacesKey(),
    testApiTestingKey(),
    testLocalServer()
  ]);
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  log('\n📊 Test Results:', 'blue');
  log(`✅ Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All tests passed! Your Google Maps API security is properly configured.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the configuration and try again.', 'yellow');
  }
  
  log('\n📝 Next Steps:', 'blue');
  log('1. If all tests pass, you can safely remove the old unrestricted key', 'reset');
  log('2. Monitor usage in Google Cloud Console', 'reset');
  log('3. Set up billing alerts to prevent unexpected charges', 'reset');
}

// Run the test
main().catch(console.error);
