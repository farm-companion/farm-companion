/**
 * Distribute posts to social platforms via Ayrshare
 */

import { config } from "../config.js";
import type { SocialCopy } from "../types.js";

const ENDPOINT = "https://api.ayrshare.com/api/post";

export interface AyrsharePayload {
  post: string;
  platforms: string[];
  mediaUrls?: string[];
}

/**
 * Compose the payload. Pure, so the exact text and media that would go out
 * can be asserted in a test and printed by a dry run without posting.
 */
export function buildAyrsharePayload(
  copy: SocialCopy,
  platforms: string[],
  imageUrl?: string,
): AyrsharePayload {
  const post = [copy.caption?.trim(), copy.hashtags?.join(" ").trim()]
    .filter((part) => part && part.length > 0)
    .join("\n\n");
  return {
    post,
    platforms,
    ...(imageUrl ? { mediaUrls: [imageUrl] } : {}),
  };
}

export class EmptyPostError extends Error {}

/**
 * Publish, or describe what publishing would do.
 *
 * Nothing leaves this process unless `SOCIAL_PUBLISH=true`. See config.
 */
export async function publishPost(
  copy: SocialCopy,
  imageUrl?: string,
): Promise<AyrsharePayload> {
  const payload = buildAyrsharePayload(copy, [...config.platforms], imageUrl);

  // An empty caption would post a bare image, or on some platforms nothing at
  // all, and it means the copy step failed rather than produced nothing.
  if (payload.post.length === 0) {
    throw new EmptyPostError("Refusing to publish: the generated copy was empty");
  }

  if (!config.publish) {
    console.log("[dry run] SOCIAL_PUBLISH is not 'true'. Would have posted:");
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.ayrshareApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ayrshare ${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }

  console.log(`Posted to ${payload.platforms.join(", ")}`);
  return payload;
}
