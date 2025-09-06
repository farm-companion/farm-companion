#!/usr/bin/env node

/**
 * Comprehensive Performance Validation Script
 * Runs all performance tests and generates a complete performance report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function runPerformanceValidation() {
  log(`${colors.bright}⚡ Starting Comprehensive Performance Validation${colors.reset}`);
  log(`${colors.cyan}Core Web Vitals and Performance Assessment${colors.reset}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  };
  
  // 1. Performance Testing
  log(`\n${colors.bright}=== 1. Performance Testing ===${colors.reset}`);
  const performanceResult = runCommand('node scripts/test-performance.js', 'Performance testing');
  results.tests.push({
    name: 'Performance Testing',
    success: performanceResult.success,
    category: 'testing',
    severity: 'high'
  });
  
  // 2. Playwright Performance Tests
  log(`\n${colors.bright}=== 2. Playwright Performance Tests ===${colors.reset}`);
  const playwrightResult = runCommand('npx playwright test tests/performance.spec.ts --config=tests/performance.config.ts', 'Playwright performance tests');
  results.tests.push({
    name: 'Playwright Performance Tests',
    success: playwrightResult.success,
    category: 'testing',
    severity: 'high'
  });
  
  // 3. Lighthouse Audit
  log(`\n${colors.bright}=== 3. Lighthouse Audit ===${colors.reset}`);
  const lighthouseResult = runCommand('npx lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./lighthouse-performance-report.json', 'Lighthouse performance audit');
  results.tests.push({
    name: 'Lighthouse Performance Audit',
    success: lighthouseResult.success,
    category: 'audit',
    severity: 'high'
  });
  
  // 4. Bundle Analysis
  log(`\n${colors.bright}=== 4. Bundle Analysis ===${colors.reset}`);
  const bundleResult = runCommand('npm run analyze', 'Bundle analysis');
  results.tests.push({
    name: 'Bundle Analysis',
    success: bundleResult.success,
    category: 'analysis',
    severity: 'medium'
  });
  
  // 5. Core Web Vitals Monitoring
  log(`\n${colors.bright}=== 5. Core Web Vitals Monitoring ===${colors.reset}`);
  const webVitalsResult = runCommand('node scripts/monitor-web-vitals.js report', 'Core Web Vitals monitoring');
  results.tests.push({
    name: 'Core Web Vitals Monitoring',
    success: webVitalsResult.success,
    category: 'monitoring',
    severity: 'high'
  });
  
  // 6. Build Performance Check
  log(`\n${colors.bright}=== 6. Build Performance Check ===${colors.reset}`);
  const buildResult = runCommand('npm run build', 'Build performance check');
  results.tests.push({
    name: 'Build Performance Check',
    success: buildResult.success,
    category: 'build',
    severity: 'medium'
  });
  
  // Calculate summary
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.success).length;
  results.summary.failed = results.tests.filter(t => !t.success).length;
  results.summary.critical = results.tests.filter(t => t.severity === 'high' && !t.success).length;
  results.summary.high = results.tests.filter(t => t.severity === 'high').length;
  results.summary.medium = results.tests.filter(t => t.severity === 'medium').length;
  results.summary.low = results.tests.filter(t => t.severity === 'low').length;
  
  // Generate comprehensive report
  const report = generateComprehensiveReport(results);
  
  // Print summary
  printComprehensiveSummary(report);
  
  return report;
}

function generateComprehensiveReport(results) {
  log(`${colors.bright}Generating comprehensive performance report...${colors.reset}`);
  
  const report = {
    ...results,
    recommendations: [
      'Optimize images using WebP/AVIF formats and proper sizing',
      'Implement lazy loading for images and components',
      'Use code splitting to reduce initial bundle size',
      'Enable compression (gzip/brotli) for all assets',
      'Implement proper caching strategies (CDN, browser cache)',
      'Minimize third-party scripts and defer non-critical ones',
      'Optimize fonts and use font-display: swap',
      'Implement service worker for offline caching',
      'Use CDN for static assets and images',
      'Monitor Core Web Vitals in production continuously',
      'Implement performance budgets in CI/CD',
      'Use performance monitoring tools (Lighthouse CI, WebPageTest)',
      'Optimize database queries and API responses',
      'Implement proper error boundaries and loading states',
      'Use React.memo and useMemo for expensive components'
    ],
    nextSteps: [
      'Review failed tests and address performance issues',
      'Implement performance optimizations based on audit results',
      'Set up continuous performance monitoring',
      'Schedule regular performance reviews',
      'Update performance documentation',
      'Train team on performance best practices'
    ]
  };
  
  // Write comprehensive report to file
  const reportPath = './comprehensive-performance-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Comprehensive performance report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printComprehensiveSummary(report) {
  log(`\n${colors.bright}=== COMPREHENSIVE PERFORMANCE VALIDATION SUMMARY ===${colors.reset}`);
  log(`Timestamp: ${report.timestamp}`);
  log(`Total Tests: ${report.summary.total}`);
  log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  
  log(`\n${colors.bright}Severity Breakdown:${colors.reset}`);
  log(`${colors.red}Critical Issues: ${report.summary.critical}${colors.reset}`);
  log(`${colors.yellow}High Priority: ${report.summary.high}${colors.reset}`);
  log(`${colors.blue}Medium Priority: ${report.summary.medium}${colors.reset}`);
  log(`${colors.cyan}Low Priority: ${report.summary.low}${colors.reset}`);
  
  if (report.summary.failed > 0) {
    log(`\n${colors.red}Failed Tests:${colors.reset}`);
    report.tests.forEach((test, index) => {
      if (!test.success) {
        log(`  ${index + 1}. ${test.name} (${test.severity} priority)`);
      }
    });
  }
  
  const successRate = (report.summary.passed / report.summary.total) * 100;
  log(`\n${colors.bright}Overall Performance Score: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 95) {
    log(`${colors.green}⚡ Excellent performance! Ready for production.${colors.reset}`);
  } else if (successRate >= 85) {
    log(`${colors.yellow}⚠️  Good performance, but address critical issues before production.${colors.reset}`);
  } else if (successRate >= 70) {
    log(`${colors.yellow}⚠️  Performance needs improvement. Do not deploy to production.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Performance is inadequate. Significant improvements required.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Recommendations:${colors.reset}`);
  report.recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`);
  });
  
  if (report.summary.failed > 0) {
    log(`\n${colors.bright}Next Steps:${colors.reset}`);
    report.nextSteps.forEach((step, index) => {
      log(`  ${index + 1}. ${step}`);
    });
  }
}

async function main() {
  try {
    const report = await runPerformanceValidation();
    
    // Exit with appropriate code
    const hasCriticalIssues = report.summary.critical > 0;
    const lowPerformanceScore = (report.summary.passed / report.summary.total) < 0.85;
    
    if (hasCriticalIssues || lowPerformanceScore) {
      log(`\n${colors.red}❌ Performance validation failed. Do not deploy to production.${colors.reset}`);
      process.exit(1);
    } else {
      log(`\n${colors.green}✅ Performance validation passed. Ready for production deployment.${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    log(`${colors.red}❌ Performance validation encountered an error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  runPerformanceValidation,
  generateComprehensiveReport,
  printComprehensiveSummary,
};
