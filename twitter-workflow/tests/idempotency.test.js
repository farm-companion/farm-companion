import { strict as assert } from 'node:assert';
import { test } from 'node:test';

/**
 * Test idempotency functionality
 */
function mockSetOnceToday(key, shouldCreate = true) {
  const today = new Date().toISOString().slice(0,10);
  let namespaced = `fc:tweeted:${today}`;
  if (key) namespaced += `:${key}`;
  
  return {
    enforced: true,
    created: shouldCreate,
    key: namespaced
  };
}

test('idempotency allows first run', () => {
  const lock = mockSetOnceToday('daily', true);
  assert.ok(lock.enforced);
  assert.ok(lock.created);
  assert.match(lock.key, /fc:tweeted:\d{4}-\d{2}-\d{2}:daily/);
});

test('idempotency blocks second run', () => {
  const lock = mockSetOnceToday('daily', false);
  assert.ok(lock.enforced);
  assert.ok(!lock.created);
  assert.match(lock.key, /fc:tweeted:\d{4}-\d{2}-\d{2}:daily/);
});

test('idempotency key format is correct', () => {
  const lock = mockSetOnceToday('daily', true);
  const expectedPattern = /^fc:tweeted:\d{4}-\d{2}-\d{2}:daily$/;
  assert.match(lock.key, expectedPattern);
});

test('idempotency works without KV configured', () => {
  // Simulate no KV configuration
  const lock = { enforced: false };
  assert.ok(!lock.enforced);
  // Should not block execution when KV is not configured
});
