// Minimal RFC 4180 CSV, because the human half of venue verification happens in
// a spreadsheet and a dependency is not worth it for two scripts.
//
// Handles quoted fields containing commas, quotes ("" escapes) and newlines,
// which is the whole reason a split(',') version would not do: a verifier's
// free-text note will eventually contain a comma.

/** Parse CSV text into rows of cells. Returns [] for empty input. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  let i = 0
  // Strip a UTF-8 BOM: Excel and Numbers both write one, and it would
  // otherwise become part of the first header name.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  while (i < src.length) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 2; continue }
        quoted = false; i++; continue
      }
      cell += c; i++; continue
    }
    if (c === '"') { quoted = true; i++; continue }
    if (c === ',') { row.push(cell); cell = ''; i++; continue }
    if (c === '\r') { i++; continue }
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue }
    cell += c; i++
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row) }
  return rows
}

/** Parse CSV with a header row into objects keyed by trimmed header name. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1)
    // A trailing newline yields one empty cell; that is not a record.
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => {
      const rec: Record<string, string> = {}
      headers.forEach((h, idx) => { rec[h] = (r[idx] ?? '').trim() })
      return rec
    })
}

/** Quote a single cell only when it needs it. */
function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Serialise records to CSV using the given column order. */
export function toCsv(columns: string[], records: Record<string, string>[]): string {
  const lines = [columns.map(quote).join(',')]
  for (const rec of records) {
    lines.push(columns.map((c) => quote(rec[c] ?? '')).join(','))
  }
  return `${lines.join('\n')}\n`
}
