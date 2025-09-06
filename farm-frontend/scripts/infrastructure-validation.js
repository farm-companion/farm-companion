#!/usr/bin/env node

/**
 * Comprehensive Infrastructure Validation Script
 * Runs all infrastructure tests and generates a complete infrastructure report
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

async function runInfrastructureValidation() {
  log(`${colors.bright}🏗️  Starting Comprehensive Infrastructure Validation${colors.reset}`);
  log(`${colors.cyan}Database, Email, Storage, and Infrastructure Assessment${colors.reset}`);
  
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
  
  // 1. Infrastructure Testing
  log(`\n${colors.bright}=== 1. Infrastructure Testing ===${colors.reset}`);
  const infrastructureResult = runCommand('node scripts/test-infrastructure.js', 'Infrastructure testing');
  results.tests.push({
    name: 'Infrastructure Testing',
    success: infrastructureResult.success,
    category: 'testing',
    severity: 'high'
  });
  
  // 2. Health Check
  log(`\n${colors.bright}=== 2. Health Check ===${colors.reset}`);
  const healthResult = runCommand('node scripts/synthetic-health-check.js', 'Health check');
  results.tests.push({
    name: 'Health Check',
    success: healthResult.success,
    category: 'health',
    severity: 'high'
  });
  
  // 3. Production Health Check
  log(`\n${colors.bright}=== 3. Production Health Check ===${colors.reset}`);
  const prodHealthResult = runCommand('node scripts/production-health-check.js', 'Production health check');
  results.tests.push({
    name: 'Production Health Check',
    success: prodHealthResult.success,
    category: 'health',
    severity: 'high'
  });
  
  // 4. Environment Validation
  log(`\n${colors.bright}=== 4. Environment Validation ===${colors.reset}`);
  const envResult = runCommand('node scripts/validate-env.js', 'Environment validation');
  results.tests.push({
    name: 'Environment Validation',
    success: envResult.success,
    category: 'environment',
    severity: 'critical'
  });
  
  // 5. Build Process Test
  log(`\n${colors.bright}=== 5. Build Process Test ===${colors.reset}`);
  const buildResult = runCommand('npm run build', 'Build process test');
  results.tests.push({
    name: 'Build Process Test',
    success: buildResult.success,
    category: 'build',
    severity: 'high'
  });
  
  // 6. Security Validation
  log(`\n${colors.bright}=== 6. Security Validation ===${colors.reset}`);
  const securityResult = runCommand('node scripts/test-security.js', 'Security validation');
  results.tests.push({
    name: 'Security Validation',
    success: securityResult.success,
    category: 'security',
    severity: 'critical'
  });
  
  // 7. Performance Validation
  log(`\n${colors.bright}=== 7. Performance Validation ===${colors.reset}`);
  const performanceResult = runCommand('node scripts/test-performance.js', 'Performance validation');
  results.tests.push({
    name: 'Performance Validation',
    success: performanceResult.success,
    category: 'performance',
    severity: 'high'
  });
  
  // 8. Accessibility Validation
  log(`\n${colors.bright}=== 8. Accessibility Validation ===${colors.reset}`);
  const accessibilityResult = runCommand('node scripts/test-accessibility.js', 'Accessibility validation');
  results.tests.push({
    name: 'Accessibility Validation',
    success: accessibilityResult.success,
    category: 'accessibility',
    severity: 'high'
  });
  
  // Calculate summary
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.success).length;
  results.summary.failed = results.tests.filter(t => !t.success).length;
  results.summary.critical = results.tests.filter(t => t.severity === 'critical' && !t.success).length;
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
  log(`${colors.bright}Generating comprehensive infrastructure report...${colors.reset}`);
  
  const report = {
    ...results,
    recommendations: [
      'Ensure all environment variables are set in production',
      'Test database connectivity in production environment',
      'Verify email service is working with real emails',
      'Test file upload and storage functionality',
      'Monitor API endpoint performance and availability',
      'Set up proper domain configuration with HTTPS',
      'Configure security services (Turnstile, etc.)',
      'Implement proper monitoring and alerting',
      'Set up backup and disaster recovery procedures',
      'Regularly test infrastructure components',
      'Monitor Core Web Vitals in production',
      'Set up performance budgets and alerts',
      'Implement proper caching strategies',
      'Monitor third-party service dependencies',
      'Set up proper incident response procedures',
      'Implement proper error handling and logging',
      'Set up automated health checks with proper monitoring',
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
    ],
    nextSteps: [
      'Review failed tests and address infrastructure issues',
      'Implement infrastructure optimizations based on audit results',
      'Set up continuous infrastructure monitoring',
      'Schedule regular infrastructure reviews',
      'Update infrastructure documentation',
      'Train team on infrastructure best practices',
      'Set up proper monitoring and alerting',
      'Implement proper backup and recovery procedures',
      'Set up proper incident response procedures',
      'Regularly test infrastructure components'
    ]
  };
  
  // Write comprehensive report to file
  const reportPath = './comprehensive-infrastructure-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Comprehensive infrastructure report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printComprehensiveSummary(report) {
  log(`\n${colors.bright}=== COMPREHENSIVE INFRASTRUCTURE VALIDATION SUMMARY ===${colors.reset}`);
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
  log(`\n${colors.bright}Overall Infrastructure Score: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 95) {
    log(`${colors.green}🏗️  Excellent infrastructure! Ready for production.${colors.reset}`);
  } else if (successRate >= 85) {
    log(`${colors.yellow}⚠️  Good infrastructure, but address critical issues before production.${colors.reset}`);
  } else if (successRate >= 70) {
    log(`${colors.yellow}⚠️  Infrastructure needs improvement. Do not deploy to production.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Infrastructure is inadequate. Significant improvements required.${colors.reset}`);
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
    const report = await runInfrastructureValidation();
    
    // Exit with appropriate code
    const hasCriticalIssues = report.summary.critical > 0;
    const lowInfrastructureScore = (report.summary.passed / report.summary.total) < 0.85;
    
    if (hasCriticalIssues || lowInfrastructureScore) {
      log(`\n${colors.red}❌ Infrastructure validation failed. Do not deploy to production.${colors.reset}`);
      process.exit(1);
    } else {
      log(`\n${colors.green}✅ Infrastructure validation passed. Ready for production deployment.${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    log(`${colors.red}❌ Infrastructure validation encountered an error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  runInfrastructureValidation,
  generateComprehensiveReport,
  printComprehensiveSummary,
};
