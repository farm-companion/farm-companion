// One JSON line per event. No console.log soup elsewhere in the pipeline.
type Level = 'info' | 'warn' | 'error'

export interface LogFields {
  stage?: string
  source?: string
  count?: number
  durationMs?: number
  [k: string]: unknown
}

export function log(level: Level, msg: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ ...fields, ts: new Date().toISOString(), level, msg })
  if (level === 'error') console.error(line)
  else console.log(line)
}
