// MapLibre GL JS v6 ships as ES modules and resolves its web worker relative to
// its own bundle via `import.meta.url`. Under Next/Turbopack that resolves to a
// path next to the emitted chunk, where the worker is never written, so the URL
// 404s to HTML and the map dies with "Worker failed to load".
//
// v6 checks `config.WORKER_URL` before falling back to that derivation, so we
// point it at a copy we serve ourselves from /public. `scripts/sync-maplibre-worker.mjs`
// keeps that copy byte-identical to the installed version and runs on predev/prebuild.
//
// Importing this module for its side effect must happen before the first Map is
// constructed; MapLibreShell imports it above its own maplibre usage.
import { setWorkerUrl } from 'maplibre-gl'

export const MAPLIBRE_WORKER_URL = '/maplibre-gl-worker.mjs'

setWorkerUrl(MAPLIBRE_WORKER_URL)
