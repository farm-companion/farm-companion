// farm-frontend/src/scripts/pipeline/sources/non-farm-chains.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isChainName, isChainWebsite, isNonFarmChain } from './non-farm-chains'

// --- True positives: real chains that leaked in ---
test('matches leading chain names', () => {
  assert.equal(isChainName('farmfoods'), true)
  assert.equal(isChainName('Tesco Superstore'), true)
  assert.equal(isChainName('Tesco Express Camden'), true)
})

test('matches chain token in suffix/mid position', () => {
  // Real prod rows that exact-match would miss:
  assert.equal(isChainName("Washington Teal Farm Sainsbury's (Argos Collection Point)"), true)
  assert.equal(isChainName('Carnagh House Off Licence & NISA'), true)
})

test('matches multi-word chain phrases', () => {
  assert.equal(isChainName('Premier Stores/Nikki\'s Kitchen'), true)
  assert.equal(isChainName('Heron Foods'), true)
})

// --- False positives: real farm shops that MUST survive ---
test('does not match real farm shops with colliding substrings', () => {
  assert.equal(isChainName('Aldis Farm Shop'), false)   // contains "aldi"
  assert.equal(isChainName('Aldis & Sons'), false)
  assert.equal(isChainName('Spalding Farm Shop Manna Cafe'), false) // contains "aldi"
  assert.equal(isChainName('Mr Alasdair Marshall'), false) // contains "asda"
  assert.equal(isChainName('Sparkle-Ness'), false) // contains "spar"
  assert.equal(isChainName('Sparsholt College Game And Wildlife Centre'), false)
  assert.equal(isChainName('Vital Spark'), false)
  assert.equal(isChainName('Newton Farm Foods'), false) // genuine farm shop
  assert.equal(isChainName('Eco Farm Foods'), false)
})

test('handles empty/undefined names', () => {
  assert.equal(isChainName(undefined), false)
  assert.equal(isChainName(''), false)
})

// --- Website-domain signal (the Farmfoods OSM smoking gun) ---
test('matches known chain website domains', () => {
  assert.equal(isChainWebsite('https://www.farmfoods.co.uk/store-finder.php?branch_code=690'), true)
  assert.equal(isChainWebsite('http://tesco.com'), true)
  assert.equal(isChainWebsite('https://www.sainsburys.co.uk/'), true)
})

test('does not match a genuine farm website or junk', () => {
  assert.equal(isChainWebsite('https://www.newtonfarmfoods.co.uk'), false)
  assert.equal(isChainWebsite('not a url'), false)
  assert.equal(isChainWebsite(undefined), false)
})

// --- Combined candidate predicate ---
test('isNonFarmChain combines name, website, and OSM brand tag', () => {
  assert.equal(isNonFarmChain({ name: 'farmfoods', website: 'https://www.farmfoods.co.uk/x', tags: { shop: 'farm' } }), true)
  assert.equal(isNonFarmChain({ name: 'Some Shed', tags: { brand: 'Tesco' } }), true)
  assert.equal(isNonFarmChain({ name: 'Newton Farm Foods', website: 'https://newtonfarmfoods.co.uk' }), false)
})
