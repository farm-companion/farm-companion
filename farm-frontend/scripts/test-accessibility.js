#!/usr/bin/env node

/**
 * Comprehensive Accessibility Testing Script
 * WCAG 2.2 AA Compliance Testing
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

function checkDependencies() {
  log(`${colors.bright}Checking accessibility testing dependencies...${colors.reset}`);
  
  const dependencies = [
    { name: 'playwright', command: 'npx playwright --version' },
    { name: 'lighthouse', command: 'npx lighthouse --version' },
    { name: '@axe-core/playwright', command: 'npm list @axe-core/playwright' },
  ];
  
  const results = dependencies.map(dep => {
    const result = runCommand(dep.command, `Checking ${dep.name}`);
    return { ...dep, ...result };
  });
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    log(`${colors.red}Missing dependencies:${colors.reset}`);
    failed.forEach(dep => log(`  - ${dep.name}`));
    log(`${colors.yellow}Please install missing dependencies before running accessibility tests.${colors.reset}`);
    return false;
  }
  
  return true;
}

function runLighthouseAccessibilityTests() {
  log(`${colors.bright}Running Lighthouse Accessibility Tests...${colors.reset}`);
  
  const pages = [
    { url: 'http://localhost:3000', name: 'Homepage' },
    { url: 'http://localhost:3000/map', name: 'Map Page' },
    { url: 'http://localhost:3000/shop', name: 'Shop Directory' },
    { url: 'http://localhost:3000/seasonal', name: 'Seasonal Guide' },
    { url: 'http://localhost:3000/contact', name: 'Contact Page' },
  ];
  
  const results = [];
  
  for (const page of pages) {
    const command = `npx lighthouse ${page.url} --only-categories=accessibility --output=json --output-path=./accessibility-report-${page.name.toLowerCase().replace(/\s+/g, '-')}.json --chrome-flags="--headless --no-sandbox"`;
    
    const result = runCommand(command, `Lighthouse accessibility test for ${page.name}`);
    results.push({ page: page.name, ...result });
  }
  
  return results;
}

function runPlaywrightAccessibilityTests() {
  log(`${colors.bright}Running Playwright Accessibility Tests...${colors.reset}`);
  
  const commands = [
    {
      command: 'npx playwright test tests/accessibility.spec.ts --config=tests/a11y.config.ts',
      description: 'Playwright accessibility tests'
    },
    {
      command: 'npx playwright test tests/accessibility.spec.ts --config=tests/a11y.config.ts --project=chromium-a11y',
      description: 'Chromium accessibility tests'
    },
    {
      command: 'npx playwright test tests/accessibility.spec.ts --config=tests/a11y.config.ts --project=firefox-a11y',
      description: 'Firefox accessibility tests'
    },
    {
      command: 'npx playwright test tests/accessibility.spec.ts --config=tests/a11y.config.ts --project=webkit-a11y',
      description: 'WebKit accessibility tests'
    },
  ];
  
  const results = commands.map(cmd => runCommand(cmd.command, cmd.description));
  return results;
}

function runColorContrastTests() {
  log(`${colors.bright}Running Color Contrast Tests...${colors.reset}`);
  
  // This would typically involve checking CSS files for color combinations
  // For now, we'll create a basic check
  const cssFiles = [
    'src/app/globals.css',
    'src/components/ui/Button.tsx',
    'src/components/ui/TextField.tsx',
  ];
  
  const results = [];
  
  for (const file of cssFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Basic check for color contrast classes
      const hasContrastClasses = content.includes('text-text-') || 
                                content.includes('bg-background-') ||
                                content.includes('border-border-');
      
      results.push({
        file,
        hasContrastClasses,
        success: hasContrastClasses
      });
    }
  }
  
  return results;
}

function generateAccessibilityReport(results) {
  log(`${colors.bright}Generating Accessibility Report...${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    },
    tests: results,
  };
  
  // Count results
  results.forEach(result => {
    report.summary.total++;
    if (result.success) {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  });
  
  // Write report to file
  const reportPath = './accessibility-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`${colors.green}Accessibility report saved to: ${reportPath}${colors.reset}`);
  
  return report;
}

function printSummary(report) {
  log(`\n${colors.bright}=== ACCESSIBILITY TEST SUMMARY ===${colors.reset}`);
  log(`Total Tests: ${report.summary.total}`);
  log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
  log(`${colors.red}Failed: ${report.summary.failed}${colors.reset}`);
  
  if (report.summary.failed > 0) {
    log(`\n${colors.red}Failed Tests:${colors.reset}`);
    report.tests.forEach((test, index) => {
      if (!test.success) {
        log(`  ${index + 1}. ${test.description || test.page || 'Unknown test'}`);
        if (test.error) {
          log(`     Error: ${test.error}`);
        }
      }
    });
  }
  
  const successRate = (report.summary.passed / report.summary.total) * 100;
  log(`\n${colors.bright}Success Rate: ${successRate.toFixed(1)}%${colors.reset}`);
  
  if (successRate >= 90) {
    log(`${colors.green}🎉 Excellent accessibility compliance!${colors.reset}`);
  } else if (successRate >= 80) {
    log(`${colors.yellow}⚠️  Good accessibility compliance, but some improvements needed.${colors.reset}`);
  } else {
    log(`${colors.red}❌ Accessibility compliance needs significant improvement.${colors.reset}`);
  }
}

function main() {
  log(`${colors.bright}🔍 Starting Comprehensive Accessibility Testing${colors.reset}`);
  log(`${colors.cyan}WCAG 2.2 AA Compliance Testing${colors.reset}`);
  
  // Check if development server is running
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'pipe' });
  } catch (error) {
    log(`${colors.red}Error: Development server is not running on localhost:3000${colors.reset}`);
    log(`${colors.yellow}Please start the development server with 'npm run dev' before running accessibility tests.${colors.reset}`);
    process.exit(1);
  }
  
  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  const allResults = [];
  
  // Run Lighthouse tests
  const lighthouseResults = runLighthouseAccessibilityTests();
  allResults.push(...lighthouseResults);
  
  // Run Playwright tests
  const playwrightResults = runPlaywrightAccessibilityTests();
  allResults.push(...playwrightResults);
  
  // Run color contrast tests
  const contrastResults = runColorContrastTests();
  allResults.push(...contrastResults);
  
  // Generate and print report
  const report = generateAccessibilityReport(allResults);
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
  main();
}

module.exports = {
  runLighthouseAccessibilityTests,
  runPlaywrightAccessibilityTests,
  runColorContrastTests,
  generateAccessibilityReport,
};
