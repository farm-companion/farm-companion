import { test } from 'node:test'
import assert from 'node:assert/strict'
import { auditClassRules } from './class-rules'

// Compiling the real stylesheet is slow next to the rest of the suite.
const TIMEOUT = 120_000

/**
 * Classes whose whole job is to set something, and which must therefore
 * resolve to a rule. Every one of these was in use and producing nothing.
 */
const MUST_RESOLVE: readonly string[] = [
  // The semantic type scale, declared only in the dead v3 config.
  'text-heading', 'text-body', 'text-caption', 'text-small',
  // Font families, same.
  'font-clash', 'font-heading', 'font-body',
]

/**
 * Known dead and not yet fixed, named so the next slice has a target rather
 * than a memory. These are variant forms of the hand-written colour classes:
 * a hand-written `.text-brand` gives you no `hover:text-brand`, so hover
 * feedback across the site is markup over nothing. Fixing them means adding
 * --color-* to @theme AND moving the 68 hand-written classes into a cascade
 * layer, because unlayered CSS beats @layer utilities and would keep winning
 * on the non-hover state.
 */
const KNOWN_DEAD_NEXT_SLICE: readonly string[] = [
  'hover:bg-surface-2', 'bg-border',
]

test('the classes named for the next slice are still the ones that are dead',
  { timeout: TIMEOUT }, async () => {
  // Fails if one of them starts working, which means this list is stale, or
  // if one disappears from the source, which means it was deleted instead.
  const { dead } = await auditClassRules()
  const deadSet = new Set(dead.map((d) => d.cls))
  const unexpectedlyAlive = KNOWN_DEAD_NEXT_SLICE.filter((c) => !deadSet.has(c))
  assert.deepEqual(unexpectedlyAlive, [],
    `No longer dead, so remove from KNOWN_DEAD_NEXT_SLICE and add to MUST_RESOLVE: ${unexpectedlyAlive.join(', ')}`)
})

test('every class that sets something resolves to a rule', { timeout: TIMEOUT }, async () => {
  const { dead } = await auditClassRules()
  const deadSet = new Map(dead.map((d) => [d.cls, d.uses]))
  const offenders = MUST_RESOLVE.filter((c) => deadSet.has(c))
    .map((c) => `${c} (${deadSet.get(c)} uses)`)
  assert.deepEqual(
    offenders,
    [],
    `These classes are written in the source and generate no CSS:\n  ${offenders.join('\n  ')}`,
  )
})

/**
 * A ratchet, not a target. Legacy families (serum, primary-*, foreground)
 * predate the Field Edition palette and are still being removed slice by
 * slice. This fails when the number grows, which is the only thing that
 * matters: a new dead class is a new silent no-op.
 */
const DEAD_BUDGET = { distinct: 185, uses: 490 }

test('the inventory of dead classes does not grow', { timeout: TIMEOUT }, async () => {
  const { dead, deadUses } = await auditClassRules()
  const worst = dead.slice(0, 10).map((d) => `${String(d.uses).padStart(4)}  ${d.cls}`).join('\n  ')
  assert.ok(
    dead.length <= DEAD_BUDGET.distinct && deadUses <= DEAD_BUDGET.uses,
    `Dead classes grew to ${dead.length} distinct / ${deadUses} uses ` +
      `(budget ${DEAD_BUDGET.distinct} / ${DEAD_BUDGET.uses}). Worst:\n  ${worst}\n` +
      `Either define the class or stop writing it. Lower the budget when you fix some.`,
  )
})
