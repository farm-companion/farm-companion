import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getCategoryIcon, ICON_BY_SLUG } from './CategoryIcon'

// The full seeded category set (seed-categories.ts) — none may render an emoji.
const SEEDED_SLUGS = [
  'organic-farms', 'pick-your-own', 'farm-shops', 'dairy-farms', 'meat-producers',
  'vegetable-farms', 'fruit-farms', 'farm-cafes', 'farmers-markets', 'veg-box-schemes',
  'christmas-trees', 'free-range-eggs', 'farm-stays', 'educational-visits', 'pumpkin-patches',
  'honey-beekeeping', 'cider-apple-juice', 'cheese-makers', 'ice-cream-farms', 'bakeries-flour-mills',
  'farm-attractions', 'farm-parks', 'alpaca-farms', 'vineyards', 'breweries-distilleries',
  'herbs-salads', 'preserves-jams', 'fish-farms', 'plant-nurseries', 'cut-flowers',
  'regenerative-farms', 'biodynamic-farms', 'csa', 'rare-breeds', 'permaculture-farms',
]

test('every seeded category slug has an explicit (non-emoji) icon mapping', () => {
  for (const slug of SEEDED_SLUGS) {
    assert.ok(slug in ICON_BY_SLUG, `${slug} should have an explicit icon`)
  }
})

test('getCategoryIcon returns a renderable component for known and unknown slugs', () => {
  const known = getCategoryIcon('farm-shops')
  const unknown = getCategoryIcon('does-not-exist')
  assert.ok(known, 'known slug must resolve to an icon')
  assert.ok(unknown, 'unknown slug must fall back, never undefined')
})
