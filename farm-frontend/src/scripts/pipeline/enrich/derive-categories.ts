// Derive category slugs from a farm's extracted facts (products/facilities) +
// organic flag, on top of any categories it already has. Additive and reversible
// (07-load upserts farmCategory links and silently skips unknown slugs). Machine-
// derived from scraped text, so a directory-grade signal, not a guarantee.
import type { FactSheet } from './validate'

export interface DeriveFacts {
  products: string[]
  facilities: string[]
  organic?: boolean
}

/** keyword regex (matched against lowercased products+facilities) -> seeded slug. */
const KEYWORD_SLUGS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(dairy|milk|yogurt|yoghurt|cream)\b/, 'dairy-farms'],
  [/\bcheese\b/, 'cheese-makers'],
  [/\b(meat|beef|lamb|pork|poultry|chicken|sausages?|butcher)\b/, 'meat-producers'],
  [/\b(vegetables?|veg|salad|greens)\b/, 'vegetable-farms'],
  [/\b(fruits?|apples?|berr|orchard|strawberr|raspberr)\b/, 'fruit-farms'],
  [/\beggs?\b/, 'free-range-eggs'],
  [/\bhoney\b/, 'honey-beekeeping'],
  [/\b(cafe|café|restaurant|tearoom|tea room|coffee|bistro)\b/, 'farm-cafes'],
  [/\b(bakery|bakehouse|bread|loaf|loaves)\b/, 'bakeries-flour-mills'],
  [/\bice cream\b/, 'ice-cream-farms'],
  [/\b(vineyard|wine)\b/, 'vineyards'],
  [/\b(brewery|beer|ale|lager)\b/, 'breweries-distilleries'],
  [/\b(cider|perry|apple juice)\b/, 'cider-apple-juice'],
  [/\b(pick your own|pick-your-own|pyo)\b/, 'pick-your-own'],
  [/\bchristmas tree/, 'christmas-trees'],
  [/\bpumpkins?\b/, 'pumpkin-patches'],
  [/\b(flowers?|florist|bouquet)\b/, 'cut-flowers'],
  [/\b(plant nursery|nursery|garden centre|garden center)\b/, 'plant-nurseries'],
  [/\b(jam|chutney|preserves?|marmalade)\b/, 'preserves-jams'],
]

export function deriveCategories(fs: FactSheet, facts: DeriveFacts): string[] {
  const out = new Set<string>(fs.categories) // keep what it already has (e.g. farm-shops)
  if (facts.organic) out.add('organic-farms')
  const hay = [...facts.products, ...facts.facilities].join(' ').toLowerCase()
  for (const [re, slug] of KEYWORD_SLUGS) {
    if (re.test(hay)) out.add(slug)
  }
  return [...out]
}
