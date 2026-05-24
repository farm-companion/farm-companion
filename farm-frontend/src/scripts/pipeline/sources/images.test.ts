import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseGeograph } from './geograph'
import { parseWikimedia } from './wikimedia'

const geo = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/geograph-sample.json'), 'utf8'))
const wiki = JSON.parse(readFileSync(resolve(__dirname, '../__fixtures__/wikimedia-sample.json'), 'utf8'))

test('parseGeograph keeps close CC photos, maps author/licence/sourceUrl, drops far + thumbless', () => {
  const out = parseGeograph(geo, 51.22, 0.87)
  // only the nearby item (guid 246730) survives: 999 is ~9km away, 111 has no thumb
  assert.equal(out.length, 1)
  assert.equal(out[0].source, 'geograph')
  assert.equal(out[0].license, 'CC-BY-SA-2.0')
  assert.equal(out[0].attribution, 'Jane Doe')
  assert.ok(out[0].sourceUrl.includes('/photo/246730'))
  assert.ok(out[0].url.endsWith('.jpg'))
})

test('parseWikimedia keeps commercial-ok CC license, strips HTML from artist, rejects NC license', () => {
  const out = parseWikimedia(wiki)
  assert.equal(out.length, 1)
  assert.equal(out[0].license, 'CC BY-SA 4.0')
  assert.equal(out[0].attribution, 'Bob')
  assert.ok(out[0].sourceUrl.includes('File:Farm.jpg'))
})
