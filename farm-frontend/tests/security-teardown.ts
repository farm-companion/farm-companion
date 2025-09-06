import { FullConfig } from '@playwright/test';

/**
 * Security Test Teardown
 * Global teardown for security testing
 */

async function globalTeardown(config: FullConfig) {
  console.log('🔒 Cleaning up security test environment...');
  
  // Clean up any test data or temporary files
  // This is where you would clean up any test artifacts
  
  console.log('✓ Security test environment cleanup complete');
}

export default globalTeardown;
