// Tests for blob-adapter. Run via: pnpm tsx --test src/lib/blob-adapter.test.ts
//
// Covers pure helpers (path normalisation, legacy-URL detection,
// allowOverwrite rejection) and FsBackend round-trips. S3Backend is
// exercised only through the shared helpers; full S3 integration is
// out of scope for unit tests.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  put,
  head,
  del,
  LegacyBlobUrlError,
  BlobOptionNotImplementedError,
  __resetBackendForTests,
} from './blob-adapter'

async function withTempRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), 'blob-adapter-'))
  const prevRoot = process.env.BLOB_FS_ROOT
  const prevBackend = process.env.BLOB_BACKEND
  const prevBase = process.env.BLOB_PUBLIC_URL_BASE
  process.env.BLOB_FS_ROOT = root
  process.env.BLOB_BACKEND = 'fs'
  delete process.env.BLOB_PUBLIC_URL_BASE
  __resetBackendForTests()
  try {
    return await fn(root)
  } finally {
    if (prevRoot === undefined) delete process.env.BLOB_FS_ROOT
    else process.env.BLOB_FS_ROOT = prevRoot
    if (prevBackend === undefined) delete process.env.BLOB_BACKEND
    else process.env.BLOB_BACKEND = prevBackend
    if (prevBase !== undefined) process.env.BLOB_PUBLIC_URL_BASE = prevBase
    __resetBackendForTests()
    await rm(root, { recursive: true, force: true })
  }
}

test('LegacyBlobUrlError: del() refuses *.public.blob.vercel-storage.com URLs', async () => {
  await withTempRoot(async () => {
    await assert.rejects(
      () => del('https://abc123.public.blob.vercel-storage.com/farm-photos/x/y/main.webp'),
      (err: Error) => err instanceof LegacyBlobUrlError
    )
  })
})

test('LegacyBlobUrlError: case-insensitive host match', async () => {
  await withTempRoot(async () => {
    await assert.rejects(
      () => del('https://Abc.PUBLIC.Blob.Vercel-Storage.COM/x'),
      (err: Error) => err instanceof LegacyBlobUrlError
    )
  })
})

test('del() accepts a bare pathname and a non-legacy URL without throwing', async () => {
  await withTempRoot(async () => {
    await del('farm-photos/missing/main.webp')
    await del('https://my-bucket.fsn1.your-objectstorage.com/farm-photos/missing/main.webp')
  })
})

test('BlobOptionNotImplementedError: put() rejects allowOverwrite=false', async () => {
  await withTempRoot(async () => {
    await assert.rejects(
      () => put('farm-photos/x/main.webp', 'body', { allowOverwrite: false }),
      (err: Error) => err instanceof BlobOptionNotImplementedError
    )
  })
})

test('FsBackend round-trip: put then head returns matching size and pathname', async () => {
  await withTempRoot(async () => {
    const payload = Buffer.from('hello blob world')
    const res = await put('round-trip/main.txt', payload, { contentType: 'text/plain' })
    assert.equal(res.pathname, 'round-trip/main.txt')
    assert.match(res.url, /^\/blob\/round-trip\/main\.txt$/)

    const info = await head('round-trip/main.txt')
    assert.equal(info.pathname, 'round-trip/main.txt')
    assert.equal(info.size, payload.byteLength)
    assert.ok(info.uploadedAt instanceof Date)
  })
})

test('FsBackend.put accepts string, Buffer, Uint8Array, and Blob bodies', async () => {
  await withTempRoot(async () => {
    await put('multi/string.txt', 'hello')
    await put('multi/buffer.bin', Buffer.from([1, 2, 3]))
    await put('multi/uint8.bin', new Uint8Array([4, 5, 6]))
    await put('multi/blob.bin', new Blob([new Uint8Array([7, 8, 9])]))

    assert.equal((await head('multi/string.txt')).size, 5)
    assert.equal((await head('multi/buffer.bin')).size, 3)
    assert.equal((await head('multi/uint8.bin')).size, 3)
    assert.equal((await head('multi/blob.bin')).size, 3)
  })
})

test('FsBackend.del is idempotent for missing files (matches Vercel Blob)', async () => {
  await withTempRoot(async () => {
    await del('never-existed/main.webp')

    await put('written/main.webp', 'x')
    await del('written/main.webp')
    await del('written/main.webp')
  })
})

test('normalisePath: rejects path traversal via ..', async () => {
  await withTempRoot(async () => {
    await assert.rejects(
      () => put('safe/../../../etc/passwd', 'x'),
      /refusing path with \.\. segment/
    )
  })
})

test('normalisePath: tolerates leading slash', async () => {
  await withTempRoot(async () => {
    const res = await put('/leading-slash/main.txt', 'x')
    assert.equal(res.pathname, 'leading-slash/main.txt')
  })
})

test('pathFromInput round-trips a path written via put() through del()', async () => {
  await withTempRoot(async () => {
    const res = await put('round/main.txt', 'x')
    await del(res.url)
    await assert.rejects(() => head('round/main.txt'))
  })
})

test('buildPublicUrl honours BLOB_PUBLIC_URL_BASE when set', async () => {
  await withTempRoot(async () => {
    process.env.BLOB_PUBLIC_URL_BASE = 'https://cdn.example/farm/'
    const res = await put('with-base/main.txt', 'x')
    assert.equal(res.url, 'https://cdn.example/farm/with-base/main.txt')
  })
})
