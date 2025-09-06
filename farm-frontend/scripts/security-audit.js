#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script
 * Production Security Assessment and Vulnerability Scanning
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

// Check for known vulnerable dependencies
function auditDependencies() {
  log(`${colors.bright}Auditing dependencies for vulnerabilities...${colors.reset}`);
  
  const commands = [
    {
      command: 'npm audit --audit-level=moderate',
      description: 'NPM security audit'
    },
    {
      command: 'pnpm audit --audit-level=moderate',
      description: 'PNPM security audit'
    }
  ];
  
  const results = [];
  
  for (const cmd of commands) {
    const result = runCommand(cmd.command, cmd.description);
    results.push({
      tool: cmd.description,
      success: result.success,
      output: result.output,
      error: result.error
    });
  }
  
  return results;
}

// Check for security misconfigurations in code
function auditCodeSecurity() {
  log(`${colors.bright}Auditing code for security issues...${colors.reset}`);
  
  const securityChecks = [
    {
      name: 'Hardcoded secrets',
      command: 'grep -r "password\\|secret\\|key\\|token" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "process.env" | grep -v "//" | grep -v "/*" || true',
      description: 'Check for hardcoded secrets in source code'
    },
    {
      name: 'SQL injection patterns',
      command: 'grep -r "SELECT\\|INSERT\\|UPDATE\\|DELETE" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "//" || true',
      description: 'Check for potential SQL injection patterns'
    },
    {
      name: 'Dangerous eval usage',
      command: 'grep -r "eval\\|Function\\|setTimeout.*string\\|setInterval.*string" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
      description: 'Check for dangerous eval usage'
    },
    {
      name: 'InnerHTML usage',
      command: 'grep -r "innerHTML\\|outerHTML" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
      description: 'Check for potential XSS via innerHTML'
    },
    {
      name: 'Dangerous redirects',
      command: 'grep -r "window.location\\|document.location\\|location.href" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
      description: 'Check for dangerous redirect patterns'
    }
  ];
  
  const results = [];
  
  for (const check of securityChecks) {
    const result = runCommand(check.command, check.description);
    results.push({
      check: check.name,
      success: result.success,
      output: result.output,
      hasIssues: result.success && result.output.trim().length > 0
    });
  }
  
  return results;
}

// Check Next.js security configuration
function auditNextJSConfiguration() {
  log(`${colors.bright}Auditing Next.js security configuration...${colors.reset}`);
  
  const configChecks = [
    {
      name: 'next.config.ts security headers',
      file: 'next.config.ts',
      checks: [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Content-Security-Policy'
      ]
    },
    {
      name: 'middleware.ts security',
      file: 'middleware.ts',
      checks: [
        'security headers',
        'CSRF protection',
        'rate limiting'
      ]
    }
  ];
  
  const results = [];
  
  for (const config of configChecks) {
    if (fs.existsSync(config.file)) {
      const content = fs.readFileSync(config.file, 'utf8');
      const foundChecks = config.checks.filter(check => 
        content.toLowerCase().includes(check.toLowerCase())
      );
      
      results.push({
        file: config.file,
        found: foundChecks,
        missing: config.checks.filter(check => 
          !content.toLowerCase().includes(check.toLowerCase())
        ),
        score: (foundChecks.length / config.checks.length) * 100
      });
    } else {
      results.push({
        file: config.file,
        found: [],
        missing: config.checks,
        score: 0,
        error: 'File not found'
      });
    }
  }
  
  return results;
}

