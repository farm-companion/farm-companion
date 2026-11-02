import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isOwnImageHost, hotlinkedApproved } from './image-host'

const OURS = 'https://farm-companion-blob-prod.hel1.your-objectstorage.com/x/main.webp'
const RUNWARE = 'https://im.runware.ai/image/ws/3/ii/eb0f96b7.webp'
const GEOGRAPH = 'https://s1.geograph.org.uk/geophotos/01/82/73/1827333_e7a3df8c_120x120.jpg'

test('our object store is ours, whatever the bucket subdomain', () => {
  assert.equal(isOwnImageHost(OURS), true)
  assert.equal(isOwnImageHost('https://another-bucket.fsn1.your-objectstorage.com/a.webp'), true)
})

test('our own domain is ours', () => {
  assert.equal(isOwnImageHost('https://www.farmcompanion.co.uk/images/plates/x.svg'), true)
})

test('a relative path is served by this app, so it is ours', () => {
  assert.equal(isOwnImageHost('/images/plates/cornwall.svg'), true)
})

test('the generation CDN is not ours: this is the 2026-02-01 regression', () => {
  assert.equal(isOwnImageHost(RUNWARE), false)
})

test('geograph is not ours', () => {
  assert.equal(isOwnImageHost(GEOGRAPH), false)
})

test('a lookalike domain does not pass as ours', () => {
  // Suffix matching must be anchored on a dot, or evil-farmcompanion.co.uk
  // and your-objectstorage.com.attacker.net both slip through.
  assert.equal(isOwnImageHost('https://evilfarmcompanion.co.uk/a.webp'), false)
  assert.equal(isOwnImageHost('https://your-objectstorage.com.attacker.net/a.webp'), false)
})

test('an unparseable url is not ours', () => {
  assert.equal(isOwnImageHost('not a url'), false)
  assert.equal(isOwnImageHost(''), false)
})

test('host matching ignores case', () => {
  assert.equal(isOwnImageHost('https://BUCKET.HEL1.YOUR-OBJECTSTORAGE.COM/a.webp'), true)
})

test('only approved rows are held to the host rule', () => {
  const rows = [
    { url: OURS, status: 'approved' },
    { url: RUNWARE, status: 'approved' },
    { url: GEOGRAPH, status: 'pending' },
    { url: RUNWARE, status: 'rejected' },
  ]
  const bad = hotlinkedApproved(rows)
  assert.equal(bad.length, 1, 'only the approved hot-link should be flagged')
  assert.equal(bad[0].url, RUNWARE)
})

test('a table with nothing hot-linked and approved passes', () => {
  assert.deepEqual(hotlinkedApproved([{ url: OURS, status: 'approved' }]), [])
})
