import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveCategories } from './derive-categories'
import type { FactSheet } from './validate'

const fs = (categories: string[] = ['farm-shops']): FactSheet => ({ name: 'X', categories })

test('keeps existing categories and never drops farm-shops', () => {
  const out = deriveCategories(fs(['farm-shops']), { products: [], facilities: [] })
  assert.deepEqual(out, ['farm-shops'])
})

test('maps dairy/cheese products to dairy-farms and cheese-makers', () => {
  const out = deriveCategories(fs(), { products: ['raw milk', 'cheese'], facilities: [] })
  assert.ok(out.includes('dairy-farms'))
  assert.ok(out.includes('cheese-makers'))
  assert.ok(out.includes('farm-shops'))
})

test('maps meat products and a cafe facility', () => {
  const out = deriveCategories(fs(), { products: ['beef', 'sausages'], facilities: ['on-site cafe'] })
  assert.ok(out.includes('meat-producers'))
  assert.ok(out.includes('farm-cafes'))
})

test('organic flag adds organic-farms', () => {
  const out = deriveCategories(fs(), { products: ['vegetables'], facilities: [], organic: true })
  assert.ok(out.includes('organic-farms'))
  assert.ok(out.includes('vegetable-farms'))
})

test('returns no duplicates', () => {
  const out = deriveCategories(fs(['farm-shops', 'dairy-farms']), { products: ['milk'], facilities: [] })
  assert.equal(out.length, new Set(out).size)
})
