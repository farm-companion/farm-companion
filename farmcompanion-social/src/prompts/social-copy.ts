/**
 * Claude prompt for social copy generation
 */

import type { Farm } from "../types.js";

export function getSocialCopyPrompt(farm: Farm): string {
  return `You are writing social media copy for a farm.

Farm name: ${farm.name}
${farm.description ? `Description: ${farm.description}` : ""}

Write one short, engaging post (1–2 sentences) suitable for Instagram/Facebook. Keep it authentic and farm-focused.`;
}