// Check API route security
function auditAPIRoutes() {
  log(`${colors.bright}Auditing API routes for security...${colors.reset}`);
  
  const apiRoutes = [];
  
  // Find all API routes
  function findAPIRoutes(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findAPIRoutes(filePath);
      } else if (file === 'route.ts' || file === 'route.js') {
        apiRoutes.push(filePath);
      }
    }
  }
  
  if (fs.existsSync('src/app/api')) {
    findAPIRoutes('src/app/api');
  }
  
  const results = [];
  
  for (const route of apiRoutes) {
    const content = fs.readFileSync(route, 'utf8');
    const securityChecks = [
      { name: 'Input validation', pattern: /zod|joi|yup|validate/i },
      { name: 'Rate limiting', pattern: /rate.?limit|throttle/i },
      { name: 'CSRF protection', pattern: /csrf|origin|referer/i },
      { name: 'Authentication', pattern: /auth|jwt|session/i },
      { name: 'Error handling', pattern: /try.*catch|error.*handling/i }
    ];
    
    const foundChecks = securityChecks.filter(check => 
      check.pattern.test(content)
    );
    
    results.push({
      route: route.replace(process.cwd(), ''),
      found: foundChecks.map(c => c.name),
      missing: securityChecks.filter(c => 
        !foundChecks.includes(c)
      ).map(c => c.name),
      score: (foundChecks.length / securityChecks.length) * 100
    });
  }
  
  return results;
}

// Check for security headers in production
function auditSecurityHeaders() {
  log(`${colors.bright}Auditing security headers configuration...${colors.reset}`);
  
  const requiredHeaders = [
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Content-Security-Policy',
    'X-XSS-Protection'
  ];
  
  const results = [];
  
  // Check next.config.ts for security headers
  if (fs.existsSync('next.config.ts')) {
    const content = fs.readFileSync('next.config.ts', 'utf8');
    const foundHeaders = requiredHeaders.filter(header => 
      content.includes(header)
    );
    
    results.push({
      file: 'next.config.ts',
      found: foundHeaders,
      missing: requiredHeaders.filter(header => 
        !content.includes(header)
      ),
      score: (foundHeaders.length / requiredHeaders.length) * 100
    });
  }
  
  // Check middleware.ts for security headers
  if (fs.existsSync('middleware.ts')) {
    const content = fs.readFileSync('middleware.ts', 'utf8');
    const foundHeaders = requiredHeaders.filter(header => 
      content.includes(header)
    );
    
    results.push({
      file: 'middleware.ts',
      found: foundHeaders,
      missing: requiredHeaders.filter(header => 
        !content.includes(header)
      ),
      score: (foundHeaders.length / requiredHeaders.length) * 100
    });
  }
  
  return results;
}

// Check for common security vulnerabilities
function auditCommonVulnerabilities() {
  log(`${colors.bright}Checking for common security vulnerabilities...${colors.reset}`);
  
  const vulnerabilityChecks = [
    {
      name: 'Cross-Site Scripting (XSS)',
      patterns: [
        'dangerouslySetInnerHTML',
        'innerHTML',
        'outerHTML',
        'document.write',
        'eval(',
        'Function('
      ],
      severity: 'high'
    },
    {
      name: 'Cross-Site Request Forgery (CSRF)',
      patterns: [
        'fetch(',
        'axios.',
        'XMLHttpRequest',
        '$.ajax'
      ],
      severity: 'medium'
    },
    {
      name: 'Insecure Direct Object References',
      patterns: [
        'req.params.id',
        'req.query.id',
        'req.body.id'
      ],
      severity: 'medium'
    },
    {
      name: 'Information Disclosure',
      patterns: [
        'console.log(',
        'console.error(',
        'console.warn(',
        'process.env'
      ],
      severity: 'low'
    }
  ];
  
  const results = [];
  
  for (const vuln of vulnerabilityChecks) {
    const foundPatterns = [];
    
    for (const pattern of vuln.patterns) {
      const command = `grep -r "${pattern}" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true`;
      const result = runCommand(command, `Checking for ${pattern}`);
      
      if (result.success && result.output.trim()) {
        foundPatterns.push({
          pattern,
          occurrences: result.output.trim().split('\n').length
        });
      }
    }
    
    results.push({
      vulnerability: vuln.name,
      severity: vuln.severity,
      foundPatterns,
      hasIssues: foundPatterns.length > 0
    });
  }
  
  return results;
}

