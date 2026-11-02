/**
 * Environment config – load from .env.local
 */

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}

function envOptional(key: string): string | undefined {
  return process.env[key];
}

/**
 * Platforms the 1.91:1 link card actually suits.
 *
 * Pinterest wants 2:3 and Instagram 4:5; posting a landscape card to either
 * gets it letterboxed or cropped, so they stay off this list until those
 * formats exist on the card route. Ayrshare makes adding them a one-line
 * change at that point.
 */
const DEFAULT_PLATFORMS = ["twitter", "facebook"];

/**
 * Values are read on access, not at import.
 *
 * The first version called `env()` while the module loaded, so importing any
 * file that touched config threw `Missing env: ANTHROPIC_API_KEY` before a
 * single line ran. That makes the package untestable without live secrets and
 * turns one missing variable into a crash on import rather than an error at
 * the point of use. Getters keep the same call sites working.
 */
export const config = {
  // Database
  get databaseUrl() {
    return envOptional("DATABASE_URL");
  },

  // Claude
  get anthropicApiKey() {
    return env("ANTHROPIC_API_KEY");
  },

  // The site renders the post image itself at /og, so there is no image model
  // here and no key to hold. See services/card.ts.
  get siteUrl() {
    return envOptional("SITE_URL") ?? "https://www.farmcompanion.co.uk";
  },

  // Ayrshare (distribution)
  get ayrshareApiKey() {
    return env("AYRSHARE_API_KEY");
  },
  get platforms(): string[] {
    return (envOptional("SOCIAL_PLATFORMS") ?? DEFAULT_PLATFORMS.join(","))
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  },

  /**
   * Posting is OFF unless SOCIAL_PUBLISH is exactly "true".
   *
   * Default-off on purpose: this runs on a cron against live accounts, and
   * the failure mode of a default-on misconfiguration is a public post that
   * cannot be unsent. A dry run logs the exact payload instead.
   */
  get publish(): boolean {
    return envOptional("SOCIAL_PUBLISH") === "true";
  },
};
