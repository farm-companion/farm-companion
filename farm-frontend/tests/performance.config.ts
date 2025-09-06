import { defineConfig, devices } from '@playwright/test';

/**
 * Performance Testing Configuration
 * Core Web Vitals and Performance Validation
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
    // Performance testing specific settings
    ignoreHTTPSErrors: true,
    // Set consistent viewport for performance testing
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'performance-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Desktop performance testing
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'performance-mobile',
      use: { 
        ...devices['Pixel 5'],
        // Mobile performance testing
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'performance-tablet',
      use: { 
        ...devices['iPad Pro'],
        // Tablet performance testing
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for performance tests
  },

  // Performance testing specific configuration
  expect: {
    // Allow more time for performance tests
    timeout: 15000,
  },

  // Global setup for performance tests
  globalSetup: require.resolve('./performance-setup.ts'),
  
  // Global teardown for performance tests
  globalTeardown: require.resolve('./performance-teardown.ts'),
});
