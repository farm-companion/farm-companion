/**
 * Generate social copy using Claude
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { Farm, SocialCopy } from "../types.js";
import { getSocialCopyPrompt } from "../prompts/social-copy.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function generateCopy(farm: Farm): Promise<SocialCopy> {
  const prompt = getSocialCopyPrompt(farm);
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0]?.type === "text"
      ? response.content[0].text
      : "";
  // TODO: parse text into SocialCopy (e.g. JSON or structured format)
  return { caption: text.trim(), hashtags: [] };
}
