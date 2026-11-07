import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  matchPhoto,
  bestMatch,
  distinctiveTokens,
  stripGridPrefix,
} from './geograph-match'

// ---------------------------------------------------------------------------
// Unit behaviour, stated as the cases that actually went wrong in production
// ---------------------------------------------------------------------------

test('the grid-square prefix is not part of the title', () => {
  assert.equal(stripGridPrefix('SO7804 : Eastington Farm Shop'), 'Eastington Farm Shop')
  assert.equal(stripGridPrefix('NH7146 : Police Station, Culloden'), 'Police Station, Culloden')
  assert.equal(stripGridPrefix('No prefix here'), 'No prefix here')
})

test('generic words are not distinctive', () => {
  assert.deepEqual(distinctiveTokens('Farm Shop'), [])
  assert.deepEqual(distinctiveTokens('The Farm Shop Ltd'), [])
  assert.deepEqual(distinctiveTokens('Cwmcerrig Farm Shop'), ['cwmcerrig'])
})

test("an apostrophe does not break a name match", () => {
  const m = matchPhoto("Gibson's Farm Shop", { title: 'TR2455 : Gibsons Farm Shop' })
  assert.equal(m.depicts, true, m.reason)
})

test('a business named only with generic words matches nothing', () => {
  // A farm literally called "Farm Shop" would otherwise claim any nearby farm
  // shop, including one in a different county.
  const m = matchPhoto('Farm Shop', { title: 'SJ5439 : Farm shop and café at Alderford Lake' })
  assert.equal(m.depicts, false)
  assert.match(m.reason, /no distinctive words/)
})

test('the name alone is not enough: it must be a premises', () => {
  // "Uppergate Farm, Hepworth" is a photograph of farmland.
  const m = matchPhoto('Uppergate Farm Shop', { title: 'SE1606 : Uppergate Farm, Hepworth' })
  assert.equal(m.depicts, false)
  assert.equal(m.retailWord, null)
  assert.deepEqual(m.matchedTokens, ['uppergate'])
})

test('a distancing phrase in front of the name disqualifies it', () => {
  // The photo is of the lane beside the shop, not the shop.
  const m = matchPhoto("Thorne's Farm Shop", {
    title: 'SS8704 : Stockleigh Pomeroy: by Thorne’s Farm Shop',
  })
  assert.equal(m.depicts, false)
  assert.equal(m.distancedBy, 'by')
})

test('"from" means a view towards the subject', () => {
  const m = matchPhoto('Liverton Farm Shop', {
    title: 'SY0382 : Liverton Farm from Salterton Road',
  })
  assert.equal(m.depicts, false)
})

test('"near" after the name is a village, not a distancing phrase', () => {
  // This is the true positive that a naive distancing rule would lose.
  const m = matchPhoto('Cwmcerrig Farm Shop', {
    title: 'SN5614 : Cwmcerrig Farm Shop, near Gorslas',
  })
  assert.equal(m.depicts, true, m.reason)
  assert.equal(m.distancedBy, null)
})

test('a leading "Welcome to" is not distancing', () => {
  const m = matchPhoto('Pound Farm Shop', {
    title: 'SO8313 : Welcome to Pound Farm Shop, Whaddon, Gloucestershire',
  })
  assert.equal(m.depicts, true, m.reason)
})

test('a different business at the same spot is rejected', () => {
  // Trentham Gardens is not Trentham Farm Shop; The Olive Tree is not Peaslow.
  assert.equal(
    matchPhoto('Trentham Farm Shop', { title: 'SJ8640 : The entrance to Trentham Gardens' }).depicts,
    false
  )
  assert.equal(
    matchPhoto('Peaslow Dairy', { title: 'SK0980 : The Olive Tree Cafe and Farm Shop' }).depicts,
    false
  )
})

test('a place-name collision does not match', () => {
  // The failure that made this worth measuring: a police station for a chippy.
  assert.equal(
    matchPhoto('Culloden Chippy Ltd', { title: 'NH7146 : Police Station, Culloden' }).depicts,
    false
  )
  assert.equal(
    matchPhoto('Easterton Farm Venison', { title: 'NJ2156 : Easterton Wood' }).depicts,
    false
  )
})

test('the Farm shop tag supplies the premises signal when the wording does not', () => {
  const m = matchPhoto('Emmerdale Produce', {
    title: 'TM4169 : Emmerdale, Darsham',
    tags: 'Farm shop?top:Business, Retail, Services',
  })
  assert.equal(m.depicts, true, m.reason)
  assert.equal(m.retailWord, 'tag:Farm shop')
})

test('top:Business is not evidence about this farm', () => {
  // Tried and rejected: treating top:Business as a premises signal dropped
  // precision from 100% to 82%, admitting a pub for Bishopstone Stores and a
  // Frankie & Benny's for Trentham Farm Shop, both on a village name.
  const m = matchPhoto('Smallford Farm Shop', {
    title: 'TL1907 : Three Horseshoes and the Garage at Smallford',
    tags: 'top:Business, Retail, Services',
  })
  assert.equal(m.depicts, false, m.reason)
})

test('the taxonomy separates a garden centre from a field of saplings', () => {
  // Both titles say "nursery"; only one is a shop. No word list can tell
  // them apart, which is what the negative subject veto is for.
  assert.equal(
    matchPhoto('Gates Farm Shop', {
      title: 'SK8009 : Gates Nurseries',
      tags: 'subject:garden centre',
    }).depicts,
    true
  )
  assert.equal(
    matchPhoto('Vine House Farm', {
      title: 'TF2015 : Nursery - Vine House Farm',
      tags: 'subject:nursery (plants)',
    }).depicts,
    false
  )
})

