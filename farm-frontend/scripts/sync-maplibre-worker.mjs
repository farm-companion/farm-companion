// Copies MapLibre's web worker out of node_modules into public/ so we can serve
// it from our own origin. v6 is ESM-only and derives the worker URL from
// `import.meta.url`, which Turbopack resolves next to the emitted chunk where no
// worker exists; src/features/map/lib/maplibre-worker.ts points config.WORKER_URL
// at this copy instead.
//
// Runs on predev and prebuild so the copy cannot drift from the installed
// version. Drift would be the dangerous failure here: a stale worker against a
// newer maplibre fails at runtime only, and only on the map.
import { createRequire } from 'node:module'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const root = dirname(require.resolve('maplibre-gl/package.json'))
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

const src = join(root, 'dist', 'maplibre-gl-worker.mjs')
const publicDir = join(process.cwd(), 'public')
const dest = join(publicDir, 'maplibre-gl-worker.mjs')
const stamp = join(publicDir, 'maplibre-gl-worker.version')

await mkdir(publicDir, { recursive: true })
await copyFile(src, dest)
await writeFile(stamp, `${version}\n`)

console.log(`[maplibre] synced worker for maplibre-gl@${version} -> public/maplibre-gl-worker.mjs`)
