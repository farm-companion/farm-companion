// Pure name-similarity using the Sorensen-Dice coefficient over character
// bigrams. Returns 0..1. Chosen over Levenshtein for stability on word
// reorder and length differences. Used by the fuzzy matcher.

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2)
    map.set(bg, (map.get(bg) ?? 0) + 1)
  }
  return map
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.length < 2 || nb.length < 2) return 0

  const ba = bigrams(na)
  const bb = bigrams(nb)
  let intersection = 0
  for (const [bg, countA] of ba) {
    const countB = bb.get(bg) ?? 0
    intersection += Math.min(countA, countB)
  }
  const total = (na.length - 1) + (nb.length - 1)
  return (2 * intersection) / total
}
