import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isGeneratedTemplate } from './backfill-false-descriptions'

// Every string here is a real description read from the live database during
// the 2026-10-31 dry run. The rule decides whether 2,220 rows get nulled, so
// it is tested against the actual data rather than invented examples.

// Pure template. These must be nulled.
const GENERATED = [
  'Sorbie Farm is a farm shop in Ardrossan.',
  'Hartley Farm Shop is a farm shop in Kent.',
  'Farmhouse Dairy Somerset (C M G Tucker & Son) is a farm shop in Bath and North East Somerset.',
  'Rannoch Deer and Forestry Management Partnership is a farm shop in Perth and Kinross.',
  'Rosemount Cottage Farm Meats is a farm shop in Armagh City, Banbridge and Craigavon.',
  'The Winery at Hundred Hills / Stonor Valley Winery is a farm shop in South Oxfordshire.',
  "Farmer Fletcher's Pumpkin Patch @ Hatton Country Store is a farm shop in Renfrewshire.",
  'RUSHTON PET AND POULTRY HOUSING & Holiday Let is a farm shop in Staffordshire Moorlands.',
  // Names carrying a period or a prose word. A whole-string check spares all
  // of these for no reason; the place clause is what matters.
  'A. Croskell Ltd (Dairy) is a farm shop in Dumfries and Galloway.',
  'With The Wild CIC is a farm shop in Somerset.',
  'Hi Sell Direct is a farm shop in Huntingdonshire.',
  'The Curry Pincher Also Trading As CJW Catering is a farm shop in Pendle.',
  'Homemade With Love Cheesecakes is a farm shop in Highland.',
  'The Hill Farmhouse Co. is a farm shop in Market Drayton.',
  'Mossbrook Farm Shop and Tea Room. is a farm shop in Magherafelt.',
  'Castleton Farm Shop - (PYO Not available) is a farm shop in Laurencekirk.',
  'B. Whiteley Farm Shop & Nursery is a farm shop in Pudsey.',
  'Growing With Grace is a farm shop in Clapham.',
]

// Real content. These must survive.
const SUBSTANTIVE = [
  'Great Park Farm is a farm shop in Catsfield, East Sussex, selling fresh produce including strawberries, raspberries, marrows, pumpkins, garlic.',
  'Tyddyn Teg Farm is a farm shop in Caernarfon with a bakery and campsite. It sells vegetables, seasonal fruit, sourdough bread, jams.',
  'Greenfields is a farm shop in London selling chillies, herbs, herbal teas, blends, curry blends, BBQ seasonings, peppers, spices.',
  'Dowstall Farm is a farm shop in Mylor Bridge with a walk-in fridge. The webstore is open from 9am Sunday to 1pm Wednesday.',
  'Three Counties Produce is a farm shop in Droitwich, Worcestershire, selling fruit, vegetables, herbs, and fish.',
  'J&D Papworth Farms is a farm shop in Sheringham, Norfolk, selling cattle, lambs, and pork.',
  'Perrinpit Farm is a farm shop in Frampton Cotterell selling grass fed meat and meat boxes.',
  'Langford Farm Organic is a farm shop in Bristol that sells homebred beef.',
]

test('the generated template is recognised, whatever the business name contains', () => {
  for (const d of GENERATED) {
    assert.equal(isGeneratedTemplate(d), true, `should be nulled: ${d}`)
  }
})

test('a description carrying real content is spared', () => {
  for (const d of SUBSTANTIVE) {
    assert.equal(isGeneratedTemplate(d), false, `must NOT be nulled: ${d}`)
  }
})

test('a county containing "and" is not mistaken for prose', () => {
  // The reason "and" is absent from the prose list. 274 Dumfries and Galloway
  // rows alone depend on this.
  assert.equal(isGeneratedTemplate('X is a farm shop in Dumfries and Galloway.'), true)
  assert.equal(isGeneratedTemplate('X is a farm shop in Bath and North East Somerset.'), true)
  assert.equal(isGeneratedTemplate('X is a farm shop in Perth and Kinross.'), true)
})

test('non-template descriptions are untouched', () => {
  assert.equal(isGeneratedTemplate(null), false)
  assert.equal(isGeneratedTemplate(undefined), false)
  assert.equal(isGeneratedTemplate(''), false)
  assert.equal(isGeneratedTemplate('   '), false)
  assert.equal(isGeneratedTemplate('A family-run holding selling day-picked veg and raw milk.'), false)
  // No trailing period, so the template anchor does not match.
  assert.equal(isGeneratedTemplate('Sorbie Farm is a farm shop in Ardrossan'), false)
})
