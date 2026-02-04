#!/usr/bin/env node

/**
 * Production Health Check Script
 * Production environment health monitoring and validation
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

// Production health check configuration
const PRODUCTION_CONFIG = {
  timeout: 15000, // 15 seconds for production
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
  ],
  performanceThresholds: {
    maxResponseTime: 3000, // 3 seconds
    maxResponseTimeAPI: 2000, // 2 seconds for API
    minSuccessRate: 95 // 95% success rate
  }
};

// Test individual endpoint with retries
async function testEndpointWithRetries(endpoint, baseURL, retries = PRODUCTION_CONFIG.retries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await testEndpoint(endpoint, baseURL);
      if (result.success) {
        return result;
      }
      
      if (attempt < retries) {
        log(`${colors.yellow}⚠️  Attempt ${attempt} failed for ${endpoint.name}, retrying...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    } catch (error) {
      if (attempt === retries) {
        return {
          endpoint: endpoint.name,
          url: endpoint.url,
          status: 'error',
          expectedStatus: endpoint.expectedStatus,
          success: false,
          message: `All ${retries} attempts failed: ${error.message}`
        };
      }
    }
  }

  // Fallback if all attempts returned non-success without throwing
  return {
    endpoint: endpoint.name,
    url: endpoint.url,
    status: 'error',
    expectedStatus: endpoint.expectedStatus,
    success: false,
    performanceOK: false,
    responseTime: 0,
    message: `All ${retries} attempts failed`
  };
}

// Test individual endpoint
function testEndpoint(endpoint, baseURL) {
  return new Promise((resolve) => {
    const url = `${baseURL}${endpoint.url}`;
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      method: endpoint.method || 'GET',
      headers: {
        'User-Agent': 'Production-Health-Check/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      }
    };
    
    const startTime = Date.now();
    
    const req = client.request(url, options, (res) => {
      const responseTime = Date.now() - startTime;
      const contentLength = res.headers['content-length'] || 'unknown';
      
      // Check performance thresholds
      const maxResponseTime = endpoint.url.startsWith('/api/') ? 
        PRODUCTION_CONFIG.performanceThresholds.maxResponseTimeAPI : 
        PRODUCTION_CONFIG.performanceThresholds.maxResponseTime;
      
      const performanceOK = responseTime <= maxResponseTime;
      
      const result = {
        endpoint: endpoint.name,
        url: endpoint.url,
        status: res.statusCode,
        expectedStatus: endpoint.expectedStatus,
        responseTime,
        contentLength,
        performanceOK,
        headers: {
          'content-type': res.headers['content-type'],
          'cache-control': res.headers['cache-control'],
          'etag': res.headers['etag'],
          'last-modified': res.headers['last-modified'],
          'server': res.headers['server'],
          'x-vercel-cache': res.headers['x-vercel-cache'],
          'x-vercel-id': res.headers['x-vercel-id']
        },
        success: res.statusCode === endpoint.expectedStatus && performanceOK,
        message: res.statusCode === endpoint.expectedStatus ? 
          (performanceOK ? 'OK' : `Slow response: ${responseTime}ms`) : 
          `Expected ${endpoint.expectedStatus}, got ${res.statusCode}`
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
    
    req.setTimeout(PRODUCTION_CONFIG.timeout, () => {
      req.destroy();
      resolve({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: 'timeout',
        expectedStatus: endpoint.expectedStatus,
        responseTime: PRODUCTION_CONFIG.timeout,
        success: false,
        message: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// Test all endpoints
async function testAllEndpoints(baseURL) {
  log(`${colors.bright}Testing all endpoints...${colors.reset}`);
  
  const results = [];
  
  // Test regular endpoints
  for (const endpoint of PRODUCTION_CONFIG.endpoints) {
    const result = await testEndpointWithRetries(endpoint, baseURL);
    results.push(result);
    
    const color = result.success ? colors.green : colors.red;
    const status = result.success ? '✓' : '✗';
    const performance = result.performanceOK ? '' : ' (slow)';
    log(`${color}${status} ${result.endpoint}: ${result.status} (${result.responseTime}ms)${performance}${colors.reset}`);
  }
  
  // Test API endpoints
  for (const endpoint of PRODUCTION_CONFIG.apiEndpoints) {
    const result = await testEndpointWithRetries(endpoint, baseURL);
    results.push(result);
    
    const color = result.success ? colors.green : colors.red;
    const status = result.success ? '✓' : '✗';
    const performance = result.performanceOK ? '' : ' (slow)';
    log(`${color}${status} ${result.endpoint}: ${result.status} (${result.responseTime}ms)${performance}${colors.reset}`);
  }
  
  return results;
}

// Test production environment
function testProductionEnvironment() {
  log(`${colors.bright}Testing production environment...${colors.reset}`);
  
  const results = [];
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    results.push({
      test: 'Node.js Version',
      status: 'passed',
      message: `Node.js version: ${nodeVersion} (compatible)`
    });
  } else {
    results.push({
      test: 'Node.js Version',
      status: 'failed',
      message: `Node.js version: ${nodeVersion} (incompatible, requires 18+)`
    });
  }
  
  // Check environment
  const environment = process.env.NODE_ENV;
  if (environment === 'production') {
    results.push({
      test: 'Environment',
      status: 'passed',
      message: `Environment: ${environment} (production)`
    });
  } else {
    results.push({
      test: 'Environment',
      status: 'failed',
      message: `Environment: ${environment} (not production)`
    });
  }
  
  // Check production environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SITE_URL',
    'VERCEL_KV_REST_API_URL',
    'VERCEL_KV_REST_API_TOKEN',
    'RESEND_API_KEY',
    'ADMIN_EMAIL',
    'BLOB_READ_WRITE_TOKEN',
    'TURNSTILE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      results.push({
        test: `Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable not set'
      });
    } else if (value.includes('your-') || value.includes('placeholder')) {
      results.push({
        test: `Environment Variable: ${envVar}`,
        status: 'failed',
        message: 'Environment variable contains placeholder value'
      });
    } else {
      results.push({
        test: `Environment Variable: ${envVar}`,
        status: 'passed',
        message: 'Environment variable is properly configured'
      });
    }
  }
  
  return results;
}

// Test security headers
async function testSecurityHeaders(baseURL) {
  log(`${colors.bright}Testing security headers...${colors.reset}`);
  
  const results = [];
  
  try {
    const url = `${baseURL}/`;
    const client = url.startsWith('https') ? https : http;
    
    const result = await new Promise((resolve) => {
      const req = client.request(url, { method: 'HEAD' }, (res) => {
        const headers = res.headers;
        
        const securityHeaders = [
          'strict-transport-security',
          'x-frame-options',
          'x-content-type-options',
          'x-xss-protection',
          'referrer-policy',
          'content-security-policy',
          'permissions-policy'
        ];
        
        for (const header of securityHeaders) {
          if (headers[header]) {
            results.push({
              test: `Security Header: ${header}`,
              status: 'passed',
              message: `Header present: ${headers[header]}`
            });
          } else {
            results.push({
              test: `Security Header: ${header}`,
              status: 'failed',
              message: 'Header missing'
            });
          }
        }
        
        resolve(results);
      });
      
      req.on('error', (error) => {
        results.push({
          test: 'Security Headers Test',
          status: 'failed',
          message: `Request failed: ${error.message}`
        });
        resolve(results);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        results.push({
          test: 'Security Headers Test',
          status: 'failed',
          message: 'Request timeout'
        });
        resolve(results);
      });
      
      req.end();
    });
    
  } catch (error) {
    results.push({
      test: 'Security Headers Test',
      status: 'failed',
      message: `Test failed: ${error.message}`
    });
  }
  
  return results;
}

// Test performance metrics
function testPerformanceMetrics(endpointResults) {
  log(`${colors.bright}Testing performance metrics...${colors.reset}`);
  
  const results = [];
  
  // Calculate average response time
  const responseTimes = endpointResults.map(r => r.responseTime).filter(t => typeof t === 'number');
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  if (avgResponseTime <= 2000) {
    results.push({
      test: 'Average Response Time',
      status: 'passed',
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms (good)`
    });
  } else if (avgResponseTime <= 3000) {
    results.push({
      test: 'Average Response Time',
      status: 'warning',
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms (acceptable)`
    });
  } else {
    results.push({
      test: 'Average Response Time',
      status: 'failed',
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms (poor)`
    });
  }
  
  // Calculate success rate
  const successRate = (endpointResults.filter(r => r.success).length / endpointResults.length) * 100;
  
  if (successRate >= PRODUCTION_CONFIG.performanceThresholds.minSuccessRate) {
    results.push({
      test: 'Success Rate',
      status: 'passed',
      message: `Success rate: ${successRate.toFixed(1)}% (good)`
    });
  } else {
    results.push({
      test: 'Success Rate',
      status: 'failed',
      message: `Success rate: ${successRate.toFixed(1)}% (poor)`
    });
  }
  
  // Check for slow endpoints
  const slowEndpoints = endpointResults.filter(r => !r.performanceOK);
  if (slowEndpoints.length === 0) {
    results.push({
      test: 'Slow Endpoints',
      status: 'passed',
      message: 'No slow endpoints detected'
    });
  } else {
    results.push({
      test: 'Slow Endpoints',
      status: 'warning',
      message: `${slowEndpoints.length} slow endpoints detected`
    });
  }
  
  return results;
}

// Generate production health report
function generateProductionHealthReport(endpointResults, environmentResults, securityResults, performanceResults) {
  log(`${colors.bright}Generating production health report...${colors.reset}`);
  
  const allResults = [...endpointResults, ...environmentResults, ...securityResults, ...performanceResults];
  
  const report = {
    timestamp: new Date().toISOString(),
    env: 'production',
    summary: {
      total: allResults.length,
      passed: allResults.filter(r => r.success || r.status === 'passed').length,
      failed: allResults.filter(r => !r.success && r.status === 'failed').length,
      warning: allResults.filter(r => r.status === 'warning').length,
    },
    endpoints: endpointResults,
    environment: environmentResults,
    security: securityResults,
    performance: performanceResults,
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
      'Implement proper security monitoring',
      'Monitor Core Web Vitals in production',
      'Set up performance budgets and alerts',
      'Implement proper caching strategies',
      'Monitor third-party service dependencies',
      'Set up proper incident response procedures'
    ]
  };
  
  // Write report to file
  const reportPath = './production-health-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Production health report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printSummary(report) {
  log(`\n${colors.bright}=== PRODUCTION HEALTH CHECK SUMMARY ===${colors.reset}`);
  log(`Total Tests: ${report.summary.total}`);
  log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.yellow}Warnings: ${report.summary.warning}${colors.reset}`);
  log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  
  if (report.summary.failed > 0) {
    log(`\n${colors.red}Failed Tests:${colors.reset}`);
    const allResults = [...report.endpoints, ...report.environment, ...report.security, ...report.performance];
    allResults.forEach((test, index) => {
      if (!test.success && test.status === 'failed') {
        log(`  ${index + 1}. ${test.endpoint || test.test}: ${test.message}`);
      }
    });
  }
  
  const successRate = (report.summary.passed / report.summary.total) * 100;
  log(`\n${colors.bright}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 95) {
    log(`${colors.green}🏥 Excellent production health! All systems operational.${colors.reset}`);
  } else if (successRate >= 85) {
    log(`${colors.yellow}⚠️  Good production health, but some issues need attention.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Poor production health. Significant issues detected.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Recommendations:${colors.reset}`);
  report.recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`);
  });
}

async function main() {
  log(`${colors.bright}🏥 Starting Production Health Check${colors.reset}`);
  log(`${colors.cyan}Production Environment Health Monitoring${colors.reset}`);
  
  const baseURL = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || 'https://farm-companion.vercel.app';
  log(`${colors.cyan}Testing against: ${baseURL}${colors.reset}`);
  
  // Test endpoints
  const endpointResults = await testAllEndpoints(baseURL);
  
  // Test environment
  const environmentResults = testProductionEnvironment();
  
  // Test security headers
  const securityResults = await testSecurityHeaders(baseURL);
  
  // Test performance metrics
  const performanceResults = testPerformanceMetrics(endpointResults);
  
  // Generate and print report
  const report = generateProductionHealthReport(endpointResults, environmentResults, securityResults, performanceResults);
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
  testEndpointWithRetries,
  testAllEndpoints,
  testProductionEnvironment,
  testSecurityHeaders,
  testPerformanceMetrics,
  generateProductionHealthReport,
};
