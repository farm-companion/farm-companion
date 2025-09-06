#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Ensures all required environment variables are properly configured
 */

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

// Required environment variables for production
const REQUIRED_ENV_VARS = {
  // Email service
  'RESEND_API_KEY': {
    description: 'Resend email service API key',
    pattern: /^re_[a-zA-Z0-9]{20,}$/,
    example: 're_1234567890abcdef1234567890abcdef',
    required: true
  },
  
  // Admin credentials
  'ADMIN_EMAIL': {
    description: 'Admin email address',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    example: 'admin@farmcompanion.co.uk',
    required: true
  },
  'ADMIN_PASSWORD': {
    description: 'Admin password (should be strong)',
    pattern: /^.{8,}$/,
    example: 'StrongPassword123!',
    required: true,
    sensitive: true
  },
  
  // Database (Vercel KV)
  'VERCEL_KV_REST_API_URL': {
    description: 'Vercel KV REST API URL',
    pattern: /^https:\/\/[a-zA-Z0-9-]+\.upstash\.io$/,
    example: 'https://farm-companion-12345.upstash.io',
    required: true
  },
  'VERCEL_KV_REST_API_TOKEN': {
    description: 'Vercel KV REST API token',
    pattern: /^[a-zA-Z0-9+/=]{20,}$/,
    example: 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
    required: true,
    sensitive: true
  },
  
  // File storage (Vercel Blob)
  'BLOB_READ_WRITE_TOKEN': {
    description: 'Vercel Blob read/write token',
    pattern: /^vercel_blob_rw_[a-zA-Z0-9+/=]{20,}$/,
    example: 'vercel_blob_rw_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
    required: true,
    sensitive: true
  },
  
  // Security (Cloudflare Turnstile)
  'TURNSTILE_SECRET_KEY': {
    description: 'Cloudflare Turnstile secret key',
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: '0x4AAAAAAABkMYinukE8nzY',
    required: true,
    sensitive: true
  },
  
  // Optional but recommended
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY': {
    description: 'Cloudflare Turnstile site key (public)',
    pattern: /^[a-zA-Z0-9_-]{20,}$/,
    example: '0x4AAAAAAABkMYinukE8nzY',
    required: false
  },
  
  // Analytics (optional)
  'NEXT_PUBLIC_GA_ID': {
    description: 'Google Analytics ID (optional)',
    pattern: /^G-[A-Z0-9]{10}$/,
    example: 'G-1234567890',
    required: false
  },
  
  // Development
  'NODE_ENV': {
    description: 'Node environment',
    pattern: /^(development|production|test)$/,
    example: 'production',
    required: true
  },
  
  // Site configuration
  'NEXT_PUBLIC_SITE_URL': {
    description: 'Public site URL',
    pattern: /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    example: 'https://www.farmcompanion.co.uk',
    required: true
  }
};

// Environment-specific requirements
const ENVIRONMENT_REQUIREMENTS = {
  production: {
    requiredVars: [
      'RESEND_API_KEY',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD',
      'VERCEL_KV_REST_API_URL',
      'VERCEL_KV_REST_API_TOKEN',
      'BLOB_READ_WRITE_TOKEN',
      'TURNSTILE_SECRET_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'NODE_ENV'
    ],
    forbiddenValues: ['your-', 'placeholder', 'example', 'test-', 'dev-'],
    minPasswordLength: 12
  },
  development: {
    requiredVars: [
      'NODE_ENV',
      'NEXT_PUBLIC_SITE_URL'
    ],
    forbiddenValues: [],
    minPasswordLength: 8
  },
  test: {
    requiredVars: [
      'NODE_ENV'
    ],
    forbiddenValues: [],
    minPasswordLength: 8
  }
};

function validateEnvironmentVariable(name, value, config) {
  const issues = [];
  
  // Check if required
  if (config.required && !value) {
    issues.push('Required environment variable is missing');
    return { valid: false, issues };
  }
  
  // Skip validation if not required and not set
  if (!config.required && !value) {
    return { valid: true, issues: [] };
  }
  
  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    issues.push(`Value does not match expected pattern. Example: ${config.example}`);
  }
  
  // Check for placeholder values
  const forbiddenValues = ENVIRONMENT_REQUIREMENTS[process.env.NODE_ENV]?.forbiddenValues || [];
  for (const forbidden of forbiddenValues) {
    if (value.includes(forbidden)) {
      issues.push(`Contains placeholder value: ${forbidden}`);
    }
  }
  
  // Special validation for passwords
  if (name === 'ADMIN_PASSWORD') {
    const minLength = ENVIRONMENT_REQUIREMENTS[process.env.NODE_ENV]?.minPasswordLength || 8;
    if (value.length < minLength) {
      issues.push(`Password must be at least ${minLength} characters long`);
    }
    
    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein'];
    if (weakPasswords.some(weak => value.toLowerCase().includes(weak))) {
      issues.push('Password appears to be weak or common');
    }
  }
  
  // Special validation for URLs
  if (name.includes('URL') && value) {
    try {
      new URL(value);
    } catch (error) {
      issues.push('Invalid URL format');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function checkEnvironmentFile() {
  log(`${colors.bright}Checking environment files...${colors.reset}`);
  
  const envFiles = ['.env.local', '.env.production', '.env.development', '.env'];
  const foundFiles = [];
  
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      foundFiles.push(file);
      log(`${colors.green}✓ Found ${file}${colors.reset}`);
    }
  }
  
  if (foundFiles.length === 0) {
    log(`${colors.yellow}⚠️  No environment files found${colors.reset}`);
    log(`${colors.cyan}Consider creating .env.local for development${colors.reset}`);
  }
  
  return foundFiles;
}