// Generate comprehensive security audit report
function generateSecurityAuditReport(results) {
  log(`${colors.bright}Generating security audit report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalChecks: Object.values(results).flat().length,
      passed: Object.values(results).flat().filter(r => r.success || r.score >= 80).length,
      failed: Object.values(results).flat().filter(r => !r.success && r.score < 80).length,
      criticalIssues: Object.values(results).flat().filter(r => r.severity === 'high' && r.hasIssues).length,
      highIssues: Object.values(results).flat().filter(r => r.severity === 'medium' && r.hasIssues).length,
      lowIssues: Object.values(results).flat().filter(r => r.severity === 'low' && r.hasIssues).length,
    },
    results,
    recommendations: [
      'Update all dependencies to latest secure versions',
      'Implement comprehensive input validation on all API routes',
      'Add rate limiting to prevent abuse',
      'Ensure all security headers are properly configured',
      'Regularly audit code for security vulnerabilities',
      'Implement proper error handling without information disclosure',
      'Use HTTPS in production with proper certificate management',
      'Implement proper authentication and authorization',
      'Regularly review and update security configurations',
      'Monitor for security incidents and implement logging'
    ]
  };
  
  // Write report to file
  const reportPath = './security-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Security audit report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printSummary(report) {
  log(`\n${colors.bright}=== SECURITY AUDIT SUMMARY ===${colors.reset}`);
  log(`Total Checks: ${report.summary.totalChecks}`);
  log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  
  log(`\n${colors.bright}Vulnerability Summary:${colors.reset}`);
  log(`${colors.red}Critical Issues: ${report.summary.criticalIssues}${colors.reset}`);
  log(`${colors.yellow}High Issues: ${report.summary.highIssues}${colors.reset}`);
  log(`${colors.blue}Low Issues: ${report.summary.lowIssues}${colors.reset}`);
  
  if (report.summary.criticalIssues > 0) {
    log(`\n${colors.red}Critical Issues Found:${colors.reset}`);
    Object.values(report.results).flat().forEach(result => {
      if (result.severity === 'high' && result.hasIssues) {
        log(`  - ${result.vulnerability || result.check || 'Unknown'}`);
      }
    });
  }
  
  const successRate = (report.summary.passed / report.summary.totalChecks) * 100;
  log(`\n${colors.bright}Security Score: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 90) {
    log(`${colors.green}🔒 Excellent security posture!${colors.reset}`);
  } else if (successRate >= 80) {
    log(`${colors.yellow}⚠️  Good security posture, but some improvements needed.${colors.reset}`);
  } else if (successRate >= 70) {
    log(`${colors.yellow}⚠️  Security posture needs improvement.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Security posture needs significant improvement.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Recommendations:${colors.reset}`);
  report.recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`);
  });
}

async function main() {
  log(`${colors.bright}🔒 Starting Comprehensive Security Audit${colors.reset}`);
  log(`${colors.cyan}Production Security Assessment${colors.reset}`);
  
  const allResults = {};
  
  // Run security audits
  allResults.dependencies = auditDependencies();
  allResults.codeSecurity = auditCodeSecurity();
  allResults.nextJSConfig = auditNextJSConfiguration();
  allResults.apiRoutes = auditAPIRoutes();
  allResults.securityHeaders = auditSecurityHeaders();
  allResults.vulnerabilities = auditCommonVulnerabilities();
  
  // Generate and print report
  const report = generateSecurityAuditReport(allResults);
  printSummary(report);
  
  // Exit with appropriate code
  const hasCriticalIssues = report.summary.criticalIssues > 0;
  const hasHighIssues = report.summary.highIssues > 0;
  const lowSecurityScore = (report.summary.passed / report.summary.totalChecks) < 0.8;
  
  if (hasCriticalIssues || (hasHighIssues && lowSecurityScore)) {
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
  auditDependencies,
  auditCodeSecurity,
  auditNextJSConfiguration,
  auditAPIRoutes,
  auditSecurityHeaders,
  auditCommonVulnerabilities,
  generateSecurityAuditReport,
};
