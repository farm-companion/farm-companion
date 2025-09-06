import { FullConfig } from '@playwright/test';

/**
 * Performance Test Teardown
 * Global teardown for performance testing
 */

async function globalTeardown(config: FullConfig) {
  console.log('⚡ Cleaning up performance test environment...');
  
  // Clean up any performance test artifacts
  // This is where you would clean up any test artifacts
  
  console.log('✓ Performance test environment cleanup complete');
}

export default globalTeardown;
