/**
 * The post image: our own Rotocalco Press card, not a generated illustration.
 *
 * This replaces the Runware call the skeleton planned for. A poster house
 * prints one plate and overprints different type per subject, and the site
 * already does exactly that at `/og`: a farm's own map plate behind its name,
 * in the house palette and display face. Asking an image model for a fresh
 * illustration per post would cost money per post, vary in quality, and make
 * the feed look like a stock library instead of one press.
 *
 * So there is no image generation here at all, and no Runware key to hold.
 * The daemon just asks the site for the card it already knows how to draw.
 */

import type { Farm } from "../types.js";

/**
 * Only farm slugs are allowed into the URL. The card route validates this
 * again at its end, and so does this one: the same slug reached a path there,
 * and a slug that can carry `..` or `#` escapes the directory it is meant to
 * sit in.
 */
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;

export function isSlug(value: string | undefined): value is string {
  return typeof value === "string" && SLUG.test(value);
}

/**
 * Build the 1.91:1 link card URL for a farm.
 *
 * `plate` is only requested when the slug is well formed; the card falls back
 * to its fixed motif for any farm whose plate has not been generated, so a
 * missing plate is never an error here.
 */
export function buildCardUrl(farm: Farm, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({ farmName: farm.name, type: "farm" });
  if (farm.county) params.set("county", farm.county);
  if (isSlug(farm.slug)) params.set("plate", farm.slug);
  if (farm.canClaim) params.set("canClaim", "1");
  return `${base}/og?${params.toString()}`;
}

/** The page the post should link to. */
export function buildFarmUrl(farm: Farm, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  return isSlug(farm.slug) ? `${base}/shop/${farm.slug}` : base;
}