test('every result carries its reason, so a reviewer can judge it', () => {
  const m = matchPhoto('Teals', { title: 'ST6226 : Teals Farm shop South Cadbury' })
  assert.equal(m.depicts, true)
  assert.ok(m.reason.length > 0)
  assert.deepEqual(m.matchedTokens, ['teals'])
  assert.ok(m.retailWord)
})

test('bestMatch returns the first depicting candidate, or null', () => {
  const candidates = [
    { title: 'TM3760 : Retro emporium' },
    { title: 'TM3760 : Friday Street Farm Shop' },
  ]
  const hit = bestMatch('Friday Street Farm Shop', candidates)
  assert.ok(hit)
  assert.match(hit.candidate.title, /Friday Street Farm Shop/)
  assert.equal(bestMatch('Friday Street Farm Shop', [{ title: 'TM3760 : Postbox' }]), null)
})

// ---------------------------------------------------------------------------
// Measured against the hand-labelled gold set
// ---------------------------------------------------------------------------

interface GoldFarm {
  slug: string
  name: string
  sample: 'tuned' | 'holdout'
  depicts: boolean
  expectedTitle: string | null
  candidates: { title: string; tags: string }[]
}

interface Score {
  tp: number
  fp: number
  fn: number
  precision: number
  recall: number
  wrong: string[]
}

function score(farms: GoldFarm[]): Score {
  let tp = 0
  let fp = 0
  let fn = 0
  const wrong: string[] = []
  for (const farm of farms) {
    const hit = bestMatch(farm.name, farm.candidates)
    if (hit && farm.depicts) tp += 1
    else if (hit && !farm.depicts) {
      fp += 1
      wrong.push(`FP ${farm.name} -> ${hit.candidate.title}`)
    } else if (!hit && farm.depicts) {
      fn += 1
      wrong.push(`FN ${farm.name} -> expected ${farm.expectedTitle}`)
    }
  }
  return { tp, fp, fn, precision: tp / (tp + fp || 1), recall: tp / (tp + fn || 1), wrong }
}

// tsx runs this as CJS, where import.meta.dirname is undefined. The unit
// suite runs from the package root, so resolve from there.
const gold: GoldFarm[] = JSON.parse(
  readFileSync(
    join(process.cwd(), 'src/scripts/pipeline/fixtures/geograph-gold.json'),
    'utf8'
  )
)

test('gold set: precision and recall are measured, not asserted by eye', () => {
  // Reported per sample. The tuned half is where the rules came from, so its
  // score is optimistic by construction; the held-out half is the honest one.
  // Both are now tuned against, which is why the recommendation asks for a
  // third sample before this is trusted at full scale.
  for (const sample of ['tuned', 'holdout'] as const) {
    const s = score(gold.filter((f) => f.sample === sample))
    console.log(
      `\n  ${sample}: tp=${s.tp} fp=${s.fp} fn=${s.fn}  ` +
        `precision=${(s.precision * 100).toFixed(0)}% recall=${(s.recall * 100).toFixed(0)}%`
    )
    for (const line of s.wrong) console.log(`    ${line}`)
  }

  const all = score(gold)
  console.log(
    `\n  combined: ${gold.length} farms, ${gold.filter((f) => f.depicts).length} positive, ` +
      `precision=${(all.precision * 100).toFixed(0)}% recall=${(all.recall * 100).toFixed(0)}%`
  )

  // Precision is the number that matters. A false positive publishes someone
  // else's premises under a farm's name; a false negative just leaves a page
  // as it already is.
  assert.ok(all.precision >= 0.9, `precision ${all.precision} below 0.9`)
  assert.ok(all.recall >= 0.6, `recall ${all.recall} below 0.6`)
})

test('an appurtenance is not the premises', () => {
  // All four held-out false positives, as unit cases.
  const cases: [string, string][] = [
    ["Ben's Farm Shop", "SX7763 : Car Park, at Ben's Farmshop"],
    ['Allington Farm Shop', 'ST8974 : Unused picnic shelter, Allington Farm Shop'],
    ['High Royd Farm Shop', 'SE2604 : High Royd farm shop sign, Hoylandswaine'],
    ['Ancre Hill Vineyard', 'SO4913 : Ancre Hill Vineyard'],
  ]
  for (const [name, title] of cases) {
    assert.equal(matchPhoto(name, { title }).depicts, false, `${name}: ${title}`)
  }
})

test('gold set: every match names the business it is attached to', () => {
  // Not equality with the labelled title: several farms have more than one
  // good photo (Gibson's has both "Gibsons Farm Shop" and "Gibsons Farm Shop,
  // Little Crockshards Farm"), and picking either is correct. What must hold
  // is that the chosen title names the business.
  for (const farm of gold.filter((f) => f.depicts)) {
    const hit = bestMatch(farm.name, farm.candidates)
    assert.ok(hit, `${farm.name}: expected a match`)
    const title = stripGridPrefix(hit.candidate.title).toLowerCase()
    for (const token of distinctiveTokens(farm.name)) {
      assert.ok(
        title.replace(/[‘’']/g, '').includes(token),
        `${farm.name}: matched "${title}", which does not contain "${token}"`
      )
    }
    assert.ok(hit.match.retailWord, `${farm.name}: matched without a premises word`)
  }
})

test('a shopping village is not a farm shop', () => {
  // The one false positive the gold set caught: substring matching let "shop"
  // match inside "Shopping".
  const m = matchPhoto('Trentham Farm Shop', {
    title: 'SJ8640 : Wet day at Trentham Shopping Village',
  })
  assert.equal(m.depicts, false, m.reason)
})
