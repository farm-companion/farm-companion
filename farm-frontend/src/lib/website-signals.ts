// Extract visitability evidence from a farm's own website text.
//
// This is evidence edge E5, which the spec declared unavailable: "needs a
// Google Maps Platform API key and billing". It needs neither. A farm shop
// publishes its opening hours and its "come and visit" language for customers,
// and that text is the best evidence there is that the public can walk in.
//
// Deliberately NOT a classifier. It reports what the page says and leaves the
// judgement to a person, because a page can be stale, a shop can have closed,
// and "farm shop" in a navigation menu may be an online category rather than a
// building. The output is evidence for a human to sign, not a verdict.

/** Day names as they appear in UK opening-hours tables, including abbreviations. */
const DAY = '(?:mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)[a-z]*'

/** A clock time: "9am", "8.30", "17:00", "9 p.m.". */
const TIME = '(?:\\d{1,2}(?:[:.]\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)|\\d{1,2}[:.]\\d{2})'

/**
 * "Saturday 9am - 5pm", "Mon-Fri 8.30-17:00", "Sunday: 10 - 4pm".
 *
 * The closing time is an explicit optional range rather than something the gap
 * quantifier might swallow. A lazy gap stops at the first time it sees, which
 * silently truncated every row to "Sunday: 9am" and lost the closing time.
 */
const HOURS_LINE = new RegExp(
  `${DAY}[^\\n|]{0,40}?${TIME}(?:\\s*(?:-|\u2013|\u2014|to|until|till)\\s*${TIME})?`, 'gi',
)

/** "Open Monday to Saturday", where no clock time follows on the same line. */
const OPEN_DAYS = new RegExp(`(?:open|opening)[^\\n]{0,60}${DAY}[^\\n]{0,60}`, 'gi')

/** Phrases that indicate a place the public can visit and buy from. */
const POSITIVE: ReadonlyArray<readonly [string, RegExp]> = [
  ['farm shop', /\bfarm ?shop\b/i],
  ['open to the public', /\bopen to the (?:public|general public)\b/i],
  ['visit us', /\bvisit (?:us|the farm|our farm|our shop)\b/i],
  ['our shop', /\bour (?:farm ?)?shop\b/i],
  ['cafe or restaurant', /\b(?:caf[eé]|tea ?room|restaurant)\b/i],
  ['pick your own', /\b(?:pick[- ]your[- ]own|PYO)\b/],
  ['counter service', /\b(?:butchery|butcher'?s counter|deli counter|farm butchery)\b/i],
  ['parking', /\b(?:car ?park|free parking)\b/i],
  ['opening times', /\bopening (?:times|hours)\b/i],
  ['farm gate or honesty box', /\b(?:farm ?gate sales|honesty (?:box|shop))\b/i],
]

/**
 * Phrases that argue against public retail access, or that mean the fetch did
 * not reach the business's own content at all. A login wall or a directory
 * scraper page is not evidence of anything and must not read as absence.
 */
const NEGATIVE: ReadonlyArray<readonly [string, RegExp]> = [
  ['wholesale only', /\bwholesale only\b/i],
  ['trade only', /\btrade (?:only|customers only)\b/i],
  ['by appointment', /\bby appointment\b/i],
  ['not open to the public', /\bnot open to the (?:public|general public)\b/i],
  ['online or delivery only', /\b(?:online only|mail order only|delivery only)\b/i],
  ['closed', /\b(?:permanently closed|now closed|ceased trading)\b/i],
  ['BLOCKED: login wall', /\b(?:Forgotten account|Log in to Facebook|login_attempt)\b/i],
  ['BLOCKED: server error', /\b(?:50[0-9] (?:Service|Internal)|Service Temporarily Unavailable)\b/i],
  ['BLOCKED: directory scraper', /\bukmapi\b/i],
]

export interface WebsiteSignals {
  /** Opening-hours lines as written on the page, deduplicated. */
  hours: string[]
  /** Positive phrase labels found. */
  positive: string[]
  /** Negative and blocked-fetch labels found. */
  negative: string[]
  /** True when the fetch clearly did not reach the business's own content. */
  blocked: boolean
}

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Report what a page says about visiting. Pure; no judgement, no verdict. */
export function extractWebsiteSignals(text: string): WebsiteSignals {
  const hours: string[] = []
  const seen = new Set<string>()
  for (const re of [HOURS_LINE, OPEN_DAYS]) {
    for (const m of text.matchAll(re)) {
      const line = collapse(m[0])
      const key = line.toLowerCase()
      // A hours line with no digits at all is "Open Monday to Saturday", which
      // is useful, but drop it when an identical clock-time line already won.
      if (seen.has(key)) continue
      seen.add(key)
      hours.push(line)
      if (hours.length >= 8) break
    }
    if (hours.length >= 8) break
  }
  const positive = POSITIVE.filter(([, re]) => re.test(text)).map(([label]) => label)
  const negative = NEGATIVE.filter(([, re]) => re.test(text)).map(([label]) => label)
  return {
    hours,
    positive,
    negative,
    blocked: negative.some((n) => n.startsWith('BLOCKED:')),
  }
}
