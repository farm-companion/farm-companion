import { defineConfig, devices } from '@playwright/test';

/**
 * Security Testing Configuration
 * Comprehensive security validation testing
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
    // Security testing specific settings
    ignoreHTTPSErrors: true, // Allow self-signed certificates for testing
    extraHTTPHeaders: {
      'User-Agent': 'Security-Test-Suite/1.0'
    }
  },

  projects: [
    {
      name: 'security-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'security-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'security-webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'security-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for security tests
  },

  // Security testing specific configuration
  expect: {
    // Allow more time for security tests
    timeout: 10000,
  },

  // Global setup for security tests
  globalSetup: require.resolve('./security-setup.ts'),
  
  // Global teardown for security tests
  globalTeardown: require.resolve('./security-teardown.ts'),
});
