#!/usr/bin/env node

/**
 * Comprehensive Performance Testing Script
 * Core Web Vitals, Lighthouse, and Performance Validation
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

function runCommand(command, description) {
  log(`\n${colors.blue}Running: ${description}${colors.reset}`);
  log(`${colors.cyan}Command: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log(`${colors.green}✓ ${description} completed successfully${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}✗ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Performance budgets and thresholds
const PERFORMANCE_BUDGETS = {
  // Core Web Vitals thresholds
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint (ms)
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte (ms)
  
  // Lighthouse scores
  performance: { good: 90, needsImprovement: 50 },
  accessibility: { good: 90, needsImprovement: 50 },
  bestPractices: { good: 90, needsImprovement: 50 },
  seo: { good: 90, needsImprovement: 50 },
  
  // Bundle size limits
  bundleSize: { good: 250000, needsImprovement: 500000 }, // bytes
  imageSize: { good: 100000, needsImprovement: 200000 },  // bytes per image
};

// Test pages to analyze
const TEST_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/map', name: 'Map Page' },
  { url: '/shop', name: 'Shop Directory' },
  { url: '/seasonal', name: 'Seasonal Guide' },
  { url: '/about', name: 'About Page' },
  { url: '/contact', name: 'Contact Page' },
];

// Run Lighthouse performance audit
function runLighthouseAudit(url = 'http://localhost:3000', pageName = 'Homepage') {
  log(`${colors.bright}Running Lighthouse audit for ${pageName}...${colors.reset}`);
  
  const outputFile = `./lighthouse-report-${pageName.toLowerCase().replace(/\s+/g, '-')}.json`;
  const command = `npx lighthouse ${url} --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=${outputFile} --chrome-flags="--headless --no-sandbox"`;
  
  const result = runCommand(command, `Lighthouse audit for ${pageName}`);
  
  if (result.success) {
    try {
      const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      return {
        success: true,
        report,
        scores: {
          performance: report.categories.performance?.score * 100 || 0,
          accessibility: report.categories.accessibility?.score * 100 || 0,
          bestPractices: report.categories['best-practices']?.score * 100 || 0,
          seo: report.categories.seo?.score * 100 || 0,
        },
        metrics: extractCoreWebVitals(report)
      };
    } catch (error) {
      return { success: false, error: 'Failed to parse Lighthouse report' };
    }
  }
  
  return { success: false, error: result.error };
}

// Extract Core Web Vitals from Lighthouse report
function extractCoreWebVitals(report) {
  const audits = report.audits;
  
  return {
    LCP: audits['largest-contentful-paint']?.numericValue || 0,
    FID: audits['max-potential-fid']?.numericValue || 0,
    CLS: audits['cumulative-layout-shift']?.numericValue || 0,
    INP: audits['interactive']?.numericValue || 0,
    FCP: audits['first-contentful-paint']?.numericValue || 0,
    TTFB: audits['server-response-time']?.numericValue || 0,
  };
}

// Test Core Web Vitals
function testCoreWebVitals(metrics) {
  log(`${colors.bright}Testing Core Web Vitals...${colors.reset}`);
  
  const results = [];
  
  for (const [metric, value] of Object.entries(metrics)) {
    const budget = PERFORMANCE_BUDGETS[metric];
    if (!budget) continue;
    
    let status = 'good';
    let message = 'Good';
    
    if (value > budget.needsImprovement) {
      status = 'poor';
      message = 'Poor - needs improvement';
    } else if (value > budget.good) {
      status = 'needs-improvement';
      message = 'Needs improvement';
    }
    
    results.push({
      metric,
      value,
      threshold: budget.good,
      status,
      message
    });
    
    const color = status === 'good' ? colors.green : status === 'needs-improvement' ? colors.yellow : colors.red;
    log(`${color}${metric}: ${value.toFixed(2)}ms (${message})${colors.reset}`);
  }
  
  return results;
}

// Test Lighthouse scores
function testLighthouseScores(scores) {
  log(`${colors.bright}Testing Lighthouse scores...${colors.reset}`);
  
  const results = [];
  
  for (const [category, score] of Object.entries(scores)) {
    const budget = PERFORMANCE_BUDGETS[category];
    if (!budget) continue;
    
    let status = 'good';
    let message = 'Good';
    
    if (score < budget.needsImprovement) {
      status = 'poor';
      message = 'Poor - needs improvement';
    } else if (score < budget.good) {
      status = 'needs-improvement';
      message = 'Needs improvement';
    }
    
    results.push({
      category,
      score,
      threshold: budget.good,
      status,
      message
    });
    
    const color = status === 'good' ? colors.green : status === 'needs-improvement' ? colors.yellow : colors.red;
    log(`${color}${category}: ${score.toFixed(1)}/100 (${message})${colors.reset}`);
  }
  
  return results;
}

// Test bundle size
function testBundleSize() {
  log(`${colors.bright}Testing bundle size...${colors.reset}`);
  
  const buildDir = '.next/static';
  if (!fs.existsSync(buildDir)) {
    return { success: false, error: 'Build directory not found. Run npm run build first.' };
  }
  
  let totalSize = 0;
  const files = [];
  
  function calculateSize(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        calculateSize(itemPath);
      } else if (item.endsWith('.js') || item.endsWith('.css')) {
        const size = stat.size;
        totalSize += size;
        files.push({
          name: itemPath.replace(process.cwd(), ''),
          size,
          sizeKB: (size / 1024).toFixed(2)
        });
      }
    }
  }
  
  calculateSize(buildDir);
  
  const budget = PERFORMANCE_BUDGETS.bundleSize;
  let status = 'good';
  let message = 'Good';
  
  if (totalSize > budget.needsImprovement) {
    status = 'poor';
    message = 'Poor - bundle too large';
  } else if (totalSize > budget.good) {
    status = 'needs-improvement';
    message = 'Needs improvement';
  }
  
  const result = {
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    files: files.sort((a, b) => b.size - a.size),
    status,
    message
  };
  
  const color = status === 'good' ? colors.green : status === 'needs-improvement' ? colors.yellow : colors.red;
  log(`${color}Total bundle size: ${result.totalSizeMB}MB (${message})${colors.reset}`);
  
  return result;
}

// Test image optimization
function testImageOptimization() {
  log(`${colors.bright}Testing image optimization...${colors.reset}`);
  
  const publicDir = 'public';
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'];
  const images = [];
  
  if (!fs.existsSync(publicDir)) {
    return { success: false, error: 'Public directory not found' };
  }
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        scanDirectory(itemPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (imageExtensions.includes(ext)) {
          images.push({
            name: itemPath.replace(process.cwd(), ''),
            size: stat.size,
            sizeKB: (stat.size / 1024).toFixed(2),
            extension: ext
          });
        }
      }
    }
  }
  
  scanDirectory(publicDir);
  
  const budget = PERFORMANCE_BUDGETS.imageSize;
  const results = images.map(img => {
    let status = 'good';
    let message = 'Good';
    
    if (img.size > budget.needsImprovement) {
      status = 'poor';
      message = 'Poor - image too large';
    } else if (img.size > budget.good) {
      status = 'needs-improvement';
      message = 'Needs improvement';
    }
    
    return {
      ...img,
      status,
      message
    };
  });
  
  const largeImages = results.filter(img => img.status !== 'good');
  if (largeImages.length > 0) {
    log(`${colors.yellow}⚠️  Large images found:${colors.reset}`);
    largeImages.forEach(img => {
      log(`${colors.yellow}  - ${img.name}: ${img.sizeKB}KB${colors.reset}`);
    });
  } else {
    log(`${colors.green}✓ All images are optimized${colors.reset}`);
  }
  
  return results;
}

// Test page load performance
function testPageLoadPerformance(url, pageName) {
  log(`${colors.bright}Testing page load performance for ${pageName}...${colors.reset}`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      const result = {
        page: pageName,
        url,
        loadTime,
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers['content-type'],
          'content-length': res.headers['content-length'],
          'cache-control': res.headers['cache-control'],
          'etag': res.headers['etag']
        }
      };
      
      let status = 'good';
      let message = 'Good';
      
      if (loadTime > 3000) {
        status = 'poor';
        message = 'Poor - slow load time';
      } else if (loadTime > 1500) {
        status = 'needs-improvement';
        message = 'Needs improvement';
      }
      
      result.status = status;
      result.message = message;
      
      const color = status === 'good' ? colors.green : status === 'needs-improvement' ? colors.yellow : colors.red;
      log(`${color}${pageName}: ${loadTime}ms (${message})${colors.reset}`);
      
      resolve(result);
    }).on('error', (error) => {
      resolve({
        page: pageName,
        url,
        error: error.message,
        status: 'error'
      });
    });
  });
}

// Generate performance report
function generatePerformanceReport(results) {
  log(`${colors.bright}Generating performance report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
    results,
    budgets: PERFORMANCE_BUDGETS,
    recommendations: [
      'Optimize images using WebP/AVIF formats',
      'Implement lazy loading for images and components',
      'Use code splitting to reduce bundle size',
      'Enable compression (gzip/brotli)',
      'Implement proper caching strategies',
      'Minimize third-party scripts',
      'Optimize fonts and use font-display: swap',
      'Implement service worker for caching',
      'Use CDN for static assets',
      'Monitor Core Web Vitals in production'
    ]
  };
  
  // Write report to file
  const reportPath = './performance-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Performance report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printSummary(report) {
  log(`\n${colors.bright}=== PERFORMANCE TEST SUMMARY ===${colors.reset}`);
  log(`Total Tests: ${report.summary.totalTests}`);
  log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  
  if (report.summary.failed > 0) {
    log(`\n${colors.red}Failed Tests:${colors.reset}`);
    report.results.forEach((test, index) => {
      if (!test.success) {
        log(`  ${index + 1}. ${test.description || test.name || 'Unknown test'}`);
        if (test.error) {
          log(`     Error: ${test.error}`);
        }
      }
    });
  }
  
  const successRate = (report.summary.passed / report.summary.totalTests) * 100;
  log(`\n${colors.bright}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 90) {
    log(`${colors.green}⚡ Excellent performance!${colors.reset}`);
  } else if (successRate >= 80) {
    log(`${colors.yellow}⚠️  Good performance, but some improvements needed.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Performance needs significant improvement.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Recommendations:${colors.reset}`);
  report.recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`);
  });
}

async function main() {
  log(`${colors.bright}⚡ Starting Comprehensive Performance Testing${colors.reset}`);
  log(`${colors.cyan}Core Web Vitals and Performance Validation${colors.reset}`);
  
  const allResults = [];
  
  // Test each page
  for (const page of TEST_PAGES) {
    const url = `http://localhost:3000${page.url}`;
    
    // Run Lighthouse audit
    const lighthouseResult = runLighthouseAudit(url, page.name);
    if (lighthouseResult.success) {
      allResults.push({
        name: `Lighthouse Audit - ${page.name}`,
        success: true,
        scores: lighthouseResult.scores,
        metrics: lighthouseResult.metrics
      });
      
      // Test Core Web Vitals
      const cwvResults = testCoreWebVitals(lighthouseResult.metrics);
      allResults.push({
        name: `Core Web Vitals - ${page.name}`,
        success: cwvResults.every(r => r.status === 'good'),
        results: cwvResults
      });
      
      // Test Lighthouse scores
      const scoreResults = testLighthouseScores(lighthouseResult.scores);
      allResults.push({
        name: `Lighthouse Scores - ${page.name}`,
        success: scoreResults.every(r => r.status === 'good'),
        results: scoreResults
      });
    } else {
      allResults.push({
        name: `Lighthouse Audit - ${page.name}`,
        success: false,
        error: lighthouseResult.error
      });
    }
    
    // Test page load performance
    const loadResult = await testPageLoadPerformance(url, page.name);
    allResults.push({
      name: `Page Load Performance - ${page.name}`,
      success: loadResult.status === 'good',
      result: loadResult
    });
  }
  
  // Test bundle size
  const bundleResult = testBundleSize();
  allResults.push({
    name: 'Bundle Size Test',
    success: bundleResult.status === 'good',
    result: bundleResult
  });
  
  // Test image optimization
  const imageResult = testImageOptimization();
  allResults.push({
    name: 'Image Optimization Test',
    success: Array.isArray(imageResult) ? imageResult.every(img => img.status === 'good') : false,
    result: imageResult
  });
  
  // Generate and print report
  const report = generatePerformanceReport(allResults);
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
  runLighthouseAudit,
  testCoreWebVitals,
  testLighthouseScores,
  testBundleSize,
  testImageOptimization,
  testPageLoadPerformance,
  generatePerformanceReport,
};
