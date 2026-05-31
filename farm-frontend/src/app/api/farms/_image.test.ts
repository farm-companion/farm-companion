import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toClientImage, mapFarmImages } from './_image'

test('owner photo maps with uploadedBy and no attribution keys when CC metadata absent', () => {
  const result = toClientImage(
    {
      url: 'https://cdn.example.com/owner.jpg',
      altText: 'Front of the farm shop',
      uploadedBy: 'owner',
      attribution: null,
      sourceUrl: null,
      license: null,
    },
    'Fallback Farm'
  )

  assert.deepEqual(result, {
    url: 'https://cdn.example.com/owner.jpg',
    alt: 'Front of the farm shop',
    uploadedBy: 'owner',
  })
  assert.equal('attribution' in result, false)
  assert.equal('sourceUrl' in result, false)
  assert.equal('license' in result, false)
})

test('Geograph CC image surfaces attribution, sourceUrl, license, uploadedBy', () => {
  const result = toClientImage(
    {
      url: 'https://cdn.example.com/cc.jpg',
      altText: 'A field near the farm',
      uploadedBy: 'pipeline',
      attribution: 'John Smith / Geograph',
      sourceUrl: 'https://www.geograph.org.uk/photo/123',
      license: 'CC BY-SA 2.0',
    },
    'Fallback Farm'
  )

  assert.deepEqual(result, {
    url: 'https://cdn.example.com/cc.jpg',
    alt: 'A field near the farm',
    uploadedBy: 'pipeline',
    attribution: 'John Smith / Geograph',
    sourceUrl: 'https://www.geograph.org.uk/photo/123',
    license: 'CC BY-SA 2.0',
  })
})

test('alt falls back to provided fallback when altText is null', () => {
  const result = toClientImage(
    {
      url: 'https://cdn.example.com/noalt.jpg',
      altText: null,
      uploadedBy: 'owner',
    },
    'Fallback Farm'
  )

  assert.equal(result.alt, 'Fallback Farm')
})

test('mapFarmImages maps a list with the shared fallback', () => {
  const result = mapFarmImages(
    [
      { url: 'a.jpg', altText: null, uploadedBy: 'owner' },
      {
        url: 'b.jpg',
        altText: 'B',
        uploadedBy: 'pipeline',
        attribution: 'X / Geograph',
        sourceUrl: 'https://geo/2',
        license: 'CC BY 2.0',
      },
    ],
    'My Farm'
  )

  assert.equal(result.length, 2)
  assert.equal(result[0].alt, 'My Farm')
  assert.equal('attribution' in result[0], false)
  assert.equal(result[1].attribution, 'X / Geograph')
})
