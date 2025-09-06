#!/usr/bin/env node

/**
 * Comprehensive Security Validation Script
 * Runs all security tests and generates a complete security report
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

async function runSecurityValidation() {
  log(`${colors.bright}🔒 Starting Comprehensive Security Validation${colors.reset}`);
  log(`${colors.cyan}Production Security Assessment and Testing${colors.reset}`);
  
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
  
  // 1. Environment Variables Validation
  log(`\n${colors.bright}=== 1. Environment Variables Validation ===${colors.reset}`);
  const envResult = runCommand('node scripts/validate-env.js', 'Environment variables validation');
  results.tests.push({
    name: 'Environment Variables Validation',
    success: envResult.success,
    category: 'configuration',
    severity: 'high'
  });
  
  // 2. Security Testing
  log(`\n${colors.bright}=== 2. Security Testing ===${colors.reset}`);
  const securityResult = runCommand('node scripts/test-security.js', 'Security testing');
  results.tests.push({
    name: 'Security Testing',
    success: securityResult.success,
    category: 'testing',
    severity: 'high'
  });
  
  // 3. Security Audit
  log(`\n${colors.bright}=== 3. Security Audit ===${colors.reset}`);
  const auditResult = runCommand('node scripts/security-audit.js', 'Security audit');
  results.tests.push({
    name: 'Security Audit',
    success: auditResult.success,
    category: 'audit',
    severity: 'high'
  });
  
  // 4. Playwright Security Tests
  log(`\n${colors.bright}=== 4. Playwright Security Tests ===${colors.reset}`);
  const playwrightResult = runCommand('npx playwright test tests/security.spec.ts --config=tests/security.config.ts', 'Playwright security tests');
  results.tests.push({
    name: 'Playwright Security Tests',
    success: playwrightResult.success,
    category: 'testing',
    severity: 'medium'
  });
  
  // 5. Dependency Audit
  log(`\n${colors.bright}=== 5. Dependency Security Audit ===${colors.reset}`);
  const depAuditResult = runCommand('npm audit --audit-level=moderate', 'Dependency security audit');
  results.tests.push({
    name: 'Dependency Security Audit',
    success: depAuditResult.success,
    category: 'dependencies',
    severity: 'high'
  });
  
  // 6. Build Security Check
  log(`\n${colors.bright}=== 6. Build Security Check ===${colors.reset}`);
  const buildResult = runCommand('npm run build', 'Build security check');
  results.tests.push({
    name: 'Build Security Check',
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
  log(`${colors.bright}Generating comprehensive security report...${colors.reset}`);
  
  const report = {
    ...results,
    recommendations: [
      'Ensure all environment variables are properly configured in production',
      'Run security tests regularly in CI/CD pipeline',
      'Keep all dependencies updated to latest secure versions',
      'Implement automated security scanning in development workflow',
      'Regularly review and update security configurations',
      'Monitor for security vulnerabilities and incidents',
      'Implement proper logging and monitoring for security events',
      'Conduct regular security training for development team',
      'Establish incident response procedures',
      'Regularly backup and test disaster recovery procedures'
    ],
    nextSteps: [
      'Review failed tests and address critical issues',
      'Update security configurations based on audit results',
      'Implement missing security measures',
      'Schedule regular security reviews',
      'Update security documentation',
      'Train team on security best practices'
    ]
  };
  
  // Write comprehensive report to file
  const reportPath = './comprehensive-security-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Comprehensive security report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printComprehensiveSummary(report) {
  log(`\n${colors.bright}=== COMPREHENSIVE SECURITY VALIDATION SUMMARY ===${colors.reset}`);
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
  log(`\n${colors.bright}Overall Security Score: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 95) {
    log(`${colors.green}🔒 Excellent security posture! Ready for production.${colors.reset}`);
  } else if (successRate >= 85) {
    log(`${colors.yellow}⚠️  Good security posture, but address critical issues before production.${colors.reset}`);
  } else if (successRate >= 70) {
    log(`${colors.yellow}⚠️  Security posture needs improvement. Do not deploy to production.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Security posture is inadequate. Significant improvements required.${colors.reset}`);
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
    const report = await runSecurityValidation();
    
    // Exit with appropriate code
    const hasCriticalIssues = report.summary.critical > 0;
    const lowSecurityScore = (report.summary.passed / report.summary.total) < 0.85;
    
    if (hasCriticalIssues || lowSecurityScore) {
      log(`\n${colors.red}❌ Security validation failed. Do not deploy to production.${colors.reset}`);
      process.exit(1);
    } else {
      log(`\n${colors.green}✅ Security validation passed. Ready for production deployment.${colors.reset}`);
      process.exit(0);
    }
  } catch (error) {
    log(`${colors.red}❌ Security validation encountered an error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  runSecurityValidation,
  generateComprehensiveReport,
  printComprehensiveSummary,
};
