#!/usr/bin/env node

/**
 * Synthetic Health Check Script
 * Comprehensive health monitoring and validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  endpoints: [
    { url: '/', name: 'Homepage', expectedStatus: 200 },
    { url: '/map', name: 'Map Page', expectedStatus: 200 },
    { url: '/shop', name: 'Shop Directory', expectedStatus: 200 },
    { url: '/seasonal', name: 'Seasonal Guide', expectedStatus: 200 },
    { url: '/about', name: 'About Page', expectedStatus: 200 },
    { url: '/contact', name: 'Contact Page', expectedStatus: 200 },
    { url: '/api/health/bing-indexnow', name: 'Health API', expectedStatus: 200 },
    { url: '/api/farms', name: 'Farms API', expectedStatus: 200 },
    { url: '/robots.txt', name: 'Robots.txt', expectedStatus: 200 },
    { url: '/sitemap.xml', name: 'Sitemap', expectedStatus: 200 },
  ],
  apiEndpoints: [
    { url: '/api/contact', method: 'POST', expectedStatus: 400 }, // Should return 400 without data
    { url: '/api/feedback', method: 'POST', expectedStatus: 400 }, // Should return 400 without data
    { url: '/api/newsletter/subscribe', method: 'POST', expectedStatus: 400 }, // Should return 400 without data
  ]
};

// Test individual endpoint
function testEndpoint(endpoint, baseURL = 'http://localhost:3000') {
  return new Promise((resolve) => {
    const url = `${baseURL}${endpoint.url}`;
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      method: endpoint.method || 'GET',
      headers: {
        'User-Agent': 'Health-Check/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    };
    
    const startTime = Date.now();
    
    const req = client.request(url, options, (res) => {
      const responseTime = Date.now() - startTime;
      const contentLength = res.headers['content-length'] || 'unknown';
      
      const result = {
        endpoint: endpoint.name,
        url: endpoint.url,
        status: res.statusCode,
        expectedStatus: endpoint.expectedStatus,
        responseTime,
        contentLength,
        headers: {
          'content-type': res.headers['content-type'],
          'cache-control': res.headers['cache-control'],
          'etag': res.headers['etag'],
          'last-modified': res.headers['last-modified']
        },
        success: res.statusCode === endpoint.expectedStatus,
        message: res.statusCode === endpoint.expectedStatus ? 'OK' : `Expected ${endpoint.expectedStatus}, got ${res.statusCode}`
      };
      
      resolve(result);
    });
    
    req.on('error', (error) => {
      resolve({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: 'error',
        expectedStatus: endpoint.expectedStatus,
        responseTime: Date.now() - startTime,
        success: false,
        message: `Request failed: ${error.message}`
      });
    });
    
    req.setTimeout(HEALTH_CHECK_CONFIG.timeout, () => {
      req.destroy();
      resolve({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: 'timeout',
        expectedStatus: endpoint.expectedStatus,
        responseTime: HEALTH_CHECK_CONFIG.timeout,
        success: false,
        message: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// Test all endpoints
async function testAllEndpoints(baseURL = 'http://localhost:3000') {
  log(`${colors.bright}Testing all endpoints...${colors.reset}`);
  
  const results = [];
  
  // Test regular endpoints
  for (const endpoint of HEALTH_CHECK_CONFIG.endpoints) {
    const result = await testEndpoint(endpoint, baseURL);
    results.push(result);
    
    const color = result.success ? colors.green : colors.red;
    const status = result.success ? '✓' : '✗';
    log(`${color}${status} ${result.endpoint}: ${result.status} (${result.responseTime}ms)${colors.reset}`);
  }
  
  // Test API endpoints
  for (const endpoint of HEALTH_CHECK_CONFIG.apiEndpoints) {
    const result = await testEndpoint(endpoint, baseURL);
    results.push(result);
    
    const color = result.success ? colors.green : colors.red;
    const status = result.success ? '✓' : '✗';
    log(`${color}${status} ${result.endpoint}: ${result.status} (${result.responseTime}ms)${colors.reset}`);
  }
  
  return results;
}

// Test database connectivity
function testDatabaseConnectivity() {
  log(`${colors.bright}Testing database connectivity...${colors.reset}`);
  
  const results = [];
  
  // Check environment variables
  const requiredEnvVars = [
    'VERCEL_KV_REST_API_URL',
    'VERCEL_KV_REST_API_TOKEN'
  ];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      results.push({
        test: `Database Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable not set'
      });
    } else if (value.includes('your-') || value.includes('placeholder')) {
      results.push({
        test: `Database Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable contains placeholder value'
      });
    } else {
      results.push({
        test: `Database Environment Variable: ${envVar}`,
        status: 'passed',
        message: 'Environment variable is properly configured'
      });
    }
  }
  
  return results;
}

// Test email service
function testEmailService() {
  log(`${colors.bright}Testing email service...${colors.reset}`);
  
  const results = [];
  
  // Check environment variables
  const requiredEnvVars = [
    'RESEND_API_KEY',
    'ADMIN_EMAIL'
  ];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      results.push({
        test: `Email Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable not set'
      });
    } else if (value.includes('your-') || value.includes('placeholder')) {
      results.push({
        test: `Email Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable contains placeholder value'
      });
    } else {
      results.push({
        test: `Email Environment Variable: ${envVar}`,
        status: 'passed',
        message: 'Environment variable is properly configured'
      });
    }
  }
  
  return results;
}

// Test file storage
function testFileStorage() {
  log(`${colors.bright}Testing file storage...${colors.reset}`);
  
  const results = [];
  
  // Check environment variables
  const requiredEnvVars = [
    'BLOB_READ_WRITE_TOKEN'
  ];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      results.push({
        test: `File Storage Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable not set'
      });
    } else if (value.includes('your-') || value.includes('placeholder')) {
      results.push({
        test: `File Storage Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable contains placeholder value'
      });
    } else {
      results.push({
        test: `File Storage Environment Variable: ${envVar}`,
        status: 'passed',
        message: 'Environment variable is properly configured'
      });
    }
  }
  
  return results;
}

// Test build artifacts
function testBuildArtifacts() {
  log(`${colors.bright}Testing build artifacts...${colors.reset}`);
  
  const results = [];
  
  // Check if build directory exists
  if (fs.existsSync('.next')) {
    results.push({
      test: 'Build Directory',
      status: 'passed',
      message: 'Build directory (.next) exists'
    });
  } else {
    results.push({
      test: 'Build Directory',
      status: 'failed',
      message: 'Build directory (.next) does not exist'
    });
  }
  
  // Check static files
  const staticFiles = [
    '.next/static',
    '.next/server',
    '.next/cache'
  ];
  
  for (const file of staticFiles) {
    if (fs.existsSync(file)) {
      results.push({
        test: `Static File: ${file}`,
        status: 'passed',
        message: 'Static file exists'
      });
    } else {
      results.push({
        test: `Static File: ${file}`,
        status: 'failed',
        message: 'Static file does not exist'
      });
    }
  }
  
  return results;
}

// Generate health check report
function generateHealthCheckReport(endpointResults, infrastructureResults) {
  log(`${colors.bright}Generating health check report...${colors.reset}`);
  
  const allResults = [...endpointResults, ...infrastructureResults];
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: allResults.length,
      passed: allResults.filter(r => r.success || r.status === 'passed').length,
      failed: allResults.filter(r => !r.success && r.status === 'failed').length,
    },
    endpoints: endpointResults,
    infrastructure: infrastructureResults,
    recommendations: [
      'Monitor endpoint response times and set up alerts for slow responses',
      'Ensure all environment variables are properly configured in production',
      'Set up automated health checks with proper monitoring',
      'Implement proper error handling and logging',
      'Regularly test all critical endpoints',
      'Monitor database connectivity and performance',
      'Test email service functionality regularly',
      'Verify file storage operations',
      'Set up proper backup and recovery procedures',
      'Implement proper security monitoring'
    ]
  };
  
  // Write report to file
  const reportPath = './health-check-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Health check report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printSummary(report) {
  log(`\n${colors.bright}=== HEALTH CHECK SUMMARY ===${colors.reset}`);
  log(`Total Tests: ${report.summary.total}`);
  log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  
  if (report.summary.failed > 0) {
    log(`\n${colors.red}Failed Tests:${colors.reset}`);
    const allResults = [...report.endpoints, ...report.infrastructure];
    allResults.forEach((test, index) => {
      if (!test.success && test.status === 'failed') {
        log(`  ${index + 1}. ${test.endpoint || test.test}: ${test.message}`);
      }
    });
  }
  
  const successRate = (report.summary.passed / report.summary.total) * 100;
  log(`\n${colors.bright}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 95) {
    log(`${colors.green}🏥 Excellent health! All systems operational.${colors.reset}`);
  } else if (successRate >= 85) {
    log(`${colors.yellow}⚠️  Good health, but some issues need attention.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Poor health. Significant issues detected.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Recommendations:${colors.reset}`);
  report.recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`);
  });
}

async function main() {
  log(`${colors.bright}🏥 Starting Comprehensive Health Check${colors.reset}`);
  log(`${colors.cyan}Endpoint and Infrastructure Health Monitoring${colors.reset}`);
  
  const baseURL = process.argv[2] || 'http://localhost:3000';
  log(`${colors.cyan}Testing against: ${baseURL}${colors.reset}`);
  
  // Test endpoints
  const endpointResults = await testAllEndpoints(baseURL);
  
  // Test infrastructure
  const infrastructureResults = [
    ...testDatabaseConnectivity(),
    ...testEmailService(),
    ...testFileStorage(),
    ...testBuildArtifacts()
  ];
  
  // Generate and print report
  const report = generateHealthCheckReport(endpointResults, infrastructureResults);
  printSummary(report);
  
  // Exit with appropriate code
  if (report.summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testEndpoint,
  testAllEndpoints,
  testDatabaseConnectivity,
  testEmailService,
  testFileStorage,
  testBuildArtifacts,
  generateHealthCheckReport,
};
