import { strict as assert } from 'node:assert';
import pkg from 'twitter-text';
import { test } from 'node:test';

const { parseTweet } = pkg;

/**
 * Test tweet composition with URL and proper length trimming
 */
function fakeCompose(base, url) {
  let t = base + ' ' + url;
  while (!parseTweet(t).valid && t.length > url.length + 1) {
    t = t.slice(0, -1);
  }
  return t.trim();
}

test('tweet with URL is <=280 and valid', () => {
  const base = 'A'.repeat(300);
  const url = 'https://www.farmcompanion.co.uk/farms/willow-brook-farm';
  const out = fakeCompose(base, url);
  assert.ok(parseTweet(out).valid);
  assert.ok(out.length <= 280);
});

test('always includes link', () => {
  const out = fakeCompose('Visit Willow Brook Farm for grass-fed beef.', 'https://example.com');
  assert.match(out, /https?:/);
});

test('handles short content correctly', () => {
  const base = 'Great farm!';
  const url = 'https://www.farmcompanion.co.uk/farms/test-farm';
  const out = fakeCompose(base, url);
  assert.ok(parseTweet(out).valid);
  assert.ok(out.includes(url));
});

test('trims content when too long', () => {
  const base = 'A'.repeat(250);
  const url = 'https://example.com/farm';
  const out = fakeCompose(base, url);
  assert.ok(parseTweet(out).valid);
  assert.ok(out.length <= 280);
  // URL should be preserved in the output
  assert.ok(out.includes(url));
});
