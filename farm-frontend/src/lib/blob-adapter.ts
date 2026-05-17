// Blob storage adapter. Replaces @vercel/blob with a backend-agnostic
// surface so the app runs on Coolify/Hetzner (S3-compatible object
// storage) and in local dev (filesystem volume) without code changes.
//
// Backend is selected by BLOB_BACKEND ('s3' | 'fs', default 'fs').
// Return shapes match @vercel/blob so existing callers need only an
// import-path swap.

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { promises as fs } from 'node:fs'
import { dirname, join, posix } from 'node:path'

export interface BlobPutOptions {
  access?: 'public' | 'private'
  addRandomSuffix?: boolean
  contentType?: string
  cacheControlMaxAge?: number
  allowOverwrite?: boolean
}

export interface BlobPutResult {
  url: string
  pathname: string
  contentType?: string
  contentDisposition?: string
}

export interface BlobHeadResult {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
  contentType?: string
}

export type BlobBody =
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | string
  | Blob
  | File

interface Backend {
  put(path: string, body: BlobBody, opts?: BlobPutOptions): Promise<BlobPutResult>
  head(path: string): Promise<BlobHeadResult>
  del(pathOrUrl: string): Promise<void>
}

async function toBuffer(body: BlobBody): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body
  if (body instanceof Uint8Array) return Buffer.from(body)
  if (body instanceof ArrayBuffer) return Buffer.from(new Uint8Array(body))
  if (typeof body === 'string') return Buffer.from(body)
  const ab = await (body as Blob).arrayBuffer()
  return Buffer.from(new Uint8Array(ab))
}

function normalisePath(p: string): string {
  const cleaned = p.replace(/^\/+/, '')
  if (cleaned.split('/').some((seg) => seg === '..')) {
    throw new Error(`blob-adapter: refusing path with .. segment: ${p}`)
  }
  return cleaned
}

const PUBLIC_URL_BASE = (process.env.BLOB_PUBLIC_URL_BASE ?? '').replace(/\/+$/, '')

function buildPublicUrl(pathname: string): string {
  return PUBLIC_URL_BASE
    ? `${PUBLIC_URL_BASE}/${pathname}`
    : `/blob/${pathname}`
}

function pathFromInput(pathOrUrl: string): string {
  if (PUBLIC_URL_BASE && pathOrUrl.startsWith(PUBLIC_URL_BASE)) {
    return normalisePath(pathOrUrl.slice(PUBLIC_URL_BASE.length))
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      const u = new URL(pathOrUrl)
      return normalisePath(u.pathname)
    } catch {
      /* fall through */
    }
  }
  return normalisePath(pathOrUrl)
}

class S3Backend implements Backend {
  private client: S3Client
  private bucket: string

  constructor() {
    const bucket = process.env.S3_BUCKET
    if (!bucket) {
      throw new Error('blob-adapter: BLOB_BACKEND=s3 requires S3_BUCKET')
    }
    this.bucket = bucket

    const cfg: S3ClientConfig = {
      region: process.env.S3_REGION ?? 'auto',
      forcePathStyle: true,
    }
    if (process.env.S3_ENDPOINT) cfg.endpoint = process.env.S3_ENDPOINT
    if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      cfg.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    }
    this.client = new S3Client(cfg)
  }

  async put(path: string, body: BlobBody, opts: BlobPutOptions = {}): Promise<BlobPutResult> {
    const Key = normalisePath(path)
    const buf = await toBuffer(body)
    const cacheControl = opts.cacheControlMaxAge
      ? `public, max-age=${opts.cacheControlMaxAge}, immutable`
      : undefined

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key,
        Body: buf,
        ContentType: opts.contentType,
        CacheControl: cacheControl,
        ACL: opts.access === 'public' ? 'public-read' : undefined,
      })
    )

    return {
      url: buildPublicUrl(Key),
      pathname: Key,
      contentType: opts.contentType,
    }
  }

  async head(path: string): Promise<BlobHeadResult> {
    const Key = normalisePath(path)
    const out = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key })
    )
    return {
      url: buildPublicUrl(Key),
      pathname: Key,
      size: out.ContentLength ?? 0,
      uploadedAt: out.LastModified ?? new Date(0),
      contentType: out.ContentType,
    }
  }

  async del(pathOrUrl: string): Promise<void> {
    const Key = pathFromInput(pathOrUrl)
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key })
    )
  }
}

class FsBackend implements Backend {
  private root: string

  constructor() {
    this.root = process.env.BLOB_FS_ROOT ?? './.blob-store'
  }

  private full(path: string): string {
    return join(this.root, normalisePath(path))
  }

  async put(path: string, body: BlobBody, opts: BlobPutOptions = {}): Promise<BlobPutResult> {
    const key = normalisePath(path)
    const target = this.full(key)
    await fs.mkdir(dirname(target), { recursive: true })
    const buf = await toBuffer(body)
    await fs.writeFile(target, buf)
    return {
      url: buildPublicUrl(key),
      pathname: key,
      contentType: opts.contentType,
    }
  }

  async head(path: string): Promise<BlobHeadResult> {
    const key = normalisePath(path)
    const stat = await fs.stat(this.full(key))
    return {
      url: buildPublicUrl(key),
      pathname: key,
      size: stat.size,
      uploadedAt: stat.mtime,
    }
  }

  async del(pathOrUrl: string): Promise<void> {
    const key = pathFromInput(pathOrUrl)
    try {
      await fs.unlink(this.full(key))
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') throw err
    }
  }
}

const backendName = (process.env.BLOB_BACKEND ?? 'fs').toLowerCase()

let _backend: Backend | null = null
function getBackend(): Backend {
  if (_backend) return _backend
  _backend = backendName === 's3' ? new S3Backend() : new FsBackend()
  return _backend
}

export function put(path: string, body: BlobBody, opts?: BlobPutOptions): Promise<BlobPutResult> {
  return getBackend().put(path, body, opts)
}
export function head(path: string): Promise<BlobHeadResult> {
  return getBackend().head(path)
}
export function del(pathOrUrl: string): Promise<void> {
  return getBackend().del(pathOrUrl)
}

export const joinPath = posix.join
