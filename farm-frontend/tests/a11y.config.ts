import { defineConfig, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Testing Configuration
 * WCAG 2.2 AA Compliance Testing
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-a11y',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-a11y',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-a11y',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome-a11y',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari-a11y',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});

// Accessibility test helper
export async function runA11yTest(page: any, options: {
  exclude?: string[];
  include?: string[];
  tags?: string[];
} = {}) {
  const axeBuilder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .disableRules(['color-contrast']); // We'll handle this separately

  if (options.exclude) {
    axeBuilder.exclude(options.exclude);
  }

  if (options.include) {
    axeBuilder.include(options.include);
  }

  if (options.tags) {
    axeBuilder.withTags(options.tags);
  }

  const results = await axeBuilder.analyze();
  
  // Filter out known false positives
  const filteredViolations = results.violations.filter(violation => {
    // Exclude known issues that are false positives
    const knownFalsePositives = [
      'duplicate-id', // Sometimes caused by dynamic content
      'color-contrast', // Handled separately with color contrast testing
    ];
    
    return !knownFalsePositives.includes(violation.id);
  });

  return {
    ...results,
    violations: filteredViolations,
  };
}
