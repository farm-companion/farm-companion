/**
 * Generate social copy using Claude
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { Farm, SocialCopy } from "../types.js";
import { getSocialCopyPrompt } from "../prompts/social-copy.js";

/**
 * Built on first use, not at import.
 *
 * Constructing it at module scope read `config.anthropicApiKey` as soon as
 * anything imported this file, which meant the cron handler could not even be
 * loaded in a test without a live key. Making the config lazy was not enough
 * while its consumer was still eager.
 */
/**
 * Overridable, because a pinned dated snapshot is one retirement away from
 * failing every cron run with model_not_found until somebody ships a
 * one-character change.
 */
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

export async function generateCopy(farm: Farm): Promise<SocialCopy> {
  const prompt = getSocialCopyPrompt(farm);
  const response = await getClient().messages.create({
    model: MODEL,
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
