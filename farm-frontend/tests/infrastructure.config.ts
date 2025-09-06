import { defineConfig, devices } from '@playwright/test';

/**
 * Infrastructure Testing Configuration
 * Database, Email, Storage, and Infrastructure Validation
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
    // Infrastructure testing specific settings
    ignoreHTTPSErrors: true,
    // Set consistent viewport for infrastructure testing
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'infrastructure-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Desktop infrastructure testing
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'infrastructure-mobile',
      use: { 
        ...devices['Pixel 5'],
        // Mobile infrastructure testing
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'infrastructure-tablet',
      use: { 
        ...devices['iPad Pro'],
        // Tablet infrastructure testing
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for infrastructure tests
  },

  // Infrastructure testing specific configuration
  expect: {
    // Allow more time for infrastructure tests
    timeout: 15000,
  },

  // Global setup for infrastructure tests
  globalSetup: require.resolve('./infrastructure-setup.ts'),
  
  // Global teardown for infrastructure tests
  globalTeardown: require.resolve('./infrastructure-teardown.ts'),
});
