// Does every class the source uses produce a CSS rule?
//
// Nothing asked this before. tailwind.config.js is a v3 config and the project
// runs Tailwind v4 via `@import "tailwindcss"` with no `@config` directive, so
// nothing the config declares has ever been in effect. The colour "utilities"
// are hand-written CSS classes in globals.css, which look like Tailwind but
// generate no variants, so `hover:text-brand` and `dark:bg-surface` are inert.
// The four semantic font-size names generate nothing at all.
//
// Compiles the real stylesheet through the real plugin, so this agrees with
// what the browser receives rather than with what anyone believes.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'

export interface DeadClass {
  cls: string
  uses: number
}

export interface ClassAudit {
  distinctUsed: number
  totalUses: number
  rulesDefined: number
  dead: DeadClass[]
  deadUses: number
}

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../../..')
const SRC = join(ROOT, 'src')
const ENTRY = join(SRC, 'app/globals.css')

/**
 * Class names reachable from a `className` attribute.
 *
 * The first version read only plain string literals, which missed every
 * `className={cn("a", cond && "b")}` and every template literal, and so
 * undercounted: it reported `hover:text-brand` as unused when the source
 * writes it 37 times. This walks the whole attribute expression, taking the
 * static text out of quotes and backticks and discarding interpolations.
 * Still conservative, since a class assembled at runtime cannot be seen at
 * all, so the count remains a floor.
 */
const TOKEN = /^[a-z][a-z0-9:_\-[\]./%#(),]*$/i

/** Finds `className=` and returns the source span of its value. */
function* classNameValues(src: string): Generator<string> {
  const attr = /className\s*=\s*/g
  let m: RegExpExecArray | null
  while ((m = attr.exec(src))) {
    let i = m.index + m[0].length
    const ch = src[i]
    if (ch === '"' || ch === "'") {
      const end = src.indexOf(ch, i + 1)
      if (end > i) yield src.slice(i + 1, end)
      continue
    }
    if (ch !== '{') continue
    // Walk to the matching brace so nested calls and ternaries come along.
    let depth = 0
    const start = i
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++
      else if (src[i] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    yield src.slice(start + 1, i)
  }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

/** Static class text inside an attribute expression. */
function staticStrings(expr: string): string[] {
  const out: string[] = []
  const lit = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`]*)`/g
  let m: RegExpExecArray | null
  while ((m = lit.exec(expr))) {
    const body = m[1] ?? m[2] ?? m[3] ?? ''
    // A template literal's interpolations are unknowable; its static text is not.
    for (const chunk of body.split(/\$\{[^}]*\}/)) out.push(chunk)
  }
  return out
}

export function collectUsedClasses(): Map<string, number> {
  const used = new Map<string, number>()
  for (const file of walk(SRC)) {
    const src = readFileSync(file, 'utf8')
    for (const value of classNameValues(src)) {
      const pieces = value.trimStart().startsWith('"') || value.includes('"') || value.includes("'") || value.includes('`')
        ? staticStrings(value)
        : [value]
      for (const piece of pieces) {
        for (const raw of piece.split(/\s+/)) {
          const cls = raw.trim()
          if (!cls || !TOKEN.test(cls)) continue
          used.set(cls, (used.get(cls) ?? 0) + 1)
        }
      }
    }
  }
  return used
}

export async function auditClassRules(): Promise<ClassAudit> {
  const used = collectUsedClasses()
  const css = readFileSync(ENTRY, 'utf8')
  const result = await postcss([tailwind()]).process(css, { from: ENTRY })

  const defined = new Set<string>()
  result.root.walkRules((rule) => {
    for (const sel of rule.selectors ?? []) {
      for (const match of sel.matchAll(/\.((?:\\.|[^\s.,:>+~()[\]#])+)/g)) {
        defined.add(match[1].replace(/\\/g, ''))
      }
    }
  })

  // A bare word with no hyphen, colon or bracket that resolves to nothing is
  // almost certainly prose swept up from a template literal ("className",
  // "index"), not a utility someone meant to write. Tailwind's own one-word
  // utilities (flex, hidden, truncate) all resolve, so none are lost here.
  const looksLikeUtility = (cls: string) => /[-:[]/.test(cls)

  const dead = [...used.entries()]
    .filter(([cls]) => !defined.has(cls) && looksLikeUtility(cls))
    .map(([cls, uses]) => ({ cls, uses }))
    .sort((a, b) => b.uses - a.uses)

  return {
    distinctUsed: used.size,
    totalUses: [...used.values()].reduce((a, b) => a + b, 0),
    rulesDefined: defined.size,
    dead,
    deadUses: dead.reduce((a, d) => a + d.uses, 0),
  }
}

// CLI: `npx tsx src/scripts/audit/class-rules.ts --list 30`
// Guarded so importing this from the test does not run it.
if (process.argv[1] && /class-rules\.ts$/.test(process.argv[1])) {
  const i = process.argv.indexOf('--list')
  const listCount = i >= 0 ? Number(process.argv[i + 1] ?? 25) : 0
  // Not top-level await: tsx transpiles this file to CJS, which has none.
  void auditClassRules().then((a) => {
    console.log(`classes used        ${a.distinctUsed} distinct, ${a.totalUses} uses`)
    console.log(`rules defined       ${a.rulesDefined}`)
    console.log(`PRODUCING NO RULE   ${a.dead.length} distinct, ${a.deadUses} uses`)
    if (listCount) {
      console.log('')
      for (const d of a.dead.slice(0, listCount)) {
        console.log(`  ${String(d.uses).padStart(4)}  ${d.cls}`)
      }
    }
  })
}
