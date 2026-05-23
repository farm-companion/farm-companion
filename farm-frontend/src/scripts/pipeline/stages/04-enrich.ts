// Stage 04: offerings/categories from OSM tags. Categories are additive
// (merge policy Rule 7) - we never remove existing ones.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PIPELINE_CONFIG } from '../config'
import { log } from '../lib/log'
import type { NormalizedCandidate } from '../types'

// OSM produce token -> site category slug. Extend as the taxonomy grows.
const PRODUCE_TO_SLUG: Record<string, string> = {
  vegetables: 'vegetables',
  veg: 'vegetables',
  fruit: 'fruit',
  eggs: 'eggs',
  meat: 'meat',
  dairy: 'dairy',
  milk: 'dairy',
  cheese: 'dairy',
  honey: 'honey',
  flowers: 'flowers',
}

export function tagsToCategories(tags: Record<string, string>): string[] {
  const slugs = new Set<string>(['farm-shops']) // every farm shop gets this
  if (tags.organic === 'yes') slugs.add('organic')
  if (tags.produce) {
    for (const token of tags.produce.split(/[;,]/).map((t) => t.trim().toLowerCase())) {
      const slug = PRODUCE_TO_SLUG[token]
      if (slug) slugs.add(slug)
    }
  }
  return [...slugs]
}

export function enrich(candidates: NormalizedCandidate[]): NormalizedCandidate[] {
  for (const c of candidates) {
    const cats = tagsToCategories(c.tags ?? {})
    c.categories = [...new Set([...c.categories, ...cats])]
  }
  return candidates
}

export function runEnrich(): NormalizedCandidate[] {
  const dir = resolve(process.cwd(), PIPELINE_CONFIG.artifactDir)
  const input = JSON.parse(readFileSync(resolve(dir, '03-geocode.json'), 'utf8')) as NormalizedCandidate[]
  const out = enrich(input)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, '04-enrich.json'), JSON.stringify(out, null, 2))
  log('info', 'enrich complete', { stage: '04', count: out.length })
  return out
}
