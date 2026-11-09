/**
 * Entry point – run the social post pipeline
 */

import { config } from "./config.js";
import { getFarm } from "./services/database.js";
import { generateCopy } from "./services/claude.js";
import { buildCardUrl, buildFarmUrl } from "./services/card.js";
import { publishPost } from "./services/ayrshare.js";

/**
 * What a run did, so the caller can tell the three apart.
 *
 * The first version returned void and the handler answered `{ok: true}`
 * whichever happened, so a cron that posted nothing at all looked exactly
 * like a cron that published. Anything watching this endpoint was watching
 * it succeed at doing nothing.
 */
export type RunResult =
  | { status: "published" | "dry-run"; farm: string }
  | { status: "skipped"; reason: string };

export async function run(): Promise<RunResult> {
  const farm = await getFarm();
  if (!farm) {
    console.warn("No farm source configured, skipping.");
    return { status: "skipped", reason: "no farm source configured" };
  }

  const copy = await generateCopy(farm);
  // The site draws the card; there is no image model in this pipeline.
  const imageUrl = buildCardUrl(farm, config.siteUrl);
  console.log(`${farm.name}: ${buildFarmUrl(farm, config.siteUrl)}`);
  await publishPost(copy, imageUrl);
  return { status: config.publish ? "published" : "dry-run", farm: farm.name };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Vercel serverless / cron entry.
 *
 * The path is public, so it is gated on the shared secret Vercel sends with a
 * scheduled invocation. It fails closed: with no `CRON_SECRET` configured
 * nothing runs, because an unauthenticated endpoint that posts to live social
 * accounts is worse than a cron that does not fire. Today the pipeline stops
 * early at `getFarm` and publishing is off by default, so there is nothing to
 * abuse yet; the gate is here so that stays true when those change.
 *
 * A plain comparison is deliberate. The secret is high entropy and this is one
 * HTTPS request per attempt, so a timing side channel is not a realistic route
 * in; this matches Vercel's own documented pattern.
 */
export default async function handler(req: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const result = await run();
    return json({ ok: true, ...result }, 200);
  } catch (err) {
    // Logged in full for us, generic for the caller: the message can name
    // environment variables and internal hosts.
    console.error(err);
    return json({ ok: false, error: "Internal error" }, 500);
  }
}
