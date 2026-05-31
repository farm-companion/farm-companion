// Tests for getClusterBrandStyle (brand Sea Ink density ramp). Run via:
// npm run test:unit. Verifies tier boundaries and that the ramp is monochrome
// and gets deeper/larger as count grows (the property that replaced the old
// 5-hue rainbow).

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getClusterBrandStyle } from './cluster-config'

const boundaries: Array<[number, number, string]> = [
  [0, 34, '#4F6E90'],
  [1, 34, '#4F6E90'],
  [4, 34, '#4F6E90'],
  [5, 38, '#3D5C7E'],
  [9, 38, '#3D5C7E'],
  [10, 44, '#2E4D6C'],
  [19, 44, '#2E4D6C'],
  [20, 50, '#213F5C'],
  [49, 50, '#213F5C'],
  [50, 56, '#162E47'],
  [200, 56, '#162E47'],
]

for (const [count, size, fill] of boundaries) {
  test(`getClusterBrandStyle: count ${count} -> size ${size}, fill ${fill}`, () => {
    const style = getClusterBrandStyle(count)
    assert.equal(style.size, size)
    assert.equal(style.fill, fill)
    assert.equal(style.textColor, '#F4F1EA')
    assert.equal(style.borderColor, '#FFFFFF')
  })
}

test('getClusterBrandStyle: denser clusters are larger', () => {
  assert.ok(getClusterBrandStyle(50).size > getClusterBrandStyle(2).size)
})
