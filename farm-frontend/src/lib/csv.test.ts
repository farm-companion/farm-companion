import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, parseCsvRecords, toCsv } from './csv'

test('plain rows', () => {
  assert.deepEqual(parseCsv('a,b\n1,2\n'), [['a', 'b'], ['1', '2']])
})

test('quoted cells carry commas, quotes and newlines', () => {
  // The reason this parser exists: a verifier's note will contain a comma.
  assert.deepEqual(
    parseCsv('slug,notes\nx,"called, no answer"\n'),
    [['slug', 'notes'], ['x', 'called, no answer']],
  )
  assert.deepEqual(
    parseCsv('a\n"he said ""open Sundays"""\n'),
    [['a'], ['he said "open Sundays"']],
  )
  assert.deepEqual(
    parseCsv('a,b\n"line one\nline two",2\n'),
    [['a', 'b'], ['line one\nline two', '2']],
  )
})

test('CRLF and a missing final newline', () => {
  assert.deepEqual(parseCsv('a,b\r\n1,2'), [['a', 'b'], ['1', '2']])
})

test('a BOM does not become part of the first header', () => {
  const recs = parseCsvRecords('﻿slug,verified\nx,y\n')
  assert.deepEqual(recs, [{ slug: 'x', verified: 'y' }])
  assert.equal(Object.keys(recs[0])[0], 'slug')
})

test('records skip blank lines and trim cells', () => {
  assert.deepEqual(
    parseCsvRecords('slug,verified\n x , y \n\n,\n'),
    [{ slug: 'x', verified: 'y' }],
  )
})

test('a short row yields empty strings, not undefined', () => {
  assert.deepEqual(parseCsvRecords('a,b,c\n1\n'), [{ a: '1', b: '', c: '' }])
})

test('empty input', () => {
  assert.deepEqual(parseCsv(''), [])
  assert.deepEqual(parseCsvRecords(''), [])
})

test('round trip survives the characters that break naive CSV', () => {
  const columns = ['slug', 'notes']
  const records = [
    { slug: 'a', notes: 'called, no answer' },
    { slug: 'b', notes: 'said "open Sundays"' },
    { slug: 'c', notes: 'line one\nline two' },
    { slug: 'd', notes: '' },
  ]
  assert.deepEqual(parseCsvRecords(toCsv(columns, records)), records)
})
