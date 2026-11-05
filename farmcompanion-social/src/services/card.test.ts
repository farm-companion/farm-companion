import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCardUrl, buildFarmUrl, isSlug } from "./card.js";
import type { Farm } from "../types.js";

const FARM: Farm = {
  id: "1",
  name: "Boscastle Farm Shop & Cafe",
  slug: "boscastle-farm-shop-cafe",
  county: "Cornwall",
};

test("the card url carries the farm, its county and its plate", () => {
  const url = new URL(buildCardUrl(FARM, "https://www.farmcompanion.co.uk"));
  assert.equal(url.pathname, "/og");
  assert.equal(url.searchParams.get("farmName"), "Boscastle Farm Shop & Cafe");
  assert.equal(url.searchParams.get("county"), "Cornwall");
  assert.equal(url.searchParams.get("plate"), "boscastle-farm-shop-cafe");
  assert.equal(url.searchParams.get("type"), "farm");
});

test("the ampersand in a farm name is encoded, not left to split the query", () => {
  const raw = buildCardUrl(FARM, "https://example.com");
  assert.ok(!raw.includes("Shop & Cafe"), "a bare ampersand would truncate farmName");
  assert.equal(
    new URL(raw).searchParams.get("farmName"),
    "Boscastle Farm Shop & Cafe",
  );
});

test("canClaim is only sent when the farm has earned it", () => {
  assert.equal(new URL(buildCardUrl(FARM, "https://e.com")).searchParams.get("canClaim"), null);
  const claimed = buildCardUrl({ ...FARM, canClaim: true }, "https://e.com");
  assert.equal(new URL(claimed).searchParams.get("canClaim"), "1");
});

test("a malformed slug is dropped rather than passed into the url", () => {
  for (const slug of ["../../api/health#", "Caps-Slug", "has space", "a/b", ""]) {
    const url = new URL(buildCardUrl({ ...FARM, slug }, "https://e.com"));
    assert.equal(url.searchParams.get("plate"), null, `${JSON.stringify(slug)} must not be sent`);
  }
  assert.equal(isSlug("boscastle-farm-shop-cafe"), true);
});

test("a trailing slash on the site url does not produce a double slash", () => {
  assert.ok(buildCardUrl(FARM, "https://e.com/").startsWith("https://e.com/og?"));
  assert.equal(buildFarmUrl(FARM, "https://e.com/"), "https://e.com/shop/boscastle-farm-shop-cafe");
});

test("a farm with no usable slug links to the site root, not to /shop/undefined", () => {
  assert.equal(buildFarmUrl({ id: "2", name: "Nameless" }, "https://e.com"), "https://e.com");
});
