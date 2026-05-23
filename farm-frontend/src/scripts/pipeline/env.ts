// Side-effect module: load .env.local (override) then .env. Imported FIRST by
// run.ts so PIPELINE_CONFIG and any module-level env reads see the values.
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local'), override: true })
config({ path: resolve(process.cwd(), '.env') })
