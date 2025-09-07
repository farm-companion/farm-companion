/**
 * Ogilvy Copy Chief Prompts for Farm Companion
 * 
 * Professional copywriting prompts following David Ogilvy's principles:
 * - One clear idea, one useful benefit
 * - Concrete nouns over adjectives
 * - British English, no hype, no emojis
 * - Plain, helpful tone
 */

/**
 * Daily Farm Spotlight - Ogilvy Copy Chief Prompt
 * Returns strict JSON for parsing
 */
export function getDailySpotlightPrompt(farm) {
  return `You are David Ogilvy as a copy chief writing for Farm Companion (farmcompanion.co.uk): a clean, trustworthy UK directory of real farm shops.

Objective:
Write a single tweet that makes a reader click to view one farm's page. Lead with a concrete benefit and location; keep it human, specific, and plain. British English. No emojis. No hype. No exclamation marks. Sound like a helpful guide, not an ad.

Inputs:
- farm.name: ${farm.name}
- farm.location: ${farm.town}, ${farm.county}
- farm.produce: ${farm.produce || 'local produce'}
- farm.signature: ${farm.signature || 'Independent farm shop'}
- farm.slug: ${farm.slug}

Hard rules:
- Output JSON only.
- Field "body" must be 120-220 characters (we append a t.co link afterwards).
- Include two hashtags exactly: "#FarmShop" and "#FarmCompanion".
- Optionally add ONE produce/region hashtag if it's crystal-relevant (e.g. #RawMilk or #Yorkshire). Never more than three total.
- Mention the location once.
- No colons at the start, no "click", no promises, no salesy phrasing.
- British spelling, sentence case, clean typography.
- NEVER mention pork, pigs, bacon, ham, or any pig-related products.
- Ensure content is substantial and informative, not just a basic listing.

Style guardrails (Ogilvy):
- One clear idea, one useful benefit.
- Prefer concrete nouns over adjectives.
- If you can be shorter, be shorter.

Return JSON with fields:
{
  "body": "<tweet text without URL, ≤220 chars, includes the hashtags>",
  "alt_text": "<120-char image description if a shop photo exists; else empty string>",
  "notes": "<one sentence explaining the chosen benefit and hashtag>"
}`;
}

/**
 * Profile Bio - Ogilvy Microcopy Prompt
 */
export function getProfileBioPrompt() {
  return `You are David Ogilvy distilling a 160-character bio for Farm Companion.

Goal:
Explain, in one line, why to follow: "find real UK farm shops; one daily spotlight."

Rules:
- ≤160 characters.
- British English. No emojis. No hype.
- Include "UK farm shops" and "daily spotlight".

Return only the bio line, nothing else.`;
}

/**
 * Pinned Tweet - Ogilvy Launch Prompt
 */
export function getPinnedTweetPrompt() {
  return `You are David Ogilvy writing a pinned tweet for Farm Companion.

Objective:
Invite people to discover real UK farm shops and explain the daily spotlight.

Rules:
- ≤240 chars for body (we append a link).
- British English. No emojis. No exclamation marks.
- One idea: "fresh, local, traceable from independent shops."

Include these hashtags at the end: #FarmShop #FarmCompanion
Return BODY only (no URL).`;
}

/**
 * Image Alt-Text - Descriptive, Neutral
 */
export function getAltTextPrompt(farm) {
  return `You are writing concise, factual alt text for a farm-shop photo.

Rules:
- ≤120 characters.
- Plain description of what a sighted user can see.
- No sales language, no proper nouns unless on signage.
- British English.

Inputs: shop exterior/interior? key items visible? season?

Return ALT_TEXT only.`;
}

/**
 * Parse Ogilvy JSON response and validate
 */
export function parseOgilvyResponse(response) {
  try {
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.body) {
      throw new Error('Missing required field: body');
    }
    
    // Validate character limits
    if (parsed.body.length > 220) {
      throw new Error(`Body too long: ${parsed.body.length} chars (max 220)`);
    }
    
    if (parsed.alt_text && parsed.alt_text.length > 120) {
      throw new Error(`Alt text too long: ${parsed.alt_text.length} chars (max 120)`);
    }
    
    // Validate hashtags
    if (!parsed.body.includes('#FarmShop') || !parsed.body.includes('#FarmCompanion')) {
      throw new Error('Missing required hashtags: #FarmShop and #FarmCompanion');
    }
    
    // Count hashtags (should be 2-3 total)
    const hashtagCount = (parsed.body.match(/#\w+/g) || []).length;
    if (hashtagCount < 2 || hashtagCount > 3) {
      throw new Error(`Invalid hashtag count: ${hashtagCount} (should be 2-3)`);
    }
    
    return {
      success: true,
      body: parsed.body,
      alt_text: parsed.alt_text || '',
      notes: parsed.notes || '',
      hashtagCount
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      rawResponse: response
    };
  }
}

/**
 * Generate fallback content in Ogilvy style
 */
export function generateOgilvyFallback(farm) {
  const location = `${farm.town || 'local area'}, ${farm.county || 'UK'}`;
  let produce = farm.produce || 'local produce';
  
  // Filter out pork-related content from produce
  if (produce.toLowerCase().includes('pork') || 
      produce.toLowerCase().includes('pig') || 
      produce.toLowerCase().includes('bacon') || 
      produce.toLowerCase().includes('ham')) {
    produce = 'local produce, fresh vegetables, dairy products';
  }
  
  // Ensure minimum character count (at least 120 characters)
  const baseBody = `${farm.name} in ${location} — ${produce} from independent farmers. #FarmShop #FarmCompanion`;
  
  // If too short, add more descriptive content
  let body = baseBody;
  if (body.length < 120) {
    const additionalContent = ` Fresh seasonal produce, traditional farming methods, and local community support.`;
    body = `${farm.name} in ${location} offers ${produce} from independent farmers.${additionalContent} #FarmShop #FarmCompanion`;
  }
  
  // Ensure we don't exceed 220 characters
  if (body.length > 220) {
    body = baseBody;
  }
  
  return {
    success: true,
    body: body,
    alt_text: `Farm shop exterior with local produce on display`,
    notes: 'Fallback content using Ogilvy principles: location + concrete benefit (pork filtered, min 120 chars)',
    hashtagCount: 2,
    method: 'fallback'
  };
}