function validateAllEnvironmentVariables() {
  log(`${colors.bright}Validating environment variables...${colors.reset}`);
  
  const results = [];
  const environment = process.env.NODE_ENV || 'development';
  const requirements = ENVIRONMENT_REQUIREMENTS[environment];
  
  log(`${colors.cyan}Environment: ${environment}${colors.reset}`);
  
  for (const [name, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[name];
    const isRequired = requirements?.requiredVars.includes(name) || config.required;
    
    log(`\n${colors.blue}Checking ${name}${colors.reset}`);
    log(`${colors.cyan}Description: ${config.description}${colors.reset}`);
    
    if (config.sensitive && value) {
      log(`${colors.cyan}Value: ${'*'.repeat(Math.min(value.length, 8))}${colors.reset}`);
    } else if (value) {
      log(`${colors.cyan}Value: ${value}${colors.reset}`);
    } else {
      log(`${colors.cyan}Value: (not set)${colors.reset}`);
    }
    
    const validation = validateEnvironmentVariable(name, value, { ...config, required: isRequired });
    
    if (validation.valid) {
      log(`${colors.green}✓ Valid${colors.reset}`);
    } else {
      log(`${colors.red}✗ Invalid${colors.reset}`);
      validation.issues.forEach(issue => {
        log(`${colors.red}  - ${issue}${colors.reset}`);
      });
    }
    
    results.push({
      name,
      value: config.sensitive ? '***' : value,
      valid: validation.valid,
      issues: validation.issues,
      required: isRequired
    });
  }
  
  return results;
}

function checkSecurityBestPractices() {
  log(`${colors.bright}Checking security best practices...${colors.reset}`);
  
  const issues = [];
  
  // Check if running in production with development settings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
      issues.push('Production environment should not use localhost URLs');
    }
    
    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 12) {
      issues.push('Production admin password should be at least 12 characters');
    }
  }
  
  // Check for common security issues
  const sensitiveVars = ['ADMIN_PASSWORD', 'VERCEL_KV_REST_API_TOKEN', 'BLOB_READ_WRITE_TOKEN', 'TURNSTILE_SECRET_KEY'];
  for (const varName of sensitiveVars) {
    const value = process.env[varName];
    if (value && value.length < 8) {
      issues.push(`${varName} appears to be too short`);
    }
  }
  
  if (issues.length > 0) {
    log(`${colors.red}⚠️  Security issues found:${colors.reset}`);
    issues.forEach(issue => {
      log(`${colors.red}  - ${issue}${colors.reset}`);
    });
    return false;
  } else {
    log(`${colors.green}✓ Security best practices followed${colors.reset}`);
    return true;
  }
}

function generateEnvironmentReport(results, securityCheck) {
  log(`${colors.bright}Generating environment validation report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    summary: {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      required: results.filter(r => r.required).length,
      optional: results.filter(r => !r.required).length,
    },
    variables: results,
    securityCheck,
    recommendations: [
      'Ensure all required environment variables are set',
      'Use strong, unique passwords for production',
      'Never commit sensitive environment variables to version control',
      'Use different credentials for development and production',
      'Regularly rotate API keys and passwords',
      'Monitor environment variable usage in production',
    ]
  };
  
  // Write report to file
  const reportPath = './environment-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Environment validation report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printSummary(report) {
  log(`\n${colors.bright}=== ENVIRONMENT VALIDATION SUMMARY ===${colors.reset}`);
  log(`Environment: ${report.environment}`);
  log(`Total Variables: ${report.summary.total}`);
  log(`Required Variables: ${report.summary.required}`);
  log(`Optional Variables: ${report.summary.optional}`);
  log(`${colors.green}Valid: ${report.summary.valid}${colors.reset}`);
  log(`${colors.red}Invalid: ${report.summary.invalid}${colors.reset}`);
  
  if (report.summary.invalid > 0) {
    log(`\n${colors.red}Invalid Variables:${colors.reset}`);
    report.variables.forEach(variable => {
      if (!variable.valid) {
        log(`  - ${variable.name}: ${variable.issues.join(', ')}`);
      }
    });
  }
  
  if (!report.securityCheck) {
    log(`\n${colors.red}Security Issues Found${colors.reset}`);
  }
  
  const successRate = (report.summary.valid / report.summary.total) * 100;
  log(`\n${colors.bright}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 90) {
    log(`${colors.green}🔒 Environment configuration is secure!${colors.reset}`);
  } else if (successRate >= 80) {
    log(`${colors.yellow}⚠️  Environment configuration needs minor improvements.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Environment configuration needs significant improvements.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Recommendations:${colors.reset}`);
  report.recommendations.forEach((rec, index) => {
    log(`  ${index + 1}. ${rec}`);
  });
}

function main() {
  log(`${colors.bright}🔒 Starting Environment Variables Validation${colors.reset}`);
  log(`${colors.cyan}Security and Configuration Validation${colors.reset}`);
  
  // Check environment files
  const envFiles = checkEnvironmentFile();
  
  // Validate environment variables
  const results = validateAllEnvironmentVariables();
  
  // Check security best practices
  const securityCheck = checkSecurityBestPractices();
  
  // Generate report
  const report = generateEnvironmentReport(results, securityCheck);
  
  // Print summary
  printSummary(report);
  
  // Exit with appropriate code
  const hasErrors = report.summary.invalid > 0 || !securityCheck;
  if (hasErrors) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariable,
  validateAllEnvironmentVariables,
  checkSecurityBestPractices,
  generateEnvironmentReport,
};
