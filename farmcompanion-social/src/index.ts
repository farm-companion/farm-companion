/**
 * Entry point – run the social post pipeline
 */

import { config } from "./config.js";
import { getFarm } from "./services/database.js";
import { generateCopy } from "./services/claude.js";
import { buildCardUrl, buildFarmUrl } from "./services/card.js";
import { publishPost } from "./services/ayrshare.js";

export async function run(): Promise<void> {
  const farm = await getFarm();
  if (!farm) {
    console.warn("No farm found, skipping.");
    return;
  }

  const copy = await generateCopy(farm);
  // The site draws the card; there is no image model in this pipeline.
  const imageUrl = buildCardUrl(farm, config.siteUrl);
  console.log(`${farm.name}: ${buildFarmUrl(farm, config.siteUrl)}`);
  await publishPost(copy, imageUrl);
}

// Vercel serverless / cron entry
export default async function handler(
  _req: Request,
): Promise<Response> {
  try {
    await run();
    return new Response(JSON.stringify({ ok: true, published: config.publish }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
